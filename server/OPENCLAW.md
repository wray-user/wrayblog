# OpenClaw integration for Wray Blog

## 1. Environment variables

Add these variables to `server/.env` or your PM2 environment:

```bash
SITE_BASE_URL=https://your-domain.example

OPENCLAW_HOOK_URL=http://your-openclaw-host/hooks/agent
OPENCLAW_HOOK_TOKEN=replace-with-openclaw-hook-token
OPENCLAW_NOTIFY_AGENT_ID=replace-with-agent-id
OPENCLAW_NOTIFY_CHANNEL=last
OPENCLAW_NOTIFY_TO=

AGENT_API_TOKEN=replace-with-a-long-random-token
AGENT_ALLOWED_USERS=wray,danta
VISIT_NOTIFY_STEP=10
PUBLISH_LOCK_TTL_SECONDS=300
NOTIFY_TIME_ZONE=Asia/Shanghai
```

Use Node 18 or newer because the notification module uses the built-in `fetch`.

## 2. Blog API endpoints for the Agent

All Agent endpoints require:

```txt
Authorization: Bearer <AGENT_API_TOKEN>
Content-Type: application/json
```

Endpoints:

```txt
GET  /api/agent/schema
POST /api/agent/publish-lock/acquire
POST /api/agent/publish-lock/release
POST /api/agent/posts
PUT  /api/agent/posts/:slug
DELETE /api/agent/posts/:slug?username=<username>
POST /api/agent/study-records
PUT  /api/agent/study-records/:slug
DELETE /api/agent/study-records/:slug?username=<username>
```

Normal publish flow:

```txt
1. GET /api/agent/schema
2. Ask for missing fields based on the content type
3. POST /api/agent/publish-lock/acquire
4. POST /api/agent/posts or /api/agent/study-records
5. POST /api/agent/publish-lock/release
```

If lock acquire returns `423`, tell the user who is publishing and ask them to wait.
Update and delete operations must also acquire the publish lock first, then release it after the operation succeeds or fails.

## 3. One WeChat, one Agent, two directories

Use one Agent per WeChat account. The same Agent can chat and manage the website by using intent routing:

```txt
Default directory: Chat
- Normal conversation, Q&A, planning, writing help.
- Do not call Wray Blog APIs.

Website directory: Wray Blog
- Only enter this directory when the user clearly says things like:
  网站, 博客, 发布, 发文章, 学习记录, 后台, 访问量, 帮我发到网站
- In this directory, call the Wray Blog API tools.
- Before publishing, acquire the publish lock.
- After publishing or cancelling, release the publish lock.
- If the user returns to normal chat, leave Website directory.
```

Suggested Agent system prompt:

```txt
你是我的微信助手，同时负责普通聊天和 Wray Blog 网站管理。

你有两个目录：

1. Chat 目录
默认目录。用于普通聊天、答疑、写作讨论、计划整理。除非用户明确要求管理网站，否则不要调用网站 API。

2. Wray Blog 目录
只有当用户明确说“网站、博客、发布、发文章、学习记录、后台、访问量、帮我发到网站”等意图时才进入。
进入后先读取 /api/agent/schema，判断内容类型：
- 技术分享：需要标题、正文、技术细分、标签可选、公开/私密。
- 心情随笔：需要标题、正文、标签可选、公开/私密。
- 学习记录：需要日期、学习人、学习主题列表、正文、媒体可选、公开/私密。

字段缺失时逐项追问，不要编造。
发布前必须调用 publish-lock/acquire。
如果返回 423，告诉用户当前谁正在发布，需要等待。
发布成功或用户取消后必须调用 publish-lock/release。
```

## 4. Example requests

Acquire lock:

```json
{
  "username": "wray"
}
```

Create a tech post:

```json
{
  "username": "wray",
  "categorySlug": "tech",
  "title": "OpenClaw 接入记录",
  "content": "这里写 Markdown 正文",
  "techTopic": "Ai Agent",
  "tags": ["OpenClaw", "Agent"],
  "visibility": "public",
  "published": true
}
```

Create a study record:

```json
{
  "username": "danta",
  "studyDate": "2026-05-12",
  "studyUser": "danta",
  "topics": [
    {
      "name": "React",
      "minutes": 60,
      "category": "前端",
      "note": "学习组件状态管理"
    }
  ],
  "content": "今天学习了 React 组件拆分。",
  "visibility": "public",
  "published": true
}
```

Update a post:

```json
{
  "username": "wray",
  "categorySlug": "tech",
  "title": "OpenClaw 接入记录",
  "content": "更新后的 Markdown 正文",
  "techTopic": "Ai Agent",
  "tags": ["OpenClaw", "Agent"],
  "visibility": "public",
  "published": true,
  "historyMessage": "OpenClaw 补充接口说明"
}
```

Request:

```txt
PUT /api/agent/posts/openclaw-integration
```

Delete a post:

```txt
DELETE /api/agent/posts/openclaw-integration?username=wray
```

Update a study record:

```json
{
  "username": "danta",
  "studyDate": "2026-05-12",
  "studyUser": "danta",
  "topics": [
    {
      "name": "React",
      "minutes": 90,
      "category": "前端"
    }
  ],
  "content": "今天补充了组件拆分和状态管理。",
  "visibility": "public",
  "published": true
}
```

Request:

```txt
PUT /api/agent/study-records/study-2026-05-12-danta
```

Delete a study record:

```txt
DELETE /api/agent/study-records/study-2026-05-12-danta?username=danta
```
