-- 首个用户可声明为管理员（仅当系统中尚无管理员时）
create or replace function public.claim_first_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.profiles where is_admin) then
    return false;
  end if;
  update public.profiles set is_admin = true where id = auth.uid();
  return found;
end;
$$;
