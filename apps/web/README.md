# IdleLearn Web

IdleLearn 智学谷 Web 前\u7aef\u9879\u76ee，基\u4e8e Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui 构\u5efa\u3002

## 目\u5f55\u7ed3\u6784

```
app/
  page.tsx            # 首\u9875
  courses/page.tsx    # 课\u7a0b\u4e2d\u5fc3
  courses/[slug]/page.tsx  # 课\u7a0b\u8be6\u60c5
  dashboard/page.tsx  # 学\u4e60\u4e2d\u5fc3
  community/page.tsx  # 社\u533a（\u5373\u5c06\u4e0a\u7ebf）
  login/page.tsx      # 登\u5f55（\u5373\u5c06\u4e0a\u7ebf）
components/           # 通\u7528\u7ec4\u4ef6
  ui/                 # shadcn/ui 组\u4ef6
  site-header.tsx     # 站\u70b9\u5934\u90e8
  site-footer.tsx     # 站\u70b9\u5e95\u90e8
lib/
  utils.ts            # 工\u5177\u51fd\u6570
  api.ts              # 客\u6237\u7aef API 封\u88c5
```

## 开\u53d1\u8fd0\u884c

```bash
cp .env.example .env.local
npm install
npm run dev
```

打\u5f00 http://localhost:3000 查\u770b\u6548\u679c\u3002

## 构\u5efa

```bash
npm run build
```
