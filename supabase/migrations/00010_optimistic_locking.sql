-- 乐观锁：添加 version 列防止并发覆盖
alter table public.videos add column if not exists version integer not null default 0;

-- 删除旧函数（精确匹配旧签名 17 参数）
drop function if exists public.apply_vote_result(uuid,uuid,uuid,uuid,boolean,double precision,double precision,integer,integer,integer,integer,double precision,double precision,integer,integer,integer,integer);
-- 删除可能存在的 11 参数版本
drop function if exists public.apply_vote_result(uuid,uuid,uuid,uuid,boolean,double precision,double precision,integer,double precision,double precision,integer);

-- 重写 apply_vote_result：乐观锁 + SQL 侧计数增量
create function public.apply_vote_result(
  p_topic_id uuid,
  p_winner_id uuid,
  p_loser_id uuid,
  p_voter_id uuid,
  p_is_draw boolean,
  p_winner_mu float8,
  p_winner_sigma float8,
  p_winner_version int,
  p_loser_mu float8,
  p_loser_sigma float8,
  p_loser_version int
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  w_rows int;
  l_rows int;
begin
  update public.videos set
    trueskill_mu = p_winner_mu,
    trueskill_sigma = p_winner_sigma,
    match_count = match_count + 1,
    win_count = win_count + case when p_is_draw then 0 else 1 end,
    draw_count = draw_count + case when p_is_draw then 1 else 0 end,
    version = version + 1
  where id = p_winner_id and version = p_winner_version;
  get diagnostics w_rows = row_count;

  update public.videos set
    trueskill_mu = p_loser_mu,
    trueskill_sigma = p_loser_sigma,
    match_count = match_count + 1,
    loss_count = loss_count + case when p_is_draw then 0 else 1 end,
    draw_count = draw_count + case when p_is_draw then 1 else 0 end,
    version = version + 1
  where id = p_loser_id and version = p_loser_version;
  get diagnostics l_rows = row_count;

  if w_rows = 0 or l_rows = 0 then
    raise exception 'VERSION_CONFLICT';
  end if;

  insert into public.votes (topic_id, winner_id, loser_id, voter_id, is_draw)
  values (p_topic_id, p_winner_id, p_loser_id, p_voter_id, p_is_draw);

  update public.videos set
    trueskill_sigma = least(
      sqrt(trueskill_sigma * trueskill_sigma + 0.0069),
      8.333
    )
  where topic_id = p_topic_id
    and id != p_winner_id
    and id != p_loser_id
    and status = 'active';
end;
$$;
