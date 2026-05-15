"use client";

import { useCallback } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionCard } from "@/components/connection-card";
import { ToolCard } from "@/components/tool-card";
import { api } from "@/lib/api";
import type { ServerStatus, Connection, Tool } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import {
  Server,
  Link2,
  Wrench,
  MessageSquare,
  BookOpen,
  ClipboardList,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const integrationIcons: Record<string, LucideIcon> = {
  slack: MessageSquare,
  notion: BookOpen,
  backlog: ClipboardList,
  obsidian: FileText,
};

interface DashboardData {
  status: ServerStatus;
  connections: Connection[];
  tools: Tool[];
}

export default function DashboardPage() {
  const fetcher = useCallback(async (): Promise<DashboardData> => {
    const [status, connections, tools] = await Promise.all([
      api.getStatus(),
      api.getConnections(),
      api.getTools(),
    ]);
    return { status, connections, tools };
  }, []);

  const { data, error, loading } = useApi(fetcher);

  if (error) {
    return (
      <div>
        <Header title="ダッシュボード" description="J-MCP Serverの稼働状況" />
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">サーバーに接続できません</p>
              <p className="text-sm text-muted-foreground">
                サーバーが起動しているか確認してください: cd server &amp;&amp; npm run api
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div>
        <Header title="ダッシュボード" description="J-MCP Serverの稼働状況" />
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const { status, connections, tools } = data;
  const connectedCount = connections.filter((c) => c.connected).length;
  const activeToolCount = tools.filter((t) => t.active).length;

  return (
    <div>
      <Header title="ダッシュボード" description="J-MCP Serverの稼働状況" />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">接続数</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">
              / {connections.length} インテグレーション
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">登録ツール</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeToolCount}</div>
            <p className="text-xs text-muted-foreground">
              / {tools.length} ツール
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ステータス</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">稼働中</div>
            <p className="text-xs text-muted-foreground">
              uptime {status.uptime}s / {status.transport}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">
          インテグレーション
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              name={conn.name}
              description={conn.description}
              icon={integrationIcons[conn.id] ?? Server}
              status={
                conn.status === "not-configured" ? "disconnected" : conn.status
              }
              details={
                conn.workspace?.team
                  ? `ワークスペース: ${conn.workspace.team}`
                  : conn.workspace?.name
                    ? `${conn.id === "backlog" ? "スペース" : "ユーザー"}: ${conn.workspace.name}`
                    : undefined
              }
              toolCount={conn.toolCount}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">登録済みツール</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard key={tool.name} {...tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
