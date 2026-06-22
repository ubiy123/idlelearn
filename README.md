# IdleLearn 智学谷

免费、开源的 Web 学习平台，专注于成人余闲/碎片时间的系统化学习：投资、理财、小说写作。

## 仓库介绍

| 仓库 | 说明 |
|---|---|
| [idlelearn](https://github.com/ubiy123/idlelearn) | 当前仓库：平台前后端代码 |
| [idlelearn-courses](https://github.com/ubiy123/idlelearn-courses) | 课程内容（CC-BY-SA 4.0） |
| [idlelearn-ai](https://github.com/ubiy123/idlelearn-ai) | DeepSeek AI 点评工具 |

## 技术栈

- 前端：Next.js 14 + Tailwind CSS v4 + shadcn/ui + TipTap + KaTeX
- 后端：FastAPI + PostgreSQL + Redis + Celery + MinIO + Meilisearch
- AI：DeepSeek API (V3/R1)

## 目录结构

```
apps/
  web/          # Next.js 前端项目
  api/          # FastAPI 后端项目（待搭建）
docs/           # PRD、数据库设计等文档
```

## 开发状态

- [x] PRD v1.2
- [x] 数据库设计
- [x] AI 点评模块（idlelearn-ai，4 tests passing）
- [x] Next.js 前端脚手架（apps/web）
- [ ] FastAPI 后端脚手架
- [ ] 投资学第一课内容

## 协议

- 代码：MIT
- 内容：CC-BY-SA 4.0
