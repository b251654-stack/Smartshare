import { createClient, type User } from '@supabase/supabase-js';
import type { ProjectRecord } from './projects';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  design: Json;
  created_at: string;
  updated_at: string;
};

type PublicLinkRow = {
  id: string;
  project_id: string;
  owner_id: string;
  token: string;
  password_hash: string | null;
  can_download: boolean;
  expires_at: string | null;
  created_at: string;
};

type ProductEventRow = {
  id: number;
  user_id: string | null;
  event: string;
  metadata: Json;
  created_at: string;
};

type SubscriptionRow = {
  user_id: string;
  provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  plan: 'free' | 'pro' | 'team';
  status: 'inactive' | 'active' | 'trialing' | 'past_due' | 'cancelled';
  current_period_end: string | null;
  updated_at: string;
};

type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: ProjectRow;
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
      public_links: {
        Row: PublicLinkRow;
        Insert: Pick<PublicLinkRow, 'project_id' | 'owner_id' | 'can_download' | 'expires_at'> &
          Partial<Pick<PublicLinkRow, 'token' | 'password_hash'>>;
        Update: Partial<PublicLinkRow>;
        Relationships: [];
      };
      product_events: {
        Row: ProductEventRow;
        Insert: Pick<ProductEventRow, 'user_id' | 'event' | 'metadata'> &
          Partial<Pick<ProductEventRow, 'id' | 'created_at'>>;
        Update: Partial<ProductEventRow>;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: SubscriptionRow;
        Update: Partial<SubscriptionRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_project: {
        Args: { share_token: string };
        Returns: Array<{ id: string; name: string; design: Json }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
  || 'https://xblmhlcigaodtjukmlti.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  || 'sb_publishable_VRMjerXl1kA8wFgjDpFShw_BvEuwFsH';

export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient<Database>(supabaseUrl, supabasePublishableKey)
  : null;

export type AuthUser = User;

export async function hasPremiumSubscription(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || !['pro', 'team'].includes(data.plan)) return false;
  if (!['active', 'trialing'].includes(data.status)) return false;
  return !data.current_period_end || Date.parse(data.current_period_end) > Date.now();
}

export async function listCloudProjects(userId: string): Promise<ProjectRecord<unknown>[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, design, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return data.map(project => ({
    id: project.id,
    name: project.name,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    design: project.design
  }));
}

export async function saveCloudProject(
  userId: string,
  project: ProjectRecord<unknown>
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.from('projects').upsert({
    id: project.id,
    user_id: userId,
    name: project.name,
    design: JSON.parse(JSON.stringify(project.design)) as Json,
    created_at: project.createdAt,
    updated_at: project.updatedAt
  });

  if (error) throw error;
}

export async function removeCloudProject(userId: string, projectId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function uploadDesignAsset(
  userId: string,
  file: File
): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('design-assets')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw error;

  const { data, error: signedUrlError } = await supabase.storage
    .from('design-assets')
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (signedUrlError) throw signedUrlError;
  return data.signedUrl;
}

export async function createPublicProjectLink(
  ownerId: string,
  projectId: string,
  options: { canDownload?: boolean; expiresAt?: string } = {}
): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('public_links')
    .insert({
      project_id: projectId,
      owner_id: ownerId,
      can_download: options.canDownload ?? true,
      expires_at: options.expiresAt ?? null
    })
    .select('token')
    .single();

  if (error) throw error;
  return `${window.location.origin}${window.location.pathname.includes('/Smartshare/') ? '/Smartshare' : ''}/share/${data.token}`;
}

export async function getPublicProject(
  token: string
): Promise<{ id: string; name: string; design: unknown } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_public_project', { share_token: token });
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const project = data[0] as { id: string; name: string; design: unknown };
  return project;
}

export async function trackProductEvent(
  userId: string,
  event: string,
  metadata: Record<string, string | number | boolean> = {}
): Promise<void> {
  if (!supabase) return;
  await supabase.from('product_events').insert({
    user_id: userId,
    event,
    metadata
  });
}

export async function createPhonePeCheckout(
  plan: 'monthly' | 'yearly'
): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke(
    'phonepe-create-order',
    { body: { plan } }
  );

  if (error) throw error;
  if (!data?.checkoutUrl) throw new Error('PhonePe checkout could not be created.');
  return data.checkoutUrl as string;
}
