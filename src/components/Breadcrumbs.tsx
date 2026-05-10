interface Props {
  bucket: string | null;
  prefix: string;
  bucketCount: number;
  onCopy: (path: string) => void;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export default function Breadcrumbs({
  bucket,
  prefix,
  bucketCount,
  onCopy,
}: Props) {
  const parts = prefix ? prefix.split("/").filter(Boolean) : [];

  // Build the full path for copying
  const fullPath = bucket
    ? `s3://${bucket}/${prefix}`
    : "";

  // Collapse: show only last part with ... if more than 1 segment
  const displayParts = parts.length <= 1
    ? parts.map((part, i) => ({
        label: truncate(part, 30),
        isEllipsis: false,
        isLast: i === parts.length - 1,
      }))
    : [
        { label: "...", isEllipsis: true, isLast: false },
        { label: truncate(parts[parts.length - 1], 30), isEllipsis: false, isLast: true },
      ];

  return (
    <div
      className="flex items-center gap-0.5 cursor-pointer hover:text-foreground transition-colors"
      onClick={() => onCopy(fullPath || "Buckets")}
    >
      {bucket ? (
        <span className="px-0.5 shrink-0">
          {truncate(bucket, 20)}
        </span>
      ) : (
        <span className="px-0.5 shrink-0">
          Buckets ({bucketCount})
        </span>
      )}
      {displayParts.map((item, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span>/</span>
          <span className={`px-0.5 ${item.isLast ? "font-medium truncate max-w-[200px]" : ""}`}>
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}
