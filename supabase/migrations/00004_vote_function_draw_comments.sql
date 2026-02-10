-- votes 增加平局标记
alter table public.votes add column if not exists is_draw boolean not null default false;

-- 评论表：按视频
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_video on public.comments(video_id);

alter table public.comments enable row level security;

create policy "comments_read" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() is not null);

-- 投票结果由服务端计算好后写入，避免 RLS 阻止非 admin 更新 videos
create or replace function public.apply_vote_result(
  p_topic_id uuid,
  p_winner_id uuid,
  p_loser_id uuid,
  p_voter_id uuid,
  p_is_draw boolean,
  p_winner_mu float8,
  p_winner_sigma float8,
  p_winner_match_count int,
  p_loser_mu float8,
  p_loser_sigma float8,
  p_loser_match_count int
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.votes (topic_id, winner_id, loser_id, voter_id, is_draw)
  values (p_topic_id, p_winner_id, p_loser_id, p_voter_id, p_is_draw);

  update public.videos set
    trueskill_mu = p_winner_mu,
    trueskill_sigma = p_winner_sigma,
    match_count = p_winner_match_count
  where id = p_winner_id;

  update public.videos set
    trueskill_mu = p_loser_mu,
    trueskill_sigma = p_loser_sigma,
    match_count = p_loser_match_count
  where id = p_loser_id;
end;
$$;
