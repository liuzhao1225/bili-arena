"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import {
  addComment,
  getCommentsForVideos,
  toggleReaction,
  type CommentRow,
} from "@/actions/comment";

/* ---------- 工具 ---------- */

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

const COLORS = [
  "bg-[#fb7299]", "bg-[#00a1d6]", "bg-[#6cc788]",
  "bg-[#f29b76]", "bg-[#e47d9f]", "bg-[#6bb3f0]",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "sm" }) {
  const s = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";
  return (
    <div className={`${s} shrink-0 rounded-full ${avatarColor(name)} flex items-center justify-center font-medium text-white`}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

/* ---------- 主组件 ---------- */

export function VideoComments({
  videoId,
  initialComments,
  compact = false,
}: {
  videoId: string;
  initialComments: CommentRow[];
  compact?: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  async function refresh() {
    const fresh = await getCommentsForVideos([videoId]);
    setComments(fresh[videoId] ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    const res = await addComment(videoId, content, replyTo?.id);
    setSubmitting(false);
    if (res.error) return;
    setContent("");
    setReplyTo(null);
    await refresh();
  }

  async function handleReaction(commentId: string, type: "like" | "dislike") {
    await toggleReaction(commentId, type);
    await refresh();
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesMap: Record<string, CommentRow[]> = {};
  for (const c of comments) {
    if (!c.parent_id) continue;
    (repliesMap[c.parent_id] ??= []).push(c);
  }

  const maxH = compact ? "max-h-60" : "";

  return (
    <div className={compact ? "rounded border bg-muted/30 p-3" : "rounded-lg border p-4 sm:p-6"}>
      <h2 className={compact ? "mb-3 text-sm font-medium text-muted-foreground" : "mb-5 text-base font-medium"}>
        评论 {topLevel.length > 0 && <span className="text-muted-foreground font-normal text-sm">({comments.length})</span>}
      </h2>

      {/* 发评论 */}
      <form onSubmit={handleSubmit} className="mb-5 flex items-start gap-3">
        <Avatar name="我" />
        <div className="flex-1 space-y-2">
          {replyTo && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              回复 <span className="font-medium">{replyTo.name}</span>
              <button type="button" className="ml-1 hover:text-foreground" onClick={() => setReplyTo(null)}>✕</button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={replyTo ? `回复 ${replyTo.name}…` : "发一条友善的评论"}
              className="flex-1 rounded-full border bg-muted/40 px-4 py-2 text-sm outline-none transition-colors focus:border-[#00a1d6] focus:bg-background"
            />
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !content.trim()}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {submitting ? "…" : "发布"}
            </Button>
          </div>
        </div>
      </form>

      {/* 评论列表 */}
      <div className={`space-y-1 ${maxH} overflow-y-auto`}>
        {topLevel.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">暂无评论，来说两句</p>
        ) : (
          topLevel.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={repliesMap[c.id] ?? []}
              onReaction={handleReaction}
              onReply={(id, name) => {
                setReplyTo({ id, name });
                setContent("");
              }}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------- 单条评论 ---------- */

function CommentItem({
  comment: c,
  replies,
  onReaction,
  onReply,
  compact,
}: {
  comment: CommentRow;
  replies: CommentRow[];
  onReaction: (id: string, type: "like" | "dislike") => void;
  onReply: (id: string, name: string) => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const name = c.author_name ?? "匿名";
  const visibleReplies = expanded ? replies : replies.slice(0, 2);
  const hiddenCount = replies.length - 2;

  return (
    <div className="flex gap-3 py-3 border-b border-border/40 last:border-b-0">
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        {/* 用户名 + 时间 */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[#00a1d6]">{name}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
        </div>

        {/* 内容 */}
        <p className="mt-1 text-sm leading-relaxed">{c.content}</p>

        {/* 操作栏 */}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <button
            type="button"
            className={`inline-flex items-center gap-1 hover:text-[#00a1d6] ${c.my_reaction === "like" ? "text-[#00a1d6]" : ""}`}
            onClick={() => onReaction(c.id, "like")}
          >
            <ThumbsUp className="size-3.5" />
            {c.likes > 0 && <span>{c.likes}</span>}
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-1 hover:text-muted-foreground/80 ${c.my_reaction === "dislike" ? "text-[#fb7299]" : ""}`}
            onClick={() => onReaction(c.id, "dislike")}
          >
            <ThumbsDown className="size-3.5" />
            {c.dislikes > 0 && <span>{c.dislikes}</span>}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-[#00a1d6]"
            onClick={() => onReply(c.id, name)}
          >
            <MessageSquare className="size-3.5" />
            回复
          </button>
        </div>

        {/* 回复列表 */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-2 rounded bg-muted/20 px-3 py-2">
            {visibleReplies.map((r) => (
              <ReplyItem key={r.id} reply={r} onReaction={onReaction} onReply={onReply} />
            ))}
            {!expanded && hiddenCount > 0 && (
              <button
                type="button"
                className="text-xs text-[#00a1d6] hover:underline"
                onClick={() => setExpanded(true)}
              >
                共{replies.length}条回复，点击查看
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 回复 ---------- */

function ReplyItem({
  reply: r,
  onReaction,
  onReply,
}: {
  reply: CommentRow;
  onReaction: (id: string, type: "like" | "dislike") => void;
  onReply: (id: string, name: string) => void;
}) {
  const name = r.author_name ?? "匿名";
  return (
    <div className="flex gap-2">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#00a1d6]">{name}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
        </div>
        <p className="mt-0.5 text-[13px] leading-relaxed">{r.content}</p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
          <button
            type="button"
            className={`inline-flex items-center gap-0.5 hover:text-[#00a1d6] ${r.my_reaction === "like" ? "text-[#00a1d6]" : ""}`}
            onClick={() => onReaction(r.id, "like")}
          >
            <ThumbsUp className="size-3" />
            {r.likes > 0 && <span>{r.likes}</span>}
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-0.5 hover:text-muted-foreground/80 ${r.my_reaction === "dislike" ? "text-[#fb7299]" : ""}`}
            onClick={() => onReaction(r.id, "dislike")}
          >
            <ThumbsDown className="size-3" />
          </button>
          <button
            type="button"
            className="hover:text-[#00a1d6]"
            onClick={() => onReply(r.id, name)}
          >
            回复
          </button>
        </div>
      </div>
    </div>
  );
}
