"use client";

export function BilibiliPlayer({ bvid }: { bvid: string }) {
  const src = `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&autoplay=0&danmaku=0`;
  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={src}
        className="absolute left-0 top-0 h-full w-full rounded border"
        allowFullScreen
        title="B站播放器"
      />
    </div>
  );
}
