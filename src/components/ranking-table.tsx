import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { videoRank, displayScore, matchRecordLabel, type Video } from "@/lib/db-types";

export function RankingTable({
  videos,
  topicSlug,
}: {
  videos: Video[];
  topicSlug: string;
}) {
  const sorted = [...videos].sort((a, b) => videoRank(b) - videoRank(a));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>视频</TableHead>
          <TableHead>UP 主</TableHead>
          <TableHead className="text-right">分数</TableHead>
          <TableHead className="text-right">对局</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((v, i) => (
          <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50">
            <TableCell className="font-medium">{i + 1}</TableCell>
            <TableCell>
              <Link
                href={`/topic/${topicSlug}/video/${v.id}`}
                className="flex items-center gap-3"
              >
                {v.cover && (
                  <div className="aspect-video h-14 w-auto shrink-0 overflow-hidden rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.cover}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <span className="line-clamp-2 font-medium">{v.title}</span>
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{v.up_name ?? "—"}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {displayScore(v)}
            </TableCell>
            <TableCell className="text-right text-sm tabular-nums">
              {matchRecordLabel(v)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
