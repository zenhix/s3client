import { useState, useCallback, useEffect } from "react";
import { useS3 } from "@/hooks/useS3";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { save, open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import ConnectionDialog from "@/components/ConnectionDialog";
import BucketList from "@/components/BucketList";
import ObjectTable from "@/components/ObjectTable";
import Breadcrumbs from "@/components/Breadcrumbs";
import Toolbar from "@/components/Toolbar";
import FilePreview from "@/components/FilePreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BucketInfo, ObjectInfo } from "@/types";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    key: string;
  } | null>(null);

  const [history, setHistory] = useState<
    Array<{ bucket: string | null; prefix: string }>
  >([]);

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
        toast.error("Failed to list buckets", { description: String(e) });
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
        toast.error("Failed to list objects", { description: String(e) });
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
    if (!connectionId || history.length === 0) return;
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
      const fileName =
        filePath.split("/").pop() ?? filePath.split("\\").pop() ?? filePath;
      const key = prefix + fileName;
      try {
        await s3.uploadObject(connectionId, currentBucket, key, filePath);
        toast.success(`Uploaded ${fileName}`);
      } catch (e) {
        toast.error(`Failed to upload ${fileName}`, {
          description: String(e),
        });
      }
    }
    loadObjects(connectionId, currentBucket, prefix);
  }

  async function confirmDelete() {
    if (!connectionId || !currentBucket || selected.size === 0) return;
    const count = selected.size;
    for (const key of selected) {
      try {
        await s3.deleteObject(connectionId, currentBucket, key);
      } catch (e) {
        toast.error(`Failed to delete`, { description: String(e) });
      }
    }
    toast.success(`Deleted ${count} object${count > 1 ? "s" : ""}`);
    setSelected(new Set());
    setDeleteDialogOpen(false);
    loadObjects(connectionId, currentBucket, prefix);
  }

  async function handleDownload(key: string) {
    if (!connectionId || !currentBucket) return;
    const fileName = key.split("/").pop() ?? key;
    const path = await save({ defaultPath: fileName });
    if (path) {
      try {
        await s3.downloadObject(connectionId, currentBucket, key, path);
        toast.success(`Downloaded ${fileName}`);
      } catch (e) {
        toast.error("Download failed", { description: String(e) });
      }
    }
  }

  async function copyS3Uri(key: string) {
    const uri = `s3://${currentBucket}/${key}`;
    await writeText(uri);
    toast.success(`Copied ${uri}`);
    setContextMenu(null);
  }

  function handleContextMenu(e: React.MouseEvent, key: string) {
    setContextMenu({ x: e.clientX, y: e.clientY, key });
  }

  useEffect(() => {
    function handler() {
      setContextMenu(null);
    }
    if (contextMenu) {
      window.addEventListener("click", handler);
      return () => window.removeEventListener("click", handler);
    }
  }, [contextMenu]);

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
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Breadcrumbs
        bucket={currentBucket}
        prefix={prefix}
        onNavigate={navigateTo}
        onBack={goBack}
        onBucketList={goToBucketList}
      />

      <Toolbar
        filter={filter}
        onFilterChange={setFilter}
        onUpload={handleUpload}
        onDelete={() => setDeleteDialogOpen(true)}
        hasSelection={selected.size > 0}
        inBucket={currentBucket !== null}
      />

      {loading && (
        <div className="px-4 py-1 text-xs text-muted-foreground border-b">
          Loading...
        </div>
      )}

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
      <div className="flex items-center justify-between px-4 py-1.5 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-normal h-5">
            {endpoint}
          </Badge>
          {currentBucket && (
            <span className="text-muted-foreground">
              {currentBucket} &middot; {objects.length} item
              {objects.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="h-6 text-xs text-destructive hover:text-destructive"
        >
          Disconnect
        </Button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => copyS3Uri(contextMenu.key)}
            className="w-full flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Copy S3 URI
          </button>
          <Separator className="my-1" />
          <button
            onClick={() => {
              handleDownload(contextMenu.key);
              setContextMenu(null);
            }}
            className="w-full flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Download
          </button>
        </div>
      )}

      {/* File preview */}
      {previewKey && currentBucket && (
        <FilePreview
          connectionId={connectionId}
          bucket={currentBucket}
          objectKey={previewKey}
          open={!!previewKey}
          onClose={() => setPreviewKey(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete objects?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selected.size} selected object
              {selected.size !== 1 ? "s" : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
