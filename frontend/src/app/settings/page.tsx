import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div>
      <Header title="設定" description="サーバー設定と環境情報" />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">トランスポート設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">現在のトランスポート</span>
              <Badge variant="outline">stdio</Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              stdio は Claude Desktop / Claude Code
              とのローカル通信に使用されます。
              将来的にはSSE（Server-Sent Events）やStreamable
              HTTPにも対応予定です。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">サーバー情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">バージョン</span>
              <span className="text-sm font-mono text-muted-foreground">
                0.1.0
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">プロトコル</span>
              <span className="text-sm font-mono text-muted-foreground">
                MCP (Model Context Protocol)
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">SDK</span>
              <span className="text-sm font-mono text-muted-foreground">
                @modelcontextprotocol/sdk
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ロードマップ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { phase: "Phase 1", label: "Slack連携", done: true },
                { phase: "Phase 2", label: "Notion連携", done: false },
                { phase: "Phase 3", label: "Backlog連携", done: false },
                { phase: "Phase 4", label: "Obsidian連携", done: false },
                {
                  phase: "Phase 5",
                  label: "クロスツール検索・日報生成",
                  done: false,
                },
              ].map((item) => (
                <div
                  key={item.phase}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        item.done
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.done ? "✓" : item.phase.split(" ")[1]}
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <Badge variant={item.done ? "default" : "secondary"}>
                    {item.done ? "完了" : "予定"}
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
