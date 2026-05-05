import { Upload, Download, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  filter: string;
  onFilterChange: (val: string) => void;
  onUpload: () => void;
  onDownload: () => void;
  onDelete: () => void;
  hasSelection: boolean;
  inBucket: boolean;
}

export default function Toolbar({
  filter,
  onFilterChange,
  onUpload,
  onDownload,
  onDelete,
  hasSelection,
  inBucket,
}: Props) {
  return (
    <div className="flex items-center gap-2 px-4 border-b h-[37px]">
      <div className="relative flex-1">
        <Input
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Filter..."
          className="w-full h-6 text-xs text-muted-foreground pr-6"
          disabled={!inBucket}
          autoCapitalize="off"
          autoCorrect="off"
        />
        {filter && (
          <button
            onClick={() => onFilterChange("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {inBucket && (
        <div className="flex items-center gap-1">
          <button
            onClick={onUpload}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
          >
            <Upload className="h-4 w-4" />
          </button>
          {hasSelection && (
            <>
              <button
                onClick={onDownload}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
