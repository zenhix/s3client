import { useState, useCallback, useEffect, useRef } from "react";
import { useS3 } from "./hooks/useS3";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { save, open } from "@tauri-apps/plugin-dialog";
import ConnectionDialog from "./components/ConnectionDialog";
import BucketList from "./components/BucketList";
import ObjectTable from "./components/ObjectTable";
import Breadcrumbs from "./components/Breadcrumbs";
import Toolbar from "./components/Toolbar";
import FilePreview from "./components/FilePreview";
import type { BucketInfo, ObjectInfo } from "./types";

export default function App() {
  const s3 = useS3();
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState("");
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [currentBucket, setCurrentBucket] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("");
  const [objects, setObjects] = useState<ObjectInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    key: string;
  } | null>(null);
  const [toast, setToast] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  // History for back navigation
  const [history, setHistory] = useState<
    Array<{ bucket: string | null; prefix: string }>
  >([]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const loadBuckets = useCallback(
    async (connId: string) => {
      setLoading(true);
      try {
        const b = await s3.listBuckets(connId);
        setBuckets(b);
        setCurrentBucket(null);
        setPrefix("");
        setObjects([]);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [s3],
  );

  const loadObjects = useCallback(
    async (connId: string, bucket: string, pfx: string) => {
      setLoading(true);
      try {
        const objs = await s3.listObjects(connId, bucket, pfx);
        setObjects(objs);
        setSelected(new Set());
        setFilter("");
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [s3],
  );

  function handleConnected(connId: string, ep: string) {
    setConnectionId(connId);
    setEndpoint(ep);
    loadBuckets(connId);
  }

  function enterBucket(bucket: string) {
    if (!connectionId) return;
    setHistory((h) => [...h, { bucket: currentBucket, prefix }]);
    setCurrentBucket(bucket);
    setPrefix("");
    loadObjects(connectionId, bucket, "");
  }

  function navigateTo(newPrefix: string) {
    if (!connectionId || !currentBucket) return;
    setHistory((h) => [...h, { bucket: currentBucket, prefix }]);
    setPrefix(newPrefix);
    loadObjects(connectionId, currentBucket, newPrefix);
  }

  function goBack() {
    if (!connectionId) return;
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    if (prev.bucket === null) {
      setCurrentBucket(null);
      setPrefix("");
      loadBuckets(connectionId);
    } else {
      setCurrentBucket(prev.bucket);
      setPrefix(prev.prefix);
      loadObjects(connectionId, prev.bucket, prev.prefix);
    }
  }

  function goToBucketList() {
    if (!connectionId) return;
    setHistory((h) => [...h, { bucket: currentBucket, prefix }]);
    setCurrentBucket(null);
    setPrefix("");
    loadBuckets(connectionId);
  }

  function handleSelect(key: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  async function handleUpload() {
    if (!connectionId || !currentBucket) return;
    const files = await open({ multiple: true });
    if (!files) return;

    const paths = Array.isArray(files) ? files : [files];
    for (const filePath of paths) {
      const fileName = filePath.split("/").pop() ?? filePath.split("\\").pop() ?? filePath;
      const key = prefix + fileName;
      try {
        await s3.uploadObject(connectionId, currentBucket, key, filePath);
        showToast(`Uploaded ${fileName}`);
      } catch (e) {
        setError(String(e));
      }
    }
    loadObjects(connectionId, currentBucket, prefix);
  }

  async function handleDelete() {
    if (!connectionId || !currentBucket || selected.size === 0) return;
    const count = selected.size;
    if (!window.confirm(`Delete ${count} object${count > 1 ? "s" : ""}?`))
      return;

    for (const key of selected) {
      try {
        await s3.deleteObject(connectionId, currentBucket, key);
      } catch (e) {
        setError(String(e));
      }
    }
    showToast(`Deleted ${count} object${count > 1 ? "s" : ""}`);
    setSelected(new Set());
    loadObjects(connectionId, currentBucket, prefix);
  }

  async function handleDownload(key: string) {
    if (!connectionId || !currentBucket) return;
    const fileName = key.split("/").pop() ?? key;
    const path = await save({ defaultPath: fileName });
    if (path) {
      try {
        await s3.downloadObject(connectionId, currentBucket, key, path);
        showToast(`Downloaded ${fileName}`);
      } catch (e) {
        setError(String(e));
      }
    }
  }

  async function copyS3Uri(key: string) {
    const uri = `s3://${currentBucket}/${key}`;
    await writeText(uri);
    showToast(`Copied ${uri}`);
    setContextMenu(null);
  }

  function handleContextMenu(e: React.MouseEvent, key: string) {
    setContextMenu({ x: e.clientX, y: e.clientY, key });
  }

  // Close context menu on click elsewhere
  useEffect(() => {
    function handler() {
      setContextMenu(null);
    }
    if (contextMenu) {
      window.addEventListener("click", handler);
      return () => window.removeEventListener("click", handler);
    }
  }, [contextMenu]);

  // Drag and drop
  useEffect(() => {
    const el = dropRef.current;
    if (!el || !currentBucket) return;

    function handleDragOver(e: DragEvent) {
      e.preventDefault();
      el!.classList.add("ring-2", "ring-blue-400");
    }
    function handleDragLeave() {
      el!.classList.remove("ring-2", "ring-blue-400");
    }
    async function handleDrop(e: DragEvent) {
      e.preventDefault();
      el!.classList.remove("ring-2", "ring-blue-400");
      if (!connectionId || !currentBucket) return;

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      // Tauri drag-and-drop provides file paths via a custom event,
      // but the web DragEvent doesn't give local paths.
      // For now, show a hint to use the Upload button.
      showToast("Use the Upload button to select files");
    }

    el.addEventListener("dragover", handleDragOver);
    el.addEventListener("dragleave", handleDragLeave);
    el.addEventListener("drop", handleDrop);
    return () => {
      el.removeEventListener("dragover", handleDragOver);
      el.removeEventListener("dragleave", handleDragLeave);
      el.removeEventListener("drop", handleDrop);
    };
  }, [connectionId, currentBucket, prefix, s3]);

  async function handleDisconnect() {
    if (connectionId) {
      await s3.disconnect(connectionId);
    }
    setConnectionId(null);
    setEndpoint("");
    setBuckets([]);
    setCurrentBucket(null);
    setPrefix("");
    setObjects([]);
    setHistory([]);
    setSelected(new Set());
  }

  if (!connectionId) {
    return <ConnectionDialog onConnected={handleConnected} />;
  }

  return (
    <div
      ref={dropRef}
      className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
    >
      {/* Breadcrumbs */}
      <Breadcrumbs
        bucket={currentBucket}
        prefix={prefix}
        onNavigate={navigateTo}
        onBack={goBack}
        onBucketList={goToBucketList}
      />

      {/* Toolbar */}
      <Toolbar
        filter={filter}
        onFilterChange={setFilter}
        onUpload={handleUpload}
        onDelete={handleDelete}
        hasSelection={selected.size > 0}
        inBucket={currentBucket !== null}
      />

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-2 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="px-4 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs">
          Loading...
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {currentBucket === null ? (
          <BucketList buckets={buckets} onSelect={enterBucket} />
        ) : (
          <ObjectTable
            objects={objects}
            prefix={prefix}
            filter={filter}
            selected={selected}
            onSelect={handleSelect}
            onNavigate={navigateTo}
            onPreview={setPreviewKey}
            onContextMenu={handleContextMenu}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>
          Connected to {endpoint}
          {currentBucket && ` · ${currentBucket}`}
          {objects.length > 0 &&
            ` · ${objects.length} item${objects.length !== 1 ? "s" : ""}`}
        </span>
        <button
          onClick={handleDisconnect}
          className="text-red-500 hover:text-red-600 hover:underline"
        >
          Disconnect
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => copyS3Uri(contextMenu.key)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Copy S3 URI
          </button>
          <button
            onClick={() => {
              handleDownload(contextMenu.key);
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Download
          </button>
        </div>
      )}

      {/* File preview modal */}
      {previewKey && currentBucket && (
        <FilePreview
          connectionId={connectionId}
          bucket={currentBucket}
          objectKey={previewKey}
          onClose={() => setPreviewKey(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-[fadeIn_0.2s]">
          {toast}
        </div>
      )}
    </div>
  );
}
