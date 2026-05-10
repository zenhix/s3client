import { X } from "lucide-react";
import type { SavedConnection } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  saved: SavedConnection[];
  activeConnectionId: string | null;
  onConnect: (conn: SavedConnection) => void;
  onDelete: (id: string) => void;
  onNewConnection: () => void;
}

export default function ConnectionSidebar({
  saved,
  activeConnectionId,
  onConnect,
  onDelete,
}: Props) {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="space-y-0.5">
        {saved.map((c) => {
          const isAws = c.connection_type === "aws";
          const displayEndpoint = c.endpoint || `AWS (${c.region})`;
          const isActive = activeConnectionId === c.id;

          return (
            <div
              key={c.id}
              onClick={() => onConnect(c)}
              className={`flex items-center justify-between px-4 py-1.5 cursor-pointer group transition-colors text-sm ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="min-w-0 flex items-center gap-3">
                <img
                  src={isActive ? "/aws-s3-active.svg" : "/aws-s3.svg"}
                  alt={isAws ? "AWS" : "Local"}
                  className={`h-4 w-4 shrink-0 rounded-sm transition-all ${
                    isActive
                      ? "ring-1 ring-[#488E2D]"
                      : ""
                  }`}
                />
                <span className="min-w-0 truncate text-xs text-foreground whitespace-nowrap">
                  {c.name} · {displayEndpoint}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 text-muted-foreground hover:text-muted-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
