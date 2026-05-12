"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/header";
import { ConnectionCard } from "@/components/connection-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Connection } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import {
  Server,
  MessageSquare,
  BookOpen,
  ClipboardList,
  FileText,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const integrationIcons: Record<string, LucideIcon> = {
  slack: MessageSquare,
  notion: BookOpen,
  backlog: ClipboardList,
  obsidian: FileText,
};

export default function ConnectionsPage() {
  const fetcher = useCallback(() => api.getConnections(), []);
  const { data: connections, loading, reload } = useApi<Connection[]>(fetcher);
  const [testing, setTesting] = useState<string | null>(null);

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      await api.testConnection(id);
      await reload();
    } finally {
      setTesting(null);
    }
  };

  return (
    <div>
      <Header
        title="接続管理"
        description="インテグレーションの接続状況と設定"
      />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {(connections ?? []).map((conn) => (
              <div key={conn.id} className="space-y-2">
                <ConnectionCard
                  name={conn.name}
                  description={conn.description}
                  icon={integrationIcons[conn.id] ?? Server}
                  status={
                    conn.status === "not-configured"
                      ? "disconnected"
                      : conn.status
                  }
                  details={
                    conn.workspace?.team
                      ? `ワークスペース: ${conn.workspace.team}`
                      : conn.status === "not-configured"
                        ? "トークン未設定"
                        : undefined
                  }
                  toolCount={conn.toolCount}
                />
                {conn.configured && conn.status !== "coming-soon" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={testing === conn.id}
                    onClick={() => handleTest(conn.id)}
                  >
                    <RefreshCw
                      className={`h-3 w-3 mr-2 ${testing === conn.id ? "animate-spin" : ""}`}
                    />
                    {testing === conn.id ? "テスト中..." : "接続テスト"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
