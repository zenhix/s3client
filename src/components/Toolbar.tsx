import { Upload, Download, Trash2, X, ChevronLeft, FolderPlus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  filter: string;
  onFilterChange: (val: string) => void;
  onUpload: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onBack: () => void;
  onCreateFolder: () => void;
  hasSelection: boolean;
  inBucket: boolean;
  canGoBack: boolean;
}

export default function Toolbar({
  filter,
  onFilterChange,
  onUpload,
  onDownload,
  onDelete,
  onBack,
  onCreateFolder,
  hasSelection,
  inBucket,
  canGoBack,
}: Props) {
  return (
    <div className="flex items-center gap-2 px-2 border-b h-[37px]">
      {canGoBack && (
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div className="relative flex-1">
        <Input
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Filter..."
          className="w-full h-6 text-xs text-muted-foreground pr-6"
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
            onClick={onCreateFolder}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
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
