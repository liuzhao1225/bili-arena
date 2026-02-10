-- apply_vote_result 增加胜/负/平计数参数
create or replace function public.apply_vote_result(
  p_topic_id uuid,
  p_winner_id uuid,
  p_loser_id uuid,
  p_voter_id uuid,
  p_is_draw boolean,
  p_winner_mu float8,
  p_winner_sigma float8,
  p_winner_match_count int,
  p_winner_win_count int,
  p_winner_loss_count int,
  p_winner_draw_count int,
  p_loser_mu float8,
  p_loser_sigma float8,
  p_loser_match_count int,
  p_loser_win_count int,
  p_loser_loss_count int,
  p_loser_draw_count int
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
    match_count = p_winner_match_count,
    win_count = p_winner_win_count,
    loss_count = p_winner_loss_count,
    draw_count = p_winner_draw_count
  where id = p_winner_id;

  update public.videos set
    trueskill_mu = p_loser_mu,
    trueskill_sigma = p_loser_sigma,
    match_count = p_loser_match_count,
    win_count = p_loser_win_count,
    loss_count = p_loser_loss_count,
    draw_count = p_loser_draw_count
  where id = p_loser_id;

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
