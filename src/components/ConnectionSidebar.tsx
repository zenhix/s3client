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
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-0.5">
        {saved.map((c) => {
          const isAws = c.connection_type === "aws";
          const displayEndpoint = c.endpoint || `AWS (${c.region})`;

          return (
            <div
              key={c.id}
              onClick={() => onConnect(c)}
              className={`flex items-center justify-between px-2 py-2 rounded cursor-pointer group transition-colors text-sm ${
                activeConnectionId === c.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <img
                    src={isAws ? "/aws-s3.png" : "/local-s3.svg"}
                    alt={isAws ? "AWS" : "Local"}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="truncate font-medium">{c.name}</span>
                </div>
                <span className="text-[11px] text-muted-foreground truncate">
                  {displayEndpoint} · {c.access_key}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
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
