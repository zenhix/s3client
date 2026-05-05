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

export default function BucketList({ buckets, onSelect }: Props) {
  if (buckets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No buckets found.
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
          {buckets.map((b) => (
            <TableRow key={b.name}>
              <TableCell>
                <button
                  onClick={() => onSelect(b.name)}
                  className="hover:underline hover:text-primary transition-colors cursor-pointer"
                >
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
