import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface Props {
  filter: string;
  onFilterChange: (val: string) => void;
  onUpload: () => void;
  onDelete: () => void;
  hasSelection: boolean;
  inBucket: boolean;
}

export default function Toolbar({
  filter,
  onFilterChange,
  onUpload,
  onDelete,
  hasSelection,
  inBucket,
}: Props) {
  if (!inBucket) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b">
      <Button size="sm" onClick={onUpload}>
        Upload
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={onDelete}
        disabled={!hasSelection}
      >
        Delete
      </Button>
      <Separator orientation="vertical" className="h-5 mx-1" />
      <div className="flex-1" />
      <Input
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        placeholder="Filter by name..."
        className="w-64 h-8 text-sm"
      />
    </div>
  );
}
