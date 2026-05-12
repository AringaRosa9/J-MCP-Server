export const integrations = [
  {
    id: "slack",
    name: "Slack",
    description: "Slackワークスペース連携",
    status: "connected" as const,
    details: "stdio transport",
    toolCount: 4,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Notionワークスペース連携",
    status: "coming-soon" as const,
  },
  {
    id: "backlog",
    name: "Backlog",
    description: "Backlogプロジェクト管理連携",
    status: "coming-soon" as const,
  },
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Obsidianローカルナレッジベース連携",
    status: "coming-soon" as const,
  },
];

export const tools = [
  {
    name: "slack_list_channels",
    description: "Slackワークスペースのチャンネル一覧を取得する",
    params: [
      { name: "limit", type: "number?", required: false },
    ],
    active: true,
  },
  {
    name: "slack_search_messages",
    description: "Slackメッセージをキーワードで検索する",
    params: [
      { name: "query", type: "string", required: true },
      { name: "channel", type: "string?", required: false },
      { name: "count", type: "number?", required: false },
    ],
    active: true,
  },
  {
    name: "slack_post_message",
    description: "Slackチャンネルにメッセージを投稿する",
    params: [
      { name: "channel", type: "string", required: true },
      { name: "text", type: "string", required: true },
    ],
    active: true,
  },
  {
    name: "slack_summarize_thread",
    description: "Slackスレッドの全返信を取得する",
    params: [
      { name: "channel", type: "string", required: true },
      { name: "thread_ts", type: "string", required: true },
    ],
    active: true,
  },
];
