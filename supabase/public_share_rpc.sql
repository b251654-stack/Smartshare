create or replace function public.get_public_project(share_token text)
returns table (id text, name text, design jsonb)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name, p.design
  from public.public_links l
  join public.projects p on p.id = l.project_id
  where l.token = share_token
    and (l.expires_at is null or l.expires_at > now())
  limit 1;
$$;

revoke all on function public.get_public_project(text) from public;
grant execute on function public.get_public_project(text) to anon, authenticated;
