-- profiles: extends auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- topics
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  cover_image text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- videos
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  bvid text not null,
  title text not null,
  cover text,
  up_name text,
  up_mid bigint,
  duration integer,
  topic_id uuid not null references public.topics(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'deleted')),
  trueskill_mu float8 not null default 25.0,
  trueskill_sigma float8 not null default (25.0/3),
  match_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique(bvid, topic_id)
);

create index videos_topic_status on public.videos(topic_id, status);

-- votes
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  winner_id uuid not null references public.videos(id) on delete cascade,
  loser_id uuid not null references public.videos(id) on delete cascade,
  voter_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index votes_topic on public.votes(topic_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.videos enable row level security;
alter table public.votes enable row level security;

-- profiles: read all, update own
create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- topics: read all, insert/update/delete admin only
create policy "topics_read" on public.topics for select using (true);
create policy "topics_insert_admin" on public.topics for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
);
create policy "topics_update_admin" on public.topics for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
);
create policy "topics_delete_admin" on public.topics for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
);

-- videos: read active, insert logged-in, update/delete admin
create policy "videos_read_active" on public.videos for select using (status = 'active');
create policy "videos_read_all_admin" on public.videos for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
);
create policy "videos_insert" on public.videos for insert with check (auth.uid() is not null);
create policy "videos_update_admin" on public.videos for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
);

-- votes: read all, insert logged-in
create policy "votes_read" on public.votes for select using (true);
create policy "votes_insert" on public.votes for insert with check (auth.uid() is not null);
