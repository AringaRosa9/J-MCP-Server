import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

interface BacklogUser {
  id: number;
  userId: string;
  name: string;
  mailAddress: string;
}

interface BacklogProject {
  id: number;
  projectKey: string;
  name: string;
  description: string;
}

interface BacklogIssueType {
  id: number;
  projectId: number;
  name: string;
  color: string;
}

interface BacklogPriority {
  id: number;
  name: string;
}

interface BacklogStatus {
  id: number;
  projectId: number;
  name: string;
  color: string;
  displayOrder: number;
}

interface BacklogIssue {
  id: number;
  projectId: number;
  issueKey: string;
  keyId: number;
  issueType: { id: number; name: string };
  summary: string;
  description: string;
  status: { id: number; name: string };
  priority: { id: number; name: string };
  assignee: BacklogUser | null;
  startDate: string | null;
  dueDate: string | null;
  created: string;
  updated: string;
  createdUser: BacklogUser;
}

interface BacklogComment {
  id: number;
  content: string;
  createdUser: BacklogUser;
  created: string;
}

export class BacklogClient {
  private baseUrl: string | null = null;
  private apiKey: string | null = null;
  private connected = false;
  private spaceInfo: { name?: string; spaceKey?: string } = {};

  constructor() {
    if (config.backlog.spaceUrl && config.backlog.apiKey) {
      this.baseUrl = `${config.backlog.spaceUrl}/api/v2`;
      this.apiKey = config.backlog.apiKey;
    }
  }

  isConfigured(): boolean {
    return this.baseUrl !== null && this.apiKey !== null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSpaceInfo() {
    return this.spaceInfo;
  }

  private async request<T>(
    path: string,
    options?: { method?: string; body?: Record<string, unknown>; params?: Record<string, string> }
  ): Promise<T> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error(
        "Backlog is not configured. Set BACKLOG_SPACE_URL and BACKLOG_API_KEY in .env"
      );
    }

    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("apiKey", this.apiKey);

    if (options?.params) {
      for (const [k, v] of Object.entries(options.params)) {
        url.searchParams.set(k, v);
      }
    }

    const fetchOpts: RequestInit = {
      method: options?.method ?? "GET",
    };

    if (options?.body) {
      fetchOpts.headers = { "Content-Type": "application/json" };
      fetchOpts.body = JSON.stringify(options.body);
    }

