import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <div className="flex items-center gap-1 px-4 py-2 border-b text-sm overflow-x-auto">
      <Button variant="ghost" size="sm" onClick={onBack} className="h-7 px-2">
        ←
      </Button>
      <Separator orientation="vertical" className="h-4 mx-1" />
      <Button
        variant="link"
        size="sm"
        onClick={onBucketList}
        className="h-7 px-1 text-muted-foreground hover:text-foreground"
      >
        Buckets
      </Button>
      {bucket && (
        <>
          <span className="text-muted-foreground">/</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => onNavigate("")}
            className="h-7 px-1"
          >
            {bucket}
          </Button>
        </>
      )}
      {parts.map((part, i) => {
        const path = parts.slice(0, i + 1).join("/") + "/";
        const isLast = i === parts.length - 1;
        return (
          <span key={path} className="flex items-center gap-1">
            <span className="text-muted-foreground">/</span>
            {isLast ? (
              <span className="font-medium px-1">{part}</span>
            ) : (
              <Button
                variant="link"
                size="sm"
                onClick={() => onNavigate(path)}
                className="h-7 px-1"
              >
                {part}
              </Button>
            )}
          </span>
        );
      })}
    </div>
  );
}
