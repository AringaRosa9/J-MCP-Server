import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { backlogClient } from "../integrations/index.js";
import { getToolDef } from "./definitions.js";

export function registerBacklogTools(server: McpServer) {
  const desc = (name: string) => getToolDef(name).description;

  server.tool(
    "backlog_list_projects",
    desc("backlog_list_projects"),
    {
      include_metadata: z
        .boolean()
        .optional()
        .describe(
          "trueの場合、各プロジェクトの課題種別・ステータス・優先度も取得する"
        ),
    },
    async ({ include_metadata }) => {
      const projects = await backlogClient.listProjects();

      if (!include_metadata) {
        return {
          content: [
            { type: "text", text: JSON.stringify(projects, null, 2) },
          ],
        };
      }

      const enriched = await Promise.all(
        projects.map(async (p) => {
          const meta = await backlogClient.getProjectMetadata(p.id);
          return { ...p, ...meta };
        })
      );

      return {
        content: [
          { type: "text", text: JSON.stringify(enriched, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "backlog_search_issues",
    desc("backlog_search_issues"),
    {
      project_id: z.number().optional().describe("プロジェクトID"),
      keyword: z.string().optional().describe("検索キーワード"),
      status_id: z
        .array(z.number())
        .optional()
        .describe("ステータスIDの配列"),
      assignee_id: z
        .array(z.number())
        .optional()
        .describe("担当者IDの配列"),
      count: z.number().optional().describe("取得件数（デフォルト20、最大100）"),
    },
    async ({ project_id, keyword, status_id, assignee_id, count }) => {
      const issues = await backlogClient.searchIssues({
        projectId: project_id,
        keyword,
        statusId: status_id,
        assigneeId: assignee_id,
        count: count ?? 20,
        sort: "updated",
        order: "desc",
      });
      return {
        content: [{ type: "text", text: JSON.stringify(issues, null, 2) }],
      };
    }
  );

  server.tool(
    "backlog_get_issue",
    desc("backlog_get_issue"),
    {
      issue_id_or_key: z
        .string()
        .describe("課題IDまたはキー（例: PROJ-123）"),
    },
    async ({ issue_id_or_key }) => {
      const issue = await backlogClient.getIssue(issue_id_or_key);
      return {
        content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
      };
    }
  );

  server.tool(
    "backlog_create_issue",
    desc("backlog_create_issue"),
    {
      project_id: z.number().describe("プロジェクトID"),
      summary: z.string().describe("課題の件名"),
      issue_type_id: z.number().describe("課題種別ID"),
      priority_id: z.number().describe("優先度ID"),
      description: z.string().optional().describe("課題の詳細"),
      assignee_id: z.number().optional().describe("担当者ID"),
      due_date: z
        .string()
        .optional()
        .describe("期限日（YYYY-MM-DD形式）"),
      start_date: z
        .string()
        .optional()
        .describe("開始日（YYYY-MM-DD形式）"),
    },
    async ({
      project_id,
      summary,
      issue_type_id,
      priority_id,
      description,
      assignee_id,
      due_date,
      start_date,
    }) => {
      const issue = await backlogClient.createIssue({
        projectId: project_id,
        summary,
        issueTypeId: issue_type_id,
        priorityId: priority_id,
        description,
        assigneeId: assignee_id,
        dueDate: due_date,
        startDate: start_date,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
      };
    }
  );

  server.tool(
    "backlog_update_issue",
    desc("backlog_update_issue"),
    {
      issue_id_or_key: z
        .string()
        .describe("課題IDまたはキー（例: PROJ-123）"),
      summary: z.string().optional().describe("件名"),
      description: z.string().optional().describe("詳細"),
      status_id: z.number().optional().describe("ステータスID"),
      priority_id: z.number().optional().describe("優先度ID"),
      assignee_id: z.number().optional().describe("担当者ID"),
      due_date: z.string().optional().describe("期限日（YYYY-MM-DD形式）"),
      start_date: z.string().optional().describe("開始日（YYYY-MM-DD形式）"),
    },
    async ({
      issue_id_or_key,
      summary,
      description,
      status_id,
      priority_id,
      assignee_id,
      due_date,
      start_date,
    }) => {
      const issue = await backlogClient.updateIssue(issue_id_or_key, {
        summary,
        description,
        statusId: status_id,
        priorityId: priority_id,
        assigneeId: assignee_id,
        dueDate: due_date,
        startDate: start_date,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
      };
    }
  );

  server.tool(
    "backlog_add_comment",
    desc("backlog_add_comment"),
    {
      issue_id_or_key: z
        .string()
        .describe("課題IDまたはキー（例: PROJ-123）"),
      content: z.string().describe("コメント本文"),
    },
    async ({ issue_id_or_key, content }) => {
      const comment = await backlogClient.addComment(
        issue_id_or_key,
        content
      );
      return {
        content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
      };
    }
  );
}
