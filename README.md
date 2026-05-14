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
        E["Notion Tools<br/>6 tools"]
        F["Backlog Tools<br/>6 tools"]
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
    C --> E
    C --> F
    C -.-> G
    D --> H
    E --> I
    F --> J
    G -.-> K
    L -->|HTTP + API Key| B
```

---

## 中文

### 简介

J-MCP Server 是一个基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 的服务器，用于将日本职场常用工具（Slack、Notion、Backlog、Obsidian）集成到 Claude AI 工作流中。

**Phase 1** 已实现 Slack 集成（4 个工具），**Phase 2** 已实现 Notion 集成（6 个工具），**Phase 3** 已实现 Backlog 集成（6 个工具）。

### 快速开始

```bash
# 1. 克隆并进入项目
cd j-mcp-server

# 2. 安装 Server 依赖
cd server && npm install

# 3. 配置环境变量
cp ../.env.example .env
# 编辑 .env，填入你的 Token 和 API Key

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
        "SLACK_USER_TOKEN": "xoxp-你的user-token",
        "NOTION_API_KEY": "ntn_你的api-key",
        "BACKLOG_SPACE_URL": "https://你的空间.backlog.com",
        "BACKLOG_API_KEY": "你的backlog-api-key"
      }
    }
  }
}
```

### 工具 API 参考

#### Slack 工具

| 工具名 | 功能 | 参数 | 返回 |
|--------|------|------|------|
| `slack_list_channels` | 列出频道 | `limit?: number` | 频道列表（id, name, topic, memberCount） |
| `slack_search_messages` | 搜索消息 | `query: string`, `channel?: string`, `count?: number` | 消息列表（text, user, channel, timestamp, permalink） |
| `slack_post_message` | 发送消息 | `channel: string`, `text: string` | 发送结果（ok, channel, timestamp） |
| `slack_summarize_thread` | 获取讨论串 | `channel: string`, `thread_ts: string` | 回复列表（user, text, timestamp） |

> **注意：** `slack_search_messages` 需要 User Token（`xoxp-`），Bot Token 不支持 search API。

#### Notion 工具

| 工具名 | 功能 | 参数 | 返回 |
|--------|------|------|------|
| `notion_search` | 全局搜索 | `query: string`, `filter?: "page"\|"database"`, `page_size?: number` | 搜索结果列表 |
| `notion_list_databases` | 列出数据库 | `page_size?: number` | 数据库列表（id, title, url） |
| `notion_query_database` | 查询数据库 | `database_id: string`, `filter?: object`, `sorts?: array`, `page_size?: number` | 页面列表 |
| `notion_get_page` | 获取页面 | `page_id: string` | 页面属性和内容 |
| `notion_create_page` | 创建页面 | `parent_id: string`, `parent_type: string`, `properties: object`, `children?: array` | 创建结果 |
| `notion_update_page` | 更新页面 | `page_id: string`, `properties: object` | 更新结果 |

#### Backlog 工具

| 工具名 | 功能 | 参数 | 返回 |
|--------|------|------|------|
| `backlog_list_projects` | 列出项目 | `include_metadata?: boolean` | 项目列表（含课题类型、状态、优先级） |
| `backlog_search_issues` | 搜索课题 | `project_id?: number`, `keyword?: string`, `status_id?: number[]`, `count?: number` | 课题列表 |
| `backlog_get_issue` | 获取课题详情 | `issue_id_or_key: string` | 课题详情及评论 |
| `backlog_create_issue` | 创建课题 | `project_id: number`, `summary: string`, `issue_type_id: number`, `priority_id: number`, ... | 创建结果 |
| `backlog_update_issue` | 更新课题 | `issue_id_or_key: string`, `summary?: string`, `status_id?: number`, ... | 更新结果 |
| `backlog_add_comment` | 添加评论 | `issue_id_or_key: string`, `content: string` | 评论结果 |

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `SLACK_BOT_TOKEN` | 否 | Slack Bot 用户 OAuth Token (xoxb-...) |
| `SLACK_USER_TOKEN` | 否 | Slack 用户 Token (xoxp-...)，搜索功能需要 |
| `SLACK_DEFAULT_CHANNEL` | 否 | 默认频道（默认: general） |
| `SLACK_ALLOWED_CHANNELS` | 否 | 允许发消息的频道白名单，逗号分隔，为空则不限制 |
| `NOTION_API_KEY` | 否 | Notion Internal Integration Token |
| `BACKLOG_SPACE_URL` | 否 | Backlog 空间 URL（如 `https://xxx.backlog.com`） |
| `BACKLOG_API_KEY` | 否 | Backlog API Key |
| `API_KEY` | 否 | Dashboard HTTP API 认证密钥 |
| `SERVER_PORT` | 否 | HTTP API 端口（默认: 3001） |

---

## 日本語

### 概要

