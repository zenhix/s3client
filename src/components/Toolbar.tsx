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
    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={onUpload}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Upload
      </button>
      <button
        onClick={onDelete}
        disabled={!hasSelection}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Delete
      </button>
      <div className="flex-1" />
      <input
        type="text"
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        placeholder="Filter by name..."
        className="w-64 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}
