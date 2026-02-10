-- 添加 username 列（唯一、可为空 — 兼容已有的 OAuth/魔法链接用户）
alter table public.profiles add column username text unique;

-- 更新 trigger：注册时如果 meta 中带 username 就写入
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$ language plpgsql security definer;
