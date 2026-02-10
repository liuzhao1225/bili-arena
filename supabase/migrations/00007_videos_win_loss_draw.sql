-- 胜/负/平计数
alter table public.videos
  add column if not exists win_count integer not null default 0,
  add column if not exists loss_count integer not null default 0,
  add column if not exists draw_count integer not null default 0;

-- 从 votes 回填
update public.videos v set
  win_count = (select count(*) from public.votes where winner_id = v.id and (is_draw = false or is_draw is null)),
  loss_count = (select count(*) from public.votes where loser_id = v.id and (is_draw = false or is_draw is null)),
  draw_count = (select count(*) from public.votes where (winner_id = v.id or loser_id = v.id) and is_draw = true)
where v.match_count > 0 and v.win_count = 0 and v.loss_count = 0 and v.draw_count = 0;

update public.videos set match_count = win_count + loss_count + draw_count
where match_count != (win_count + loss_count + draw_count);
