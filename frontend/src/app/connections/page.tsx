import { Header } from "@/components/header";
import { ConnectionCard } from "@/components/connection-card";
import { integrations } from "@/lib/api";
import {
  Server,
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

export default function ConnectionsPage() {
  return (
    <div>
      <Header
        title="接続管理"
        description="インテグレーションの接続状況と設定"
      />
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
    </div>
  );
}
