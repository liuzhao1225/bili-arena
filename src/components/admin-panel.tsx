"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTopic, updateTopic, deleteTopic } from "@/actions/topic";
import { claimFirstAdmin, setVideoDeleted } from "@/actions/admin";
import type { Topic } from "@/lib/db-types";

type VideoRow = { id: string; topic_id: string; bvid: string; title: string; status: string };

export function AdminPanel({
  isAdmin,
  canClaimAdmin,
  topics,
  videosByTopic,
}: {
  isAdmin: boolean;
  canClaimAdmin: boolean;
  topics: Topic[];
  videosByTopic: Record<string, VideoRow[]>;
}) {
  const [claiming, setClaiming] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleClaimAdmin() {
    setClaiming(true);
    setError(null);
    const res = await claimFirstAdmin();
    setClaiming(false);
    if (res.error) setError(res.error);
    else window.location.reload();
  }

  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);
    const res = await createTopic(createName, createDesc);
    setCreateLoading(false);
    if (res.error) setError(res.error);
    else {
      setCreateName("");
      setCreateDesc("");
      window.location.reload();
    }
  }

  async function handleUpdateTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!editTopic) return;
    setError(null);
    const res = await updateTopic(editTopic.id, editName, editDesc);
    if (res.error) setError(res.error);
    else {
      setEditTopic(null);
      window.location.reload();
    }
  }

  async function handleDeleteTopic(id: string) {
    if (!confirm("确定删除该专题？其下视频与投票将一并删除。")) return;
    setError(null);
    const res = await deleteTopic(id);
    if (res.error) setError(res.error);
    else window.location.reload();
  }

  async function handleToggleVideo(v: VideoRow) {
    setError(null);
    const res = await setVideoDeleted(v.id, v.status !== "deleted");
    if (res.error) setError(res.error);
    else window.location.reload();
  }

  if (!isAdmin && canClaimAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>成为首个管理员</CardTitle>
          <CardDescription>当前尚无管理员，点击下方按钮将自己设为首个管理员。</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          <Button onClick={handleClaimAdmin} disabled={claiming}>
            {claiming ? "处理中…" : "成为管理员"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>新建专题</CardTitle>
          <CardDescription>填写名称与简介，slug 将自动生成。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTopic} className="flex max-w-md flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">简介</Label>
              <Input
                id="desc"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={createLoading}>
              {createLoading ? "创建中…" : "创建专题"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>专题列表</CardTitle>
          <CardDescription>编辑、删除专题，或管理其下视频。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {topics.map((t) => (
            <div key={t.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground ml-2 text-sm">/{t.slug}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditTopic(t); setEditName(t.name); setEditDesc(t.description ?? ""); }}>
                    编辑
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteTopic(t.id)}>
                    删除
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/topic/${t.slug}`}>查看</Link>
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>视频</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="w-24">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(videosByTopic[t.id] ?? []).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="line-clamp-1">{v.title || v.bvid}</TableCell>
                      <TableCell>{v.status === "deleted" ? "已隐藏" : "显示"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleVideo(v)}
                        >
                          {v.status === "deleted" ? "恢复" : "隐藏"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!editTopic} onOpenChange={(open) => !open && setEditTopic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑专题</DialogTitle>
          </DialogHeader>
          {editTopic && (
            <form onSubmit={handleUpdateTopic} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">名称</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">简介</Label>
                <Input
                  id="edit-desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              <Button type="submit">保存</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
