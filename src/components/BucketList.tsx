import type { BucketInfo } from "../types";

interface Props {
  buckets: BucketInfo[];
  onSelect: (bucket: string) => void;
}

export default function BucketList({ buckets, onSelect }: Props) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Buckets
      </h2>
      {buckets.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No buckets found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {buckets.map((b) => (
            <button
              key={b.name}
              onClick={() => onSelect(b.name)}
              className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all text-left"
            >
              <span className="text-2xl mt-0.5">🪣</span>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {b.name}
                </div>
                {b.created_at && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Created {new Date(b.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
