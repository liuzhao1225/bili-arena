# Bili Arena

B站视频 PK 排名平台 —— 用 [TrueSkill](https://www.microsoft.com/en-us/research/project/trueskill-ranking-system/) 算法对 Bilibili 视频进行公正排名。

**在线体验**: [bili-arena.vercel.app](https://bili-arena.vercel.app)

## 功能

- **专题管理** — 按主题组织视频（如「哈基米」「丁真」）
- **PK 投票** — 每次随机配对两个视频，用户选出更好的一方或平局
- **TrueSkill 排名** — 基于微软 TrueSkill 算法，比 ELO 更适合少量对局场景
- **智能配对** — 优先匹配不确定性高、实力接近的视频，最大化每次投票的信息量
- **评论系统** — 支持楼中楼回复和点赞/点踩
- **乐观锁** — 防止并发投票导致评分覆盖

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 (App Router) + React 19 |
| UI | Tailwind CSS 4 + shadcn/ui + Lucide Icons |
| 后端 | Supabase (PostgreSQL + Auth + RLS) |
| 排名 | ts-trueskill |
| 部署 | Vercel |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 填写 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看。

## 项目结构

```
src/
├── app/                  # 页面路由
│   ├── page.tsx          # 首页（专题列表）
│   ├── topic/[slug]/     # 专题详情 / PK / 添加视频
│   ├── login/            # 登录
│   └── admin/            # 管理后台
├── actions/              # Server Actions
│   ├── vote.ts           # 投票 + 配对
│   ├── video.ts          # 视频 CRUD
│   ├── topic.ts          # 专题 CRUD
│   └── comment.ts        # 评论
├── components/           # UI 组件
│   ├── pk-battle.tsx     # PK 对战界面
│   ├── ranking-table.tsx # 排名表
│   └── ...
└── lib/
    ├── trueskill.ts      # TrueSkill 封装
    ├── db-types.ts       # 类型定义 + 分数计算
    └── supabase/         # Supabase 客户端
```

## 排名算法

采用 TrueSkill 评分体系：

- 每个视频有 **μ**（实力估计）和 **σ**（不确定性）两个参数
- 展示分数 = `(μ - 3σ) × 40 + 1000`（ELO 风格，初始 1000 分）
- 未参与对局的视频会有轻微的 σ 膨胀，避免评分过于固化
- 使用乐观锁（version 字段）防止并发投票冲突，冲突时自动重试

## License

MIT
