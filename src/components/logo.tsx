export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 竞技场盾牌外框 */}
      <path
        d="M16 2L4 8v8c0 7.18 5.12 13.88 12 16 6.88-2.12 12-8.82 12-16V8L16 2z"
        fill="#00A1D6"
        opacity="0.15"
      />
      <path
        d="M16 2L4 8v8c0 7.18 5.12 13.88 12 16 6.88-2.12 12-8.82 12-16V8L16 2z"
        stroke="#00A1D6"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 左闪电 — 蓝 */}
      <path
        d="M11 10l3 5h-3l3 7"
        stroke="#00A1D6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 右闪电 — 粉 */}
      <path
        d="M21 10l-3 5h3l-3 7"
        stroke="#FB7299"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 中心 VS 圆点 */}
      <circle cx="16" cy="15" r="2" fill="#FB7299" />
    </svg>
  );
}
