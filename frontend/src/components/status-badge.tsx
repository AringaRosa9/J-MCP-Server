import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "connected" | "disconnected" | "coming-soon";

const statusConfig: Record<Status, { label: string; className: string }> = {
  connected: {
    label: "接続済み",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  disconnected: {
    label: "未接続",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  "coming-soon": {
    label: "今後対応予定",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      <span
        className={cn(
          "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
          status === "connected" && "bg-emerald-500",
          status === "disconnected" && "bg-red-500",
          status === "coming-soon" && "bg-gray-400"
        )}
      />
      {config.label}
    </Badge>
  );
}
