import { NextResponse } from "next/server";
import { extractBvid } from "@/lib/bvid";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const raw = typeof body.bvid === "string" ? body.bvid : "";
  const id = extractBvid(raw);
  if (!id) {
    return NextResponse.json(
      { error: "无效的 BV 号" },
      { status: 400 }
    );
  }

  const url = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json(
      { error: "获取视频信息失败" },
      { status: 502 }
    );
  }
  const data = await res.json();
  if (data.code !== 0 || !data.data) {
    return NextResponse.json(
      { error: data.message ?? "视频不存在或不可用" },
      { status: 404 }
    );
  }

  const d = data.data;
  return NextResponse.json({
    bvid: d.bvid ?? id,
    title: d.title ?? "",
    cover: d.pic ?? null,
    up_name: d.owner?.name ?? null,
    up_mid: d.owner?.mid ?? null,
    duration: d.duration ?? null,
  });
}
