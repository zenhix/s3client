import type { BucketInfo } from "@/types";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  buckets: BucketInfo[];
  onSelect: (bucket: string) => void;
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
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Buckets</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {buckets.map((b) => (
          <Card
            key={b.name}
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => onSelect(b.name)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪣</span>
                <CardTitle className="text-base truncate">{b.name}</CardTitle>
              </div>
              {b.created_at && (
                <CardDescription>
                  Created {new Date(b.created_at).toLocaleDateString()}
                </CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
