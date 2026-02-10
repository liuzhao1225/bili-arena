-- 评论回复：parent_id 指向父评论
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;

-- 评论点赞/踩
create table if not exists public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_reactions enable row level security;
create policy "reactions_read" on public.comment_reactions for select using (true);
create policy "reactions_insert" on public.comment_reactions for insert with check (auth.uid() = user_id);
create policy "reactions_update" on public.comment_reactions for update using (auth.uid() = user_id);
create policy "reactions_delete" on public.comment_reactions for delete using (auth.uid() = user_id);
