import { useEffect, useState } from "react";
import { useS3 } from "../hooks/useS3";
import { save } from "@tauri-apps/plugin-dialog";

interface Props {
  connectionId: string;
  bucket: string;
  objectKey: string;
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
    "txt",
    "md",
    "log",
    "json",
    "csv",
    "xml",
    "html",
    "css",
    "js",
    "ts",
    "py",
    "rs",
    "go",
    "java",
    "yaml",
    "yml",
    "toml",
    "ini",
    "cfg",
    "sh",
    "bash",
    "tsx",
    "jsx",
    "sql",
  ].includes(ext);
}

function isPdf(ext: string): boolean {
  return ext === "pdf";
}

export default function FilePreview({
  connectionId,
  bucket,
  objectKey,
  onClose,
}: Props) {
  const s3 = useS3();
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ext = getExtension(objectKey);
  const fileName = objectKey.split("/").pop() ?? objectKey;

  useEffect(() => {
    setLoading(true);
    setError("");
    s3.getObjectBytes(connectionId, bucket, objectKey)
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [connectionId, bucket, objectKey]);

  async function handleDownload() {
    const path = await save({ defaultPath: fileName });
    if (path) {
      try {
        await s3.downloadObject(connectionId, bucket, objectKey, path);
      } catch (e) {
        setError(String(e));
      }
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Loading preview...
        </div>
      );
    }
    if (error) {
      return <div className="text-red-500 p-4">{error}</div>;
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
          className="max-w-full max-h-[60vh] object-contain mx-auto"
        />
      );
    }

    if (isPdf(ext)) {
      return (
        <iframe
          src={`data:application/pdf;base64,${data}`}
          className="w-full h-[60vh]"
          title={fileName}
        />
      );
    }

    if (isText(ext)) {
      try {
        const text = atob(data);
        return (
          <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto max-h-[60vh] text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {text}
          </pre>
        );
      } catch {
        return (
          <div className="text-gray-500 p-4">Cannot decode file content</div>
        );
      }
    }

    return (
      <div className="text-gray-500 dark:text-gray-400 p-4 text-center">
        Preview not available for .{ext} files.
        <br />
        <button
          onClick={handleDownload}
          className="mt-2 text-blue-600 hover:underline"
        >
          Download instead
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {fileName}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Download
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 text-gray-500 hover:text-gray-900 dark:hover:text-white text-lg"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">{renderContent()}</div>
      </div>
    </div>
  );
}
