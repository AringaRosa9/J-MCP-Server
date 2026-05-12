export interface ToolParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  integration: string;
  params: ToolParam[];
}

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "slack_list_channels",
    description: "Slackワークスペースのチャンネル一覧を取得する",
    integration: "slack",
    params: [
      { name: "limit", type: "number", required: false, description: "取得するチャンネル数の上限" },
    ],
  },
  {
    name: "slack_search_messages",
    description: "Slackメッセージをキーワードで検索する",
    integration: "slack",
    params: [
      { name: "query", type: "string", required: true, description: "検索キーワード" },
      { name: "channel", type: "string", required: false, description: "検索対象のチャンネル名" },
      { name: "count", type: "number", required: false, description: "取得件数（デフォルト20）" },
    ],
  },
  {
    name: "slack_post_message",
    description: "Slackチャンネルにメッセージを投稿する",
    integration: "slack",
    params: [
      { name: "channel", type: "string", required: true, description: "投稿先チャンネル名またはID" },
      { name: "text", type: "string", required: true, description: "投稿するメッセージ本文" },
    ],
  },
  {
    name: "slack_summarize_thread",
    description: "Slackスレッドの全返信を取得する",
    integration: "slack",
    params: [
      { name: "channel", type: "string", required: true, description: "チャンネルID" },
      { name: "thread_ts", type: "string", required: true, description: "スレッドのタイムスタンプ" },
    ],
  },
];
