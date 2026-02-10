import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PkBattle } from "@/components/pk-battle";
import { ArrowLeft } from "lucide-react";

export default async function PkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">请先登录后再参与 PK 投票。</p>
        <Button asChild>
          <Link href={`/login?next=${encodeURIComponent(`/topic/${slug}/pk`)}`}>
            去登录
          </Link>
        </Button>
      </div>
    );
  }

  const { data: topic } = await supabase
    .from("topics")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!topic) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/topic/${slug}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{topic.name} · PK 投票</h1>
      </div>
      <PkBattle topicSlug={slug} />
    </div>
  );
}
