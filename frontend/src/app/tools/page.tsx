import { Header } from "@/components/header";
import { ToolCard } from "@/components/tool-card";
import { tools } from "@/lib/api";

export default function ToolsPage() {
  return (
    <div>
      <Header
        title="ツール一覧"
        description="登録済みMCPツールの一覧と詳細"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <ToolCard key={tool.name} {...tool} />
        ))}
      </div>
    </div>
  );
}
