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
  // ── Slack ──
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
    description: "Slackメッセージをキーワードで検索する（要 User Token）",
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

  // ── Notion ──
  {
    name: "notion_search",
    description: "Notionワークスペース内をキーワードで検索する",
    integration: "notion",
    params: [
      { name: "query", type: "string", required: true, description: "検索キーワード" },
      { name: "filter", type: "string", required: false, description: "フィルタ: page または database" },
      { name: "page_size", type: "number", required: false, description: "取得件数（デフォルト20）" },
    ],
  },
  {
    name: "notion_list_databases",
    description: "アクセス可能なNotionデータベースの一覧を取得する",
    integration: "notion",
    params: [
      { name: "page_size", type: "number", required: false, description: "取得件数（デフォルト20）" },
    ],
  },
  {
    name: "notion_query_database",
    description: "Notionデータベースをクエリして結果を取得する",
    integration: "notion",
    params: [
      { name: "database_id", type: "string", required: true, description: "データベースID" },
      { name: "filter", type: "object", required: false, description: "Notion APIフィルタオブジェクト" },
      { name: "sorts", type: "array", required: false, description: "ソート条件の配列" },
      { name: "page_size", type: "number", required: false, description: "取得件数（デフォルト20）" },
    ],
  },
  {
    name: "notion_get_page",
    description: "Notionページのプロパティとコンテンツを取得する",
    integration: "notion",
    params: [
      { name: "page_id", type: "string", required: true, description: "ページID" },
    ],
  },
  {
    name: "notion_create_page",
    description: "Notionにページを新規作成する",
    integration: "notion",
    params: [
      { name: "parent_id", type: "string", required: true, description: "親データベースまたはページのID" },
      { name: "parent_type", type: "string", required: true, description: "親の種類: database または page" },
      { name: "properties", type: "object", required: true, description: "ページプロパティ（Notion API形式）" },
      { name: "children", type: "array", required: false, description: "ページコンテンツブロック（Notion API形式）" },
    ],
  },
  {
    name: "notion_update_page",
    description: "Notionページのプロパティを更新する",
    integration: "notion",
    params: [
      { name: "page_id", type: "string", required: true, description: "ページID" },
      { name: "properties", type: "object", required: true, description: "更新するプロパティ（Notion API形式）" },
    ],
  },
];

export function getToolDef(name: string): ToolDefinition {
  const def = toolDefinitions.find((t) => t.name === name);
  if (!def) throw new Error(`Tool definition not found: ${name}`);
  return def;
}
