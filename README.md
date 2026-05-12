# J-MCP Server

> **日本語ワークスペースツール統合MCPサーバー**
> **Japanese Workspace Tools Integration MCP Server**
> **日本职场工具集成 MCP 服务器**

[中文](#中文) | [日本語](#日本語) | [English](#english)

---

## Architecture / アーキテクチャ / 系统架构

```mermaid
graph TB
    subgraph Client["MCP Client"]
        A["Claude Desktop / Claude Code"]
    end
    subgraph Server["J-MCP Server"]
        B["MCP Server<br/>@modelcontextprotocol/sdk"]
        C[Tool Registry]
        D["Slack Tools<br/>4 tools"]
        E["Notion Tools<br/>Coming Soon"]
        F["Backlog Tools<br/>Coming Soon"]
        G["Obsidian Tools<br/>Coming Soon"]
    end
    subgraph APIs["External APIs"]
        H[Slack Web API]
        I[Notion API]
        J[Backlog API]
        K[Obsidian Local]
    end
    subgraph Frontend["Dashboard"]
        L["Next.js<br/>管理面板"]
    end

    A <-->|stdio| B
    B --> C
    C --> D
    C -.-> E
    C -.-> F
    C -.-> G
    D --> H
    E -.-> I
    F -.-> J
    G -.-> K
    L -.->|status| B
```

## Tool Call Flow / ツール呼び出しフロー / 工具调用流程

```mermaid
sequenceDiagram
    participant C as Claude Client
    participant S as J-MCP Server
    participant T as Tool Handler
    participant A as Slack API

    C->>S: MCP Request (tool call)
    S->>T: Route to slack_search_messages
    T->>A: search.messages({ query })
    A-->>T: Search results
    T-->>S: Formatted response
    S-->>C: MCP Response (text content)
```

---

## 中文

### 简介

J-MCP Server 是一个基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 的服务器，用于将日本职场常用工具（Slack、Notion、Backlog、Obsidian）集成到 Claude AI 工作流中。

**Phase 1（当前）** 已实现 Slack 集成，提供 4 个 MCP 工具。

### 快速开始

```bash
# 1. 克隆并进入项目
cd j-mcp-server

# 2. 安装 Server 依赖
cd server && npm install

# 3. 配置环境变量
cp ../.env.example .env
# 编辑 .env，填入你的 Slack Bot Token 和 Signing Secret

# 4. 启动开发模式
npm run dev

# 5.（可选）启动前端面板
cd ../frontend && npm install && npm run dev
```

### Claude Desktop 配置

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "j-mcp-server": {
      "command": "npx",
      "args": ["tsx", "/你的路径/j-mcp-server/server/src/index.ts"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-你的token",
        "SLACK_SIGNING_SECRET": "你的secret"
      }
    }
  }
}
```

### 工具 API 参考

| 工具名 | 功能 | 参数 | 返回 |
|--------|------|------|------|
| `slack_list_channels` | 列出频道 | `limit?: number` | 频道列表（id, name, topic, memberCount） |
| `slack_search_messages` | 搜索消息 | `query: string`, `channel?: string`, `count?: number` | 消息列表（text, user, channel, timestamp, permalink） |
| `slack_post_message` | 发送消息 | `channel: string`, `text: string` | 发送结果（ok, channel, timestamp） |
| `slack_summarize_thread` | 获取讨论串 | `channel: string`, `thread_ts: string` | 回复列表（user, text, timestamp） |

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `SLACK_BOT_TOKEN` | 是 | Slack Bot 用户 OAuth Token (xoxb-...) |
| `SLACK_SIGNING_SECRET` | 是 | Slack App 签名密钥 |
| `SLACK_DEFAULT_CHANNEL` | 否 | 默认频道（默认: general） |

---

## 日本語

### 概要

J-MCP Server は [Model Context Protocol (MCP)](https://modelcontextprotocol.io) ベースのサーバーで、日本の職場で一般的に使用されるツール（Slack、Notion、Backlog、Obsidian）を Claude AI ワークフローに統合します。

**Phase 1（現在）** では Slack 連携を実装し、4つの MCP ツールを提供しています。

### クイックスタート

```bash
# 1. プロジェクトに移動
cd j-mcp-server

# 2. サーバーの依存関係をインストール
cd server && npm install

# 3. 環境変数を設定
cp ../.env.example .env
# .env を編集し、Slack Bot Token と Signing Secret を入力

