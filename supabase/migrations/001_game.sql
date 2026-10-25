-- Run in Supabase SQL Editor. No answer-bearing tables are exposed to browsers.
create table if not exists public.games (
 code text primary key check (code ~ '^[0-9]{6}$'),
 revision bigint not null default 0,
 state jsonb not null,
 updated_at timestamptz not null default now()
);
create table if not exists public.catalog (id integer primary key check(id=1), properties jsonb not null);
create table if not exists public.room_updates (code text primary key references public.games(code) on delete cascade, revision bigint not null);
create table if not exists public.rate_limits (key text primary key, started_at timestamptz not null, hits integer not null);
alter table public.games enable row level security;
alter table public.catalog enable row level security;
alter table public.rate_limits enable row level security;
alter table public.room_updates enable row level security;
create policy "Only revision notifications are public" on public.room_updates for select to anon,authenticated using (true);
grant select on public.room_updates to anon,authenticated;
revoke all on public.games,public.catalog,public.rate_limits from anon,authenticated;
create or replace function public.save_game(room_code text,expected_revision bigint,next_state jsonb) returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.games set state=next_state,revision=expected_revision+1,updated_at=now() where code=room_code and revision=expected_revision;
 if not found then return false; end if;
 insert into public.room_updates(code,revision) values(room_code,expected_revision+1) on conflict(code) do update set revision=excluded.revision;
 return true;
end;$$;
revoke all on function public.save_game(text,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.save_game(text,bigint,jsonb) to service_role;
create or replace function public.consume_rate_limit(bucket_key text,max_hits integer,window_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$
declare total integer;
begin
 insert into public.rate_limits(key,started_at,hits) values(bucket_key,now(),1)
 on conflict(key) do update set hits=case when rate_limits.started_at < now()-make_interval(secs=>window_seconds) then 1 else rate_limits.hits+1 end,
 started_at=case when rate_limits.started_at < now()-make_interval(secs=>window_seconds) then now() else rate_limits.started_at end returning hits into total;
 return total<=max_hits;
end;$$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
do $$ begin alter publication supabase_realtime add table public.room_updates; exception when duplicate_object then null; end $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('property-photos','property-photos',true,8388608,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
