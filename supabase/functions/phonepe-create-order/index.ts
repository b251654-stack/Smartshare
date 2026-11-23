import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const clientId = Deno.env.get('PHONEPE_CLIENT_ID');
  const clientSecret = Deno.env.get('PHONEPE_CLIENT_SECRET');
  const merchantId = Deno.env.get('PHONEPE_MERCHANT_ID');

  if (!supabaseUrl || !serviceRoleKey || !clientId || !clientSecret || !merchantId) {
    return new Response(JSON.stringify({
      error: 'PhonePe is not configured. Add the merchant credentials as Supabase Edge Function secrets.',
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { plan } = await request.json();
  const plans: Record<string, { amount: number; name: 'pro_monthly' | 'pro_yearly' }> = {
    monthly: { amount: 29900, name: 'pro_monthly' },
    yearly: { amount: 69900, name: 'pro_yearly' },
  };
  const selected = plans[String(plan)];
  if (!selected) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const merchantOrderId = `SS-${crypto.randomUUID()}`;
  const { error: orderError } = await admin.from('payment_orders').insert({
    user_id: user.id,
    provider: 'phonepe',
    merchant_order_id: merchantOrderId,
    plan: selected.name,
    amount_paise: selected.amount,
  });
  if (orderError) throw orderError;

  const tokenResponse = await fetch(
    'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        client_version: '1',
      }),
    },
  );

  if (!tokenResponse.ok) {
    return new Response(JSON.stringify({ error: 'Could not authenticate with PhonePe' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = await tokenResponse.json();
  const redirectUrl = Deno.env.get('PHONEPE_REDIRECT_URL') ?? 'https://smartshare.in/billing';
  const payResponse = await fetch(
    'https://api.phonepe.com/apis/pg/production/pg/v1/pay',
    {
      method: 'POST',
      headers: {
        'Authorization': `O-Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        'X-Merchant-Id': merchantId,
      },
      body: JSON.stringify({
        merchantOrderId,
        amount: selected.amount,
        paymentFlow: {
          type: 'PG_CHECKOUT',
          merchantUrls: {
            redirectUrl,
            webhookUrl: `${supabaseUrl}/functions/v1/phonepe-webhook`,
          },
        },
      }),
    },
  );

  const payData = await payResponse.json();
  if (!payResponse.ok) {
    await admin.from('payment_orders').update({ status: 'failed' }).eq('merchant_order_id', merchantOrderId);
    return new Response(JSON.stringify({ error: 'PhonePe rejected the checkout request' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await admin.from('payment_orders').update({
    provider_order_id: payData.orderId ?? null,
    checkout_url: payData.redirectUrl ?? payData.url ?? null,
  }).eq('merchant_order_id', merchantOrderId);

  return new Response(JSON.stringify({
    checkoutUrl: payData.redirectUrl ?? payData.url,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
