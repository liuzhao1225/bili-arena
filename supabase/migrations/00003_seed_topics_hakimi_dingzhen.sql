-- 初始专题：哈基米、丁真
insert into public.topics (name, slug, description)
values
  ('哈基米', '哈基米', '哈基米相关音乐与二创合集，一起来投票排名吧'),
  ('丁真', '丁真', '丁真相关二创与鬼畜合集')
on conflict (slug) do nothing;
