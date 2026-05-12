import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ToolParam {
  name: string;
  type: string;
  required: boolean;
}

interface ToolCardProps {
  name: string;
  description: string;
  params: ToolParam[];
  active: boolean;
}

export function ToolCard({ name, description, params, active }: ToolCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono">{name}</CardTitle>
          <Badge
            variant={active ? "default" : "secondary"}
            className="text-xs"
          >
            {active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {params.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-xs">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {p.name}
              </code>
              <span className="text-muted-foreground">{p.type}</span>
              {p.required && (
                <span className="text-destructive text-[10px]">必須</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
