"use client";

import { useCallback } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { ServerStatus, Connection } from "@/lib/api";
import { useApi } from "@/lib/use-api";

interface SettingsData {
  status: ServerStatus;
  connections: Connection[];
}

export default function SettingsPage() {
  const fetcher = useCallback(async (): Promise<SettingsData> => {
    const [status, connections] = await Promise.all([
      api.getStatus(),
      api.getConnections(),
    ]);
    return { status, connections };
  }, []);

  const { data, loading } = useApi(fetcher);

  if (loading || !data) {
    return (
      <div>
        <Header title="設定" description="サーバー設定と環境情報" />
        <div className="space-y-6 max-w-2xl">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const { status, connections } = data;
  const slackConn = connections.find((c) => c.id === "slack");

  return (
    <div>
      <Header title="設定" description="サーバー設定と環境情報" />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">サーバー情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">バージョン</span>
              <span className="text-sm font-mono text-muted-foreground">
                {status.version}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">稼働時間</span>
              <span className="text-sm font-mono text-muted-foreground">
                {status.uptime}s
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">Node.js</span>
              <span className="text-sm font-mono text-muted-foreground">
                {status.nodeVersion}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">プロトコル</span>
              <span className="text-sm font-mono text-muted-foreground">
                MCP (Model Context Protocol)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">トランスポート設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">MCPトランスポート</span>
              <Badge variant="outline">{status.transport}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">HTTP API</span>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                稼働中
              </Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              stdio は Claude Desktop / Claude Code とのローカル通信に使用されます。
              HTTP API はこの管理面板との通信に使用されます。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">環境変数</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono">SLACK_BOT_TOKEN</span>
              <Badge variant={slackConn?.configured ? "default" : "secondary"}>
                {slackConn?.configured ? "設定済み" : "未設定"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono">SLACK_SIGNING_SECRET</span>
              <Badge variant={slackConn?.configured ? "default" : "secondary"}>
                {slackConn?.configured ? "設定済み" : "未設定"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ロードマップ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections.map((conn, i) => (
                <div key={conn.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        conn.connected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {conn.connected ? "✓" : i + 1}
                    </span>
                    <span className="text-sm">{conn.name}連携</span>
                  </div>
                  <Badge variant={conn.connected ? "default" : "secondary"}>
                    {conn.connected
                      ? "完了"
                      : conn.status === "coming-soon"
                        ? "予定"
                        : "未接続"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