# 4. 開発モードで起動
npm run dev

# 5.（オプション）フロントエンドダッシュボードを起動
cd ../frontend && npm install && npm run dev
```

### Claude Desktop 設定

`claude_desktop_config.json` に以下を追加：

```json
{
  "mcpServers": {
    "j-mcp-server": {
      "command": "npx",
      "args": ["tsx", "/あなたのパス/j-mcp-server/server/src/index.ts"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-あなたのトークン",
        "SLACK_SIGNING_SECRET": "あなたのシークレット"
      }
    }
  }
}
```

### ツール API リファレンス

| ツール名 | 機能 | パラメータ | 戻り値 |
|----------|------|-----------|--------|
| `slack_list_channels` | チャンネル一覧取得 | `limit?: number` | チャンネル一覧（id, name, topic, memberCount） |
| `slack_search_messages` | メッセージ検索 | `query: string`, `channel?: string`, `count?: number` | メッセージ一覧（text, user, channel, timestamp, permalink） |
| `slack_post_message` | メッセージ投稿 | `channel: string`, `text: string` | 送信結果（ok, channel, timestamp） |
| `slack_summarize_thread` | スレッド取得 | `channel: string`, `thread_ts: string` | 返信一覧（user, text, timestamp） |

### 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `SLACK_BOT_TOKEN` | はい | Slack Bot ユーザー OAuth トークン (xoxb-...) |
| `SLACK_SIGNING_SECRET` | はい | Slack App 署名シークレット |
| `SLACK_DEFAULT_CHANNEL` | いいえ | デフォルトチャンネル（デフォルト: general） |

---

## English

### Overview

J-MCP Server is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that integrates common Japanese workplace tools (Slack, Notion, Backlog, Obsidian) into the Claude AI workflow.

**Phase 1 (current)** implements Slack integration with 4 MCP tools.

### Quick Start

```bash
# 1. Navigate to the project
cd j-mcp-server

# 2. Install server dependencies
cd server && npm install

# 3. Configure environment variables
cp ../.env.example .env
# Edit .env with your Slack Bot Token and Signing Secret

# 4. Start in development mode
npm run dev

# 5. (Optional) Start the frontend dashboard
cd ../frontend && npm install && npm run dev
```

### Claude Desktop Configuration

Add the following to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "j-mcp-server": {
      "command": "npx",
      "args": ["tsx", "/your/path/j-mcp-server/server/src/index.ts"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-token",
        "SLACK_SIGNING_SECRET": "your-secret"
      }
    }
  }
}
```

### Tool API Reference

| Tool | Function | Parameters | Returns |
|------|----------|-----------|---------|
| `slack_list_channels` | List channels | `limit?: number` | Channel list (id, name, topic, memberCount) |
| `slack_search_messages` | Search messages | `query: string`, `channel?: string`, `count?: number` | Message list (text, user, channel, timestamp, permalink) |
| `slack_post_message` | Post message | `channel: string`, `text: string` | Post result (ok, channel, timestamp) |
| `slack_summarize_thread` | Get thread replies | `channel: string`, `thread_ts: string` | Reply list (user, text, timestamp) |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SLACK_BOT_TOKEN` | Yes | Slack Bot User OAuth Token (xoxb-...) |
| `SLACK_SIGNING_SECRET` | Yes | Slack App Signing Secret |
| `SLACK_DEFAULT_CHANNEL` | No | Default channel (default: general) |

---

## Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Slack 連携 / Slack Integration | ✅ Done |
| 2 | Notion 連携 / Notion Integration | 🔜 Planned |
| 3 | Backlog 連携 / Backlog Integration | 🔜 Planned |
| 4 | Obsidian 連携 / Obsidian Integration | 🔜 Planned |
| 5 | クロスツール検索 / Cross-tool Search | 🔜 Planned |
| 6 | 日報自動生成 / Daily Report Generation | 🔜 Planned |
| 7 | 敬語レベル調整 / Keigo Level Adjustment | 🔜 Planned |

## Tech Stack

- **MCP Server:** Node.js + TypeScript + `@modelcontextprotocol/sdk`
- **Slack:** `@slack/web-api`
- **Frontend:** Next.js 16 + Tailwind CSS v4 + shadcn/ui
- **Theme:** #0052CC (信頼感のある青) + Noto Sans JP

## License

MIT
