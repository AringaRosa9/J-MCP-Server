const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) ?? {}),
  };
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface ServerStatus {
  name: string;
  version: string;
  transport: string;
  uptime: number;
  nodeVersion: string;
}

export interface Connection {
  id: string;
  name: string;
  description: string;
  configured: boolean;
  connected: boolean;
  status: "connected" | "disconnected" | "not-configured" | "coming-soon";
  workspace?: {
    team?: string;
    user?: string;
    name?: string;
    id?: string;
    spaceKey?: string;
  };
  toolCount: number;
}

export interface ToolParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface Tool {
  name: string;
  description: string;
  integration: string;
  params: ToolParam[];
  active: boolean;
}

export const api = {
  getStatus: () => fetchApi<ServerStatus>("/api/status"),
  getConnections: () => fetchApi<Connection[]>("/api/connections"),
  getTools: () => fetchApi<Tool[]>("/api/tools"),
  testConnection: (id: string) =>
    fetchApi<{ ok: boolean; error?: string }>(`/api/connections/${id}/test`, {
      method: "POST",
    }),
};
