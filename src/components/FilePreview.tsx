import { useEffect, useState } from "react";
import { useS3 } from "@/hooks/useS3";
import { save } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Props {
  connectionId: string;
  bucket: string;
  objectKey: string;
  open: boolean;
  onClose: () => void;
}

function getExtension(key: string): string {
  return key.split(".").pop()?.toLowerCase() ?? "";
}

function isImage(ext: string): boolean {
  return ["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp"].includes(
    ext,
  );
}

function isText(ext: string): boolean {
  return [
    "txt", "md", "log", "json", "csv", "xml", "html", "css", "js", "ts",
    "py", "rs", "go", "java", "yaml", "yml", "toml", "ini", "cfg", "sh",
    "bash", "tsx", "jsx", "sql",
  ].includes(ext);
}

function isPdf(ext: string): boolean {
  return ext === "pdf";
}

export default function FilePreview({
  connectionId,
  bucket,
  objectKey,
  open,
  onClose,
}: Props) {
  const s3 = useS3();
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ext = getExtension(objectKey);
  const fileName = objectKey.split("/").pop() ?? objectKey;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    s3.getObjectBytes(connectionId, bucket, objectKey)
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [connectionId, bucket, objectKey, open]);

  async function handleDownload() {
    const path = await save({ defaultPath: fileName });
    if (path) {
      try {
        await s3.downloadObject(connectionId, bucket, objectKey, path);
        toast.success(`Downloaded ${fileName}`);
      } catch (e) {
        toast.error("Download failed", { description: String(e) });
      }
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading preview...
        </div>
      );
    }
    if (error) {
      return <div className="text-destructive p-4">{error}</div>;
    }
    if (!data) return null;

    if (isImage(ext)) {
      const mimeMap: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        svg: "image/svg+xml",
        webp: "image/webp",
        ico: "image/x-icon",
        bmp: "image/bmp",
      };
      const mime = mimeMap[ext] ?? "image/png";
      return (
        <img
          src={`data:${mime};base64,${data}`}
          alt={fileName}
          className="max-w-full max-h-[60vh] object-contain mx-auto rounded-md"
        />
      );
    }

    if (isPdf(ext)) {
      return (
        <iframe
          src={`data:application/pdf;base64,${data}`}
          className="w-full h-[60vh] rounded-md"
          title={fileName}
        />
      );
    }

    if (isText(ext)) {
      try {
        const text = atob(data);
        return (
          <ScrollArea className="h-[60vh]">
            <pre className="p-4 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap">
              {text}
            </pre>
          </ScrollArea>
        );
      } catch {
        return (
          <div className="text-muted-foreground p-4">
            Cannot decode file content
          </div>
        );
      }
    }

    return (
      <div className="text-muted-foreground p-4 text-center">
        Preview not available for .{ext} files.
        <br />
        <Button variant="link" onClick={handleDownload} className="mt-2">
          Download instead
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{fileName}</DialogTitle>
            <Button size="sm" onClick={handleDownload}>
              Download
            </Button>
          </div>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
