import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AdminPanel } from "@/components/admin-panel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin ?? false;
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_admin", true);
  const canClaimAdmin = !admins?.length;

  if (!isAdmin && !canClaimAdmin) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">无管理权限。</p>
        <Button asChild variant="outline">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">管理后台</h1>
      <AdminPanel
        isAdmin={isAdmin}
        canClaimAdmin={canClaimAdmin}
        topics={isAdmin ? await fetchTopics(supabase) : []}
        videosByTopic={isAdmin ? await fetchVideosByTopic(supabase) : {}}
      />
    </div>
  );
}

async function fetchTopics(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("topics")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

async function fetchVideosByTopic(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Record<string, { id: string; topic_id: string; bvid: string; title: string; status: string }[]>> {
  const { data: videos } = await supabase
    .from("videos")
    .select("id, topic_id, bvid, title, status");
  const map: Record<string, { id: string; topic_id: string; bvid: string; title: string; status: string }[]> = {};
  for (const v of videos ?? []) {
    if (!v) continue;
    if (!map[v.topic_id]) map[v.topic_id] = [];
    map[v.topic_id].push({
      id: v.id,
      topic_id: v.topic_id,
      bvid: v.bvid,
      title: v.title,
      status: v.status,
    });
  }
  return map;
}
