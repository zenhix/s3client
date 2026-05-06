import { Folder } from "lucide-react";
import type { BucketInfo } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  buckets: BucketInfo[];
  filter: string;
  onSelect: (bucket: string) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BucketList({ buckets, filter, onSelect }: Props) {
  const filtered = buckets.filter((b) =>
    !filter || b.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-xs">
        {filter ? "No matching buckets" : "No buckets found."}
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-48">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((b) => (
            <TableRow key={b.name}>
              <TableCell>
                <button
                  onClick={() => onSelect(b.name)}
                  className="flex items-center gap-2 text-foreground/90 hover:text-foreground transition-colors cursor-pointer"
                >
                  <Folder className="h-4 w-4 shrink-0" />
                  {b.name}
                </button>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(b.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
