interface Props {
  bucket: string | null;
  prefix: string;
  onNavigate: (prefix: string) => void;
  onBucketList: () => void;
}

export default function Breadcrumbs({
  bucket,
  prefix,
  onNavigate,
  onBucketList,
}: Props) {
  const parts = prefix ? prefix.split("/").filter(Boolean) : [];

  // Collapse middle parts: show first, ..., last two
  let displayParts: Array<{ label: string; path: string | null; isLast: boolean }> = [];
  if (parts.length <= 3) {
    displayParts = parts.map((part, i) => ({
      label: part,
      path: parts.slice(0, i + 1).join("/") + "/",
      isLast: i === parts.length - 1,
    }));
  } else {
    displayParts = [
      { label: parts[0], path: parts.slice(0, 1).join("/") + "/", isLast: false },
      { label: "...", path: null, isLast: false },
      { label: parts[parts.length - 2], path: parts.slice(0, parts.length - 1).join("/") + "/", isLast: false },
      { label: parts[parts.length - 1], path: parts.join("/") + "/", isLast: true },
    ];
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onBucketList}
        className="px-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
      >
        Buckets
      </button>
      {bucket && (
        <>
          <span className="text-muted-foreground">/</span>
          <button
            onClick={() => onNavigate("")}
            className="px-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            {bucket}
          </button>
        </>
      )}
      {displayParts.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="text-muted-foreground">/</span>
          {item.isLast ? (
            <span className="font-medium px-1">{item.label}</span>
          ) : item.path === null ? (
            <span className="px-1 text-muted-foreground">...</span>
          ) : (
            <button
              onClick={() => onNavigate(item.path!)}
              className="px-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              {item.label}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
