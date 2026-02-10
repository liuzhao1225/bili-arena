import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Topic } from "@/lib/db-types";
import { Trophy, PlusCircle } from "lucide-react";

export function TopicCard({
  topic,
  coverUrl,
}: {
  topic: Topic;
  coverUrl?: string | null;
}) {
  const cover = coverUrl ?? topic.cover_image;
  return (
    <Card className="gap-4 overflow-hidden pt-0 pb-4 transition-shadow hover:shadow-md">
      <Link href={`/topic/${topic.slug}`} className="block">
        {cover ? (
          <div className="aspect-video w-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-muted">
            <Trophy className="size-12 text-muted-foreground" />
          </div>
        )}
        <CardHeader className="pt-4">
          <CardTitle>{topic.name}</CardTitle>
          {topic.description && (
            <CardDescription className="line-clamp-2">
              {topic.description}
            </CardDescription>
          )}
        </CardHeader>
      </Link>
      <CardContent className="flex gap-2 pt-0">
        <Button asChild size="sm" className="flex-1 bg-[#00a1d6] text-white hover:bg-[#00a1d6]/90">
          <Link href={`/topic/${topic.slug}`}>排行榜</Link>
        </Button>
        <Button asChild size="sm" className="flex-1 bg-[#fb7299] text-white hover:bg-[#fb7299]/90">
          <Link href={`/topic/${topic.slug}/pk`}>
            <PlusCircle className="mr-1 size-4" />
            PK
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