J-MCP Server は [Model Context Protocol (MCP)](https://modelcontextprotocol.io) ベースのサーバーで、日本の職場で一般的に使用されるツール（Slack、Notion、Backlog、Obsidian）を Claude AI ワークフローに統合します。

**Phase 1** では Slack 連携（4ツール）、**Phase 2** では Notion 連携（6ツール）、**Phase 3** では Backlog 連携（6ツール）を実装しています。

### クイックスタート

```bash
# 1. プロジェクトに移動
cd j-mcp-server

# 2. サーバーの依存関係をインストール
cd server && npm install

# 3. 環境変数を設定
cp ../.env.example .env
# .env を編集し、Token と API Key を入力

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
        "SLACK_USER_TOKEN": "xoxp-あなたのユーザートークン",
        "NOTION_API_KEY": "ntn_あなたのAPIキー",
        "BACKLOG_SPACE_URL": "https://あなたのスペース.backlog.com",
        "BACKLOG_API_KEY": "あなたのBacklog APIキー"
      }
    }
  }
}
```

### ツール API リファレンス

#### Slack ツール

| ツール名 | 機能 | パラメータ | 戻り値 |
|----------|------|-----------|--------|
| `slack_list_channels` | チャンネル一覧取得 | `limit?: number` | チャンネル一覧（id, name, topic, memberCount） |
| `slack_search_messages` | メッセージ検索 | `query: string`, `channel?: string`, `count?: number` | メッセージ一覧（text, user, channel, timestamp, permalink） |
| `slack_post_message` | メッセージ投稿 | `channel: string`, `text: string` | 送信結果（ok, channel, timestamp） |
| `slack_summarize_thread` | スレッド取得 | `channel: string`, `thread_ts: string` | 返信一覧（user, text, timestamp） |

> **注意：** `slack_search_messages` は User Token（`xoxp-`）が必要です。Bot Token は search API をサポートしていません。

#### Notion ツール

| ツール名 | 機能 | パラメータ | 戻り値 |
|----------|------|-----------|--------|
| `notion_search` | グローバル検索 | `query: string`, `filter?: "page"\|"database"`, `page_size?: number` | 検索結果一覧 |
| `notion_list_databases` | データベース一覧取得 | `page_size?: number` | データベース一覧（id, title, url） |
| `notion_query_database` | データベースクエリ | `database_id: string`, `filter?: object`, `sorts?: array`, `page_size?: number` | ページ一覧 |
| `notion_get_page` | ページ取得 | `page_id: string` | ページプロパティとコンテンツ |
| `notion_create_page` | ページ作成 | `parent_id: string`, `parent_type: string`, `properties: object`, `children?: array` | 作成結果 |
| `notion_update_page` | ページ更新 | `page_id: string`, `properties: object` | 更新結果 |

#### Backlog ツール

| ツール名 | 機能 | パラメータ | 戻り値 |
|----------|------|-----------|--------|
| `backlog_list_projects` | プロジェクト一覧取得 | `include_metadata?: boolean` | プロジェクト一覧（課題種別・ステータス・優先度付き） |
| `backlog_search_issues` | 課題検索 | `project_id?: number`, `keyword?: string`, `status_id?: number[]`, `count?: number` | 課題一覧 |
| `backlog_get_issue` | 課題詳細取得 | `issue_id_or_key: string` | 課題詳細とコメント |
| `backlog_create_issue` | 課題作成 | `project_id: number`, `summary: string`, `issue_type_id: number`, `priority_id: number`, ... | 作成結果 |
| `backlog_update_issue` | 課題更新 | `issue_id_or_key: string`, `summary?: string`, `status_id?: number`, ... | 更新結果 |
| `backlog_add_comment` | コメント追加 | `issue_id_or_key: string`, `content: string` | コメント結果 |

### 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `SLACK_BOT_TOKEN` | いいえ | Slack Bot ユーザー OAuth トークン (xoxb-...) |
| `SLACK_USER_TOKEN` | いいえ | Slack ユーザートークン (xoxp-...)、検索機能に必要 |
| `SLACK_DEFAULT_CHANNEL` | いいえ | デフォルトチャンネル（デフォルト: general） |
| `SLACK_ALLOWED_CHANNELS` | いいえ | メッセージ送信を許可するチャンネルのホワイトリスト（カンマ区切り） |
| `NOTION_API_KEY` | いいえ | Notion Internal Integration トークン |
| `BACKLOG_SPACE_URL` | いいえ | Backlog スペース URL（例: `https://xxx.backlog.com`） |
| `BACKLOG_API_KEY` | いいえ | Backlog API キー |
| `API_KEY` | いいえ | ダッシュボード HTTP API 認証キー |
| `SERVER_PORT` | いいえ | HTTP API ポート（デフォルト: 3001） |

---

## English

### Overview

J-MCP Server is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that integrates common Japanese workplace tools (Slack, Notion, Backlog, Obsidian) into the Claude AI workflow.

**Phase 1** implements Slack integration (4 tools), **Phase 2** implements Notion integration (6 tools), **Phase 3** implements Backlog integration (6 tools).

### Quick Start

```bash
# 1. Navigate to the project
cd j-mcp-server

# 2. Install server dependencies
cd server && npm install

# 3. Configure environment variables
cp ../.env.example .env
# Edit .env with your tokens and API keys

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
        "SLACK_USER_TOKEN": "xoxp-your-user-token",
        "NOTION_API_KEY": "ntn_your-api-key",
        "BACKLOG_SPACE_URL": "https://yourspace.backlog.com",
        "BACKLOG_API_KEY": "your-backlog-api-key"
      }
    }
  }
}
```

### Tool API Reference

#### Slack Tools

| Tool | Function | Parameters | Returns |
|------|----------|-----------|---------|
| `slack_list_channels` | List channels | `limit?: number` | Channel list (id, name, topic, memberCount) |
| `slack_search_messages` | Search messages | `query: string`, `channel?: string`, `count?: number` | Message list (text, user, channel, timestamp, permalink) |
| `slack_post_message` | Post message | `channel: string`, `text: string` | Post result (ok, channel, timestamp) |
| `slack_summarize_thread` | Get thread replies | `channel: string`, `thread_ts: string` | Reply list (user, text, timestamp) |

> **Note:** `slack_search_messages` requires a User Token (`xoxp-`). Bot Tokens do not support the search API.

#### Notion Tools

| Tool | Function | Parameters | Returns |
|------|----------|-----------|---------|
| `notion_search` | Global search | `query: string`, `filter?: "page"\|"database"`, `page_size?: number` | Search results |
| `notion_list_databases` | List databases | `page_size?: number` | Database list (id, title, url) |
| `notion_query_database` | Query database | `database_id: string`, `filter?: object`, `sorts?: array`, `page_size?: number` | Page list |
| `notion_get_page` | Get page | `page_id: string` | Page properties and content |
| `notion_create_page` | Create page | `parent_id: string`, `parent_type: string`, `properties: object`, `children?: array` | Created page |
| `notion_update_page` | Update page | `page_id: string`, `properties: object` | Updated page |

#### Backlog Tools

| Tool | Function | Parameters | Returns |
|------|----------|-----------|---------|
| `backlog_list_projects` | List projects | `include_metadata?: boolean` | Project list (with issue types, statuses, priorities) |
| `backlog_search_issues` | Search issues | `project_id?: number`, `keyword?: string`, `status_id?: number[]`, `count?: number` | Issue list |
| `backlog_get_issue` | Get issue details | `issue_id_or_key: string` | Issue details with comments |
| `backlog_create_issue` | Create issue | `project_id: number`, `summary: string`, `issue_type_id: number`, `priority_id: number`, ... | Created issue |
| `backlog_update_issue` | Update issue | `issue_id_or_key: string`, `summary?: string`, `status_id?: number`, ... | Updated issue |
| `backlog_add_comment` | Add comment | `issue_id_or_key: string`, `content: string` | Comment result |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SLACK_BOT_TOKEN` | No | Slack Bot User OAuth Token (xoxb-...) |
| `SLACK_USER_TOKEN` | No | Slack User Token (xoxp-...), required for search |
| `SLACK_DEFAULT_CHANNEL` | No | Default channel (default: general) |
| `SLACK_ALLOWED_CHANNELS` | No | Comma-separated whitelist of channels for posting |
| `NOTION_API_KEY` | No | Notion Internal Integration Token |
| `BACKLOG_SPACE_URL` | No | Backlog space URL (e.g., `https://xxx.backlog.com`) |
| `BACKLOG_API_KEY` | No | Backlog API Key |
| `API_KEY` | No | Dashboard HTTP API authentication key |
| `SERVER_PORT` | No | HTTP API port (default: 3001) |

---

## Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Slack 連携 / Slack Integration | ✅ Done |
| 2 | Notion 連携 / Notion Integration | ✅ Done |
| 3 | Backlog 連携 / Backlog Integration | ✅ Done |
| 4 | Obsidian 連携 / Obsidian Integration | 🔜 Planned |
| 5 | クロスツール検索 / Cross-tool Search | 🔜 Planned |
| 6 | 日報自動生成 / Daily Report Generation | 🔜 Planned |
| 7 | 敬語レベル調整 / Keigo Level Adjustment | 🔜 Planned |

## Tech Stack

- **MCP Server:** Node.js + TypeScript + `@modelcontextprotocol/sdk`
- **Slack:** `@slack/web-api`
- **Notion:** `@notionhq/client`
- **Frontend:** Next.js 16 + Tailwind CSS v4 + shadcn/ui
- **Theme:** #0052CC (信頼感のある青) + Noto Sans JP

## License

MIT