    const res = await fetch(url.toString(), fetchOpts);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = Object.assign(new Error(`Backlog API ${path}: ${res.status}`), {
        status: res.status,
        body: text,
      });
      throw err;
    }

    return (await res.json()) as T;
  }

  async testConnection() {
    try {
      const space = await this.request<{ spaceKey: string; name: string }>(
        "/space"
      );
      this.connected = true;
      this.spaceInfo = { name: space.name, spaceKey: space.spaceKey };
      logger.info(`Connected to Backlog space: ${space.name}`);
      return { ok: true, name: space.name, spaceKey: space.spaceKey };
    } catch (err) {
      this.connected = false;
      this.spaceInfo = {};
      logger.warn("Backlog connection test failed:", err);
      return { ok: false, error: String(err) };
    }
  }

  async listProjects() {
    const projects = await withRetry(
      () => this.request<BacklogProject[]>("/projects"),
      { label: "backlog.listProjects" }
    );

    return projects.map((p) => ({
      id: p.id,
      projectKey: p.projectKey,
      name: p.name,
      description: p.description,
    }));
  }

  async getProjectMetadata(projectIdOrKey: string | number) {
    const [issueTypes, statuses] = await Promise.all([
      withRetry(
        () =>
          this.request<BacklogIssueType[]>(
            `/projects/${projectIdOrKey}/issueTypes`
          ),
        { label: "backlog.getIssueTypes" }
      ),
      withRetry(
        () =>
          this.request<BacklogStatus[]>(
            `/projects/${projectIdOrKey}/statuses`
          ),
        { label: "backlog.getStatuses" }
      ),
    ]);

    const priorities = await withRetry(
      () => this.request<BacklogPriority[]>("/priorities"),
      { label: "backlog.getPriorities" }
    );

    return {
      issueTypes: issueTypes.map((t) => ({ id: t.id, name: t.name })),
      statuses: statuses.map((s) => ({
        id: s.id,
        name: s.name,
        displayOrder: s.displayOrder,
      })),
      priorities: priorities.map((p) => ({ id: p.id, name: p.name })),
    };
  }

  async searchIssues(opts: {
    projectId?: number;
    keyword?: string;
    statusId?: number[];
    assigneeId?: number[];
    issueTypeId?: number[];
    priorityId?: number[];
    count?: number;
    offset?: number;
    sort?: string;
    order?: "asc" | "desc";
  }) {
    const params: Record<string, string> = {};
    if (opts.keyword) params.keyword = opts.keyword;
    if (opts.count) params.count = String(opts.count);
    if (opts.offset) params.offset = String(opts.offset);
    if (opts.sort) params.sort = opts.sort;
    if (opts.order) params.order = opts.order;

    // Array params need special handling for Backlog API
    const url = new URL(`${this.baseUrl}/issues`);
    url.searchParams.set("apiKey", this.apiKey!);

    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    if (opts.projectId) {
      url.searchParams.append("projectId[]", String(opts.projectId));
    }
    if (opts.statusId) {
      for (const id of opts.statusId) {
        url.searchParams.append("statusId[]", String(id));
      }
    }
    if (opts.assigneeId) {
      for (const id of opts.assigneeId) {
        url.searchParams.append("assigneeId[]", String(id));
      }
    }
    if (opts.issueTypeId) {
      for (const id of opts.issueTypeId) {
        url.searchParams.append("issueTypeId[]", String(id));
      }
    }
    if (opts.priorityId) {
      for (const id of opts.priorityId) {
        url.searchParams.append("priorityId[]", String(id));
      }
    }

    const issues = await withRetry(
      async () => {
        const res = await fetch(url.toString());
        if (!res.ok) {
          throw Object.assign(
            new Error(`Backlog API /issues: ${res.status}`),
            { status: res.status }
          );
        }
        return (await res.json()) as BacklogIssue[];
      },
      { label: "backlog.searchIssues" }
    );

    return issues.map(summarizeIssue);
  }

  async getIssue(issueIdOrKey: string) {
    const [issue, comments] = await Promise.all([
      withRetry(
        () => this.request<BacklogIssue>(`/issues/${issueIdOrKey}`),
        { label: "backlog.getIssue" }
      ),
      withRetry(
        () =>
          this.request<BacklogComment[]>(
            `/issues/${issueIdOrKey}/comments`,
            { params: { count: "20", order: "desc" } }
          ),
        { label: "backlog.getComments" }
      ),
    ]);

    return {
      ...summarizeIssue(issue),
      description: issue.description,
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdBy: c.createdUser.name,
        created: c.created,
      })),
    };
  }

  async createIssue(opts: {
    projectId: number;
    summary: string;
    issueTypeId: number;
    priorityId: number;
    description?: string;
    assigneeId?: number;
    dueDate?: string;
    startDate?: string;
  }) {
    const body: Record<string, unknown> = {
      projectId: opts.projectId,
      summary: opts.summary,
      issueTypeId: opts.issueTypeId,
      priorityId: opts.priorityId,
    };
    if (opts.description) body.description = opts.description;
    if (opts.assigneeId) body.assigneeId = opts.assigneeId;
    if (opts.dueDate) body.dueDate = opts.dueDate;
    if (opts.startDate) body.startDate = opts.startDate;

    const issue = await withRetry(
      () =>
        this.request<BacklogIssue>("/issues", { method: "POST", body }),
      { label: "backlog.createIssue" }
    );

    return summarizeIssue(issue);
  }

  async updateIssue(
    issueIdOrKey: string,
    updates: {
      summary?: string;
      description?: string;
      statusId?: number;
      priorityId?: number;
      assigneeId?: number;
      dueDate?: string;
      startDate?: string;
    }
  ) {
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) body[k] = v;
    }

    const issue = await withRetry(
      () =>
        this.request<BacklogIssue>(`/issues/${issueIdOrKey}`, {
          method: "PATCH",
          body,
        }),
      { label: "backlog.updateIssue" }
    );

    return summarizeIssue(issue);
  }

  async addComment(issueIdOrKey: string, content: string) {
    const comment = await withRetry(
      () =>
        this.request<BacklogComment>(`/issues/${issueIdOrKey}/comments`, {
          method: "POST",
          body: { content },
        }),
      { label: "backlog.addComment" }
    );

    return {
      id: comment.id,
      content: comment.content,
      createdBy: comment.createdUser.name,
      created: comment.created,
    };
  }
}

function summarizeIssue(issue: BacklogIssue) {
  return {
    id: issue.id,
    issueKey: issue.issueKey,
    summary: issue.summary,
    issueType: issue.issueType.name,
    status: issue.status.name,
    priority: issue.priority.name,
    assignee: issue.assignee?.name ?? null,
    startDate: issue.startDate,
    dueDate: issue.dueDate,
    created: issue.created,
    updated: issue.updated,
    createdBy: issue.createdUser.name,
  };
}
