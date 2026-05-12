"use client";

import { useCallback } from "react";
import { Header } from "@/components/header";
import { ToolCard } from "@/components/tool-card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Tool } from "@/lib/api";
import { useApi } from "@/lib/use-api";

export default function ToolsPage() {
  const fetcher = useCallback(() => api.getTools(), []);
  const { data: tools, loading } = useApi<Tool[]>(fetcher);

  return (
    <div>
      <Header
        title="ツール一覧"
        description="登録済みMCPツールの一覧と詳細"
      />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(tools ?? []).map((tool) => (
            <ToolCard key={tool.name} {...tool} />
          ))}
        </div>
      )}
    </div>
  );
}
