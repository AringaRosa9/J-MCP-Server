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
  // ── Backlog ──
  {
    name: "backlog_list_projects",
    description: "Backlogプロジェクト一覧を取得する",
    integration: "backlog",
    params: [
      { name: "include_metadata", type: "boolean", required: false, description: "課題種別・ステータス・優先度も取得するか" },
    ],
  },
  {
    name: "backlog_search_issues",
    description: "Backlog課題を検索する",
    integration: "backlog",
    params: [
      { name: "project_id", type: "number", required: false, description: "プロジェクトID" },
      { name: "keyword", type: "string", required: false, description: "検索キーワード" },
      { name: "status_id", type: "array", required: false, description: "ステータスIDの配列" },
      { name: "assignee_id", type: "array", required: false, description: "担当者IDの配列" },
      { name: "count", type: "number", required: false, description: "取得件数（デフォルト20、最大100）" },
    ],
  },
  {
    name: "backlog_get_issue",
    description: "Backlog課題の詳細とコメントを取得する",
    integration: "backlog",
    params: [
      { name: "issue_id_or_key", type: "string", required: true, description: "課題IDまたはキー（例: PROJ-123）" },
    ],
  },
  {
    name: "backlog_create_issue",
    description: "Backlogに課題を新規作成する",
    integration: "backlog",
    params: [
      { name: "project_id", type: "number", required: true, description: "プロジェクトID" },
      { name: "summary", type: "string", required: true, description: "課題の件名" },
      { name: "issue_type_id", type: "number", required: true, description: "課題種別ID" },
      { name: "priority_id", type: "number", required: true, description: "優先度ID" },
      { name: "description", type: "string", required: false, description: "課題の詳細" },
      { name: "assignee_id", type: "number", required: false, description: "担当者ID" },
      { name: "due_date", type: "string", required: false, description: "期限日（YYYY-MM-DD形式）" },
      { name: "start_date", type: "string", required: false, description: "開始日（YYYY-MM-DD形式）" },
    ],
  },
  {
    name: "backlog_update_issue",
    description: "Backlog課題を更新する",
    integration: "backlog",
    params: [
      { name: "issue_id_or_key", type: "string", required: true, description: "課題IDまたはキー（例: PROJ-123）" },
      { name: "summary", type: "string", required: false, description: "件名" },
      { name: "description", type: "string", required: false, description: "詳細" },
      { name: "status_id", type: "number", required: false, description: "ステータスID" },
      { name: "priority_id", type: "number", required: false, description: "優先度ID" },
      { name: "assignee_id", type: "number", required: false, description: "担当者ID" },
      { name: "due_date", type: "string", required: false, description: "期限日（YYYY-MM-DD形式）" },
      { name: "start_date", type: "string", required: false, description: "開始日（YYYY-MM-DD形式）" },
    ],
  },
  {
    name: "backlog_add_comment",
    description: "Backlog課題にコメントを追加する",
    integration: "backlog",
    params: [
      { name: "issue_id_or_key", type: "string", required: true, description: "課題IDまたはキー（例: PROJ-123）" },
      { name: "content", type: "string", required: true, description: "コメント本文" },
    ],
  },

  // ── Cross-tool ──
  {
    name: "cross_search",
    description: "全ツールを横断してキーワード検索する（Slack・Notion・Backlog）",
    integration: "cross",
    params: [
      { name: "query", type: "string", required: true, description: "検索キーワード" },
      { name: "sources", type: "array", required: false, description: "検索対象（slack, notion, backlog）省略時は全ツール" },
      { name: "count", type: "number", required: false, description: "各ツールからの取得件数（デフォルト10）" },
    ],
  },
  {
    name: "cross_get_activity",
    description: "指定日のアクティビティを全ツールから取得する",
    integration: "cross",
    params: [
      { name: "date", type: "string", required: false, description: "対象日（YYYY-MM-DD形式、省略時は今日）" },
      { name: "sources", type: "array", required: false, description: "取得対象（slack, notion, backlog）省略時は全ツール" },
    ],
  },

  // ── Report ──
  {
    name: "generate_daily_report",
    description: "指定日の日報を全ツールのアクティビティから自動生成する",
    integration: "cross",
    params: [
      { name: "date", type: "string", required: false, description: "対象日（YYYY-MM-DD形式、省略時は今日）" },
      { name: "format", type: "string", required: false, description: "出力形式: markdown または json（デフォルト: markdown）" },
    ],
  },
];

export function getToolDef(name: string): ToolDefinition {
  const def = toolDefinitions.find((t) => t.name === name);
  if (!def) throw new Error(`Tool definition not found: ${name}`);
  return def;
}
