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
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const webhookUsername = Deno.env.get('PHONEPE_WEBHOOK_USERNAME');
  const webhookPassword = Deno.env.get('PHONEPE_WEBHOOK_PASSWORD');

  if (!supabaseUrl || !serviceRoleKey || !webhookUsername || !webhookPassword) {
    return new Response('Webhook is not configured', { status: 503, headers: corsHeaders });
  }

  const authorization = request.headers.get('Authorization');
  const expected = `Basic ${btoa(`${webhookUsername}:${webhookPassword}`)}`;
  if (!authorization || authorization !== expected) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const payload = await request.json();
  const eventType = String(payload.type ?? payload.event ?? '');
  const merchantOrderId = String(
    payload.payload?.merchantOrderId ??
    payload.merchantOrderId ??
    payload.orderId ??
    '',
  );

  if (!merchantOrderId) {
    return new Response('Missing merchantOrderId', { status: 400, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: order, error: orderError } = await admin
    .from('payment_orders')
    .select('id, user_id, plan, amount_paise')
    .eq('merchant_order_id', merchantOrderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) {
    return new Response('Unknown order', { status: 404, headers: corsHeaders });
  }

  const completed = eventType.toUpperCase().includes('COMPLETED');
  if (completed) {
    await admin.from('payment_orders').update({
      status: 'completed',
      updated_at: new Date().toISOString(),
      metadata: payload,
    }).eq('merchant_order_id', merchantOrderId);

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (order.plan === 'pro_yearly' ? 12 : 1));

    await admin.from('subscriptions').upsert({
      user_id: order.user_id,
      provider: 'phonepe',
      provider_subscription_id: merchantOrderId,
      plan: 'pro',
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else if (eventType.toUpperCase().includes('FAILED')) {
    await admin.from('payment_orders').update({
      status: 'failed',
      updated_at: new Date().toISOString(),
      metadata: payload,
    }).eq('merchant_order_id', merchantOrderId);
  }

  return new Response('ok', { status: 200, headers: corsHeaders });
});
