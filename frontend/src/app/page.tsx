import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionCard } from "@/components/connection-card";
import { ToolCard } from "@/components/tool-card";
import { integrations, tools } from "@/lib/api";
import {
  Server,
  Link2,
  Wrench,
  MessageSquare,
  BookOpen,
  ClipboardList,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const integrationIcons: Record<string, LucideIcon> = {
  slack: MessageSquare,
  notion: BookOpen,
  backlog: ClipboardList,
  obsidian: FileText,
};

export default function DashboardPage() {
  const connectedCount = integrations.filter(
    (i) => i.status === "connected"
  ).length;
  const activeToolCount = tools.filter((t) => t.active).length;

  return (
    <div>
      <Header
        title="ダッシュボード"
        description="J-MCP Serverの稼働状況"
      />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">接続数</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">
              / {integrations.length} インテグレーション
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
            <p className="text-xs text-muted-foreground">アクティブ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ステータス</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">稼働中</div>
            <p className="text-xs text-muted-foreground">stdio transport</p>
          </CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">
          接続済みインテグレーション
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <ConnectionCard
              key={integration.id}
              name={integration.name}
              description={integration.description}
              icon={integrationIcons[integration.id] ?? Server}
              status={integration.status}
              details={integration.details}
              toolCount={integration.toolCount}
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
