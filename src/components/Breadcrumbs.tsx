interface Props {
  bucket: string | null;
  prefix: string;
  onNavigate: (prefix: string) => void;
  onBucketList: () => void;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export default function Breadcrumbs({
  bucket,
  prefix,
  onNavigate,
  onBucketList,
}: Props) {
  const parts = prefix ? prefix.split("/").filter(Boolean) : [];

  // Collapse: show only last part with ... if more than 1 segment
  let displayParts: Array<{ label: string; path: string | null; isLast: boolean }> = [];
  if (parts.length <= 1) {
    displayParts = parts.map((part, i) => ({
      label: truncate(part, 30),
      path: parts.slice(0, i + 1).join("/") + "/",
      isLast: i === parts.length - 1,
    }));
  } else {
    displayParts = [
      { label: "...", path: null, isLast: false },
      { label: truncate(parts[parts.length - 1], 30), path: parts.join("/") + "/", isLast: true },
    ];
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onBucketList}
        className="px-0.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
      >
        Buckets
      </button>
      {bucket && (
        <>
          <span className="text-muted-foreground">/</span>
          <button
            onClick={() => onNavigate("")}
            className="px-0.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
          >
            {truncate(bucket, 20)}
          </button>
        </>
      )}
      {displayParts.map((item, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className="text-muted-foreground">/</span>
          {item.isLast ? (
            <span className="font-medium px-0.5 truncate max-w-[200px]">{item.label}</span>
          ) : item.path === null ? (
            <span className="px-0.5 text-muted-foreground">...</span>
          ) : (
            <button
              onClick={() => onNavigate(item.path!)}
              className="px-0.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              {item.label}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
