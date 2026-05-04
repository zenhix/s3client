interface Props {
  bucket: string | null;
  prefix: string;
  onNavigate: (prefix: string) => void;
  onBack: () => void;
  onBucketList: () => void;
}

export default function Breadcrumbs({
  bucket,
  prefix,
  onNavigate,
  onBack,
  onBucketList,
}: Props) {
  const parts = prefix ? prefix.split("/").filter(Boolean) : [];

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-sm overflow-x-auto">
      <button
        onClick={onBack}
        className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors shrink-0"
        title="Go back"
      >
        ←
      </button>
      <button
        onClick={onBucketList}
        className="text-blue-600 dark:text-blue-400 hover:underline shrink-0"
      >
        Buckets
      </button>
      {bucket && (
        <>
          <span className="text-gray-400 dark:text-gray-500">/</span>
          <button
            onClick={() => onNavigate("")}
            className="text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            {bucket}
          </button>
        </>
      )}
      {parts.map((part, i) => {
        const path = parts.slice(0, i + 1).join("/") + "/";
        const isLast = i === parts.length - 1;
        return (
          <span key={path} className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-gray-500">/</span>
            {isLast ? (
              <span className="text-gray-900 dark:text-white font-medium">
                {part}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(path)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {part}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
