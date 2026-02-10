-- sigma inflation：每次 PK 后，未参与的视频 sigma 微增，便于优先被匹配
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

  -- sigma inflation：未参与本次PK的视频 sigma 微增
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
