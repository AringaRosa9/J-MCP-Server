import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ConnectionCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  status: "connected" | "disconnected" | "coming-soon";
  details?: string;
  toolCount?: number;
}

export function ConnectionCard({
  name,
  description,
  icon: Icon,
  status,
  details,
  toolCount,
}: ConnectionCardProps) {
  return (
    <Card
      className={cn(
        "transition-shadow",
        status === "coming-soon" && "opacity-60"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              status === "coming-soon"
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{name}</CardTitle>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </CardHeader>
      {(details || toolCount !== undefined) && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {details && <span>{details}</span>}
            {toolCount !== undefined && <span>{toolCount} ツール</span>}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
