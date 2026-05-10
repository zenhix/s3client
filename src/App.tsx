import { useState, useCallback, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useS3 } from "@/hooks/useS3";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import ConnectionSidebar from "@/components/ConnectionSidebar";
import ConnectionDialog from "@/components/ConnectionDialog";
import BucketList from "@/components/BucketList";
import ObjectTable from "@/components/ObjectTable";
import Breadcrumbs from "@/components/Breadcrumbs";
import Toolbar from "@/components/Toolbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, RefreshCw } from "lucide-react";
import type { BucketInfo, ObjectInfo, SavedConnection } from "@/types";

export default function App() {
  const s3 = useS3();
  const [saved, setSaved] = useState<SavedConnection[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState("");
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [currentBucket, setCurrentBucket] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("");
  const [objects, setObjects] = useState<ObjectInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    key: string;
  } | null>(null);

  const [promptDialog, setPromptDialog] = useState<{
    type: "create-folder" | "rename";
    key?: string;
    defaultValue?: string;
  } | null>(null);
  const [promptValue, setPromptValue] = useState("");

  const [history, setHistory] = useState<
    Array<{ bucket: string | null; prefix: string }>
  >([]);

  useEffect(() => {
    s3.listSavedConnections().then(setSaved).catch(() => {});
  }, []);

  const refreshSaved = useCallback(async () => {
    try {
      const list = await s3.listSavedConnections();
      setSaved(list);
    } catch {}
  }, [s3]);

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

  async function handleConnected(connId: string, ep: string) {
    setConnectionId(connId);
    setEndpoint(ep);
    setHistory([]);
    await refreshSaved();
    loadBuckets(connId);
  }

  async function handleSidebarConnect(conn: SavedConnection) {
    // If already connected to this one, disconnect
    if (activeSavedId === conn.id) {
      if (connectionId) await s3.disconnect(connectionId);
      setConnectionId(null);
      setActiveSavedId(null);
      setEndpoint("");
      setBuckets([]);
      setCurrentBucket(null);
      setPrefix("");
      setObjects([]);
      setHistory([]);
      setSelected(new Set());
      toast.info("Disconnected");
      return;
    }

    try {
      const id = await s3.connect(conn.endpoint, conn.region, conn.access_key, conn.secret_key);
      setConnectionId(id);
      setActiveSavedId(conn.id);
      setEndpoint(conn.endpoint || `AWS (${conn.region})`);
      setHistory([]);
      loadBuckets(id);
    } catch (e) {
      toast.error("Connection failed", { description: String(e) });
    }
  }

  async function handleDeleteConnection(id: string) {
    await s3.deleteSavedConnection(id);
    setSaved(saved.filter((c) => c.id !== id));
    if (activeSavedId === id) {
      if (connectionId) await s3.disconnect(connectionId);
      setConnectionId(null);
      setActiveSavedId(null);
      setEndpoint("");
      setBuckets([]);
      setCurrentBucket(null);
      setPrefix("");
      setObjects([]);
      setHistory([]);
      setSelected(new Set());
    }
    toast.success("Connection removed");
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
    const isFolder = key.endsWith("/");

    if (isFolder) {
      const folderName = key.split("/").filter(Boolean).pop() ?? "folder";
      const path = await save({ defaultPath: `${folderName}.zip` });
      if (path) {
        try {
          await s3.downloadFolder(connectionId, currentBucket, key, path);
          toast.success(`Downloaded ${folderName}.zip`);
        } catch (e) {
          toast.error("Download failed", { description: String(e) });
        }
      }
    } else {
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
  }

  async function handleDownloadSelected() {
    if (!connectionId || !currentBucket || selected.size === 0) return;
    for (const key of selected) {
      await handleDownload(key);
    }
  }

  function handleRename(key: string) {
    const isFolder = key.endsWith("/");
    const currentName = isFolder
      ? key.split("/").filter(Boolean).pop() ?? ""
      : key.split("/").pop() ?? "";
    setPromptValue(currentName);
    setPromptDialog({ type: "rename", key, defaultValue: currentName });
  }

  function handleCreateFolder() {
    if (!connectionId || !currentBucket) return;
    setPromptValue("");
    setPromptDialog({ type: "create-folder" });
  }

  async function handlePromptConfirm() {
    if (!connectionId || !currentBucket || !promptValue.trim()) return;
    const value = promptValue.trim();

    if (promptDialog?.type === "create-folder") {
      const key = `${prefix}${value}/`;
      try {
        await s3.createFolder(connectionId, currentBucket, key);
        toast.success(`Created folder ${value}`);
        loadObjects(connectionId, currentBucket, prefix);
      } catch (e) {
        toast.error("Failed to create folder", { description: String(e) });
      }
    } else if (promptDialog?.type === "rename" && promptDialog.key) {
      const oldKey = promptDialog.key;
      const isFolder = oldKey.endsWith("/");
      const currentName = isFolder
        ? oldKey.split("/").filter(Boolean).pop() ?? ""
        : oldKey.split("/").pop() ?? "";

      if (value === currentName) {
        setPromptDialog(null);
        return;
      }

      const parentPrefix = oldKey.slice(0, oldKey.lastIndexOf(currentName));
      const newKey = isFolder ? `${parentPrefix}${value}/` : `${parentPrefix}${value}`;

      try {
        await s3.renameObject(connectionId, currentBucket, oldKey, newKey);
        toast.success(`Renamed to ${value}`);
        loadObjects(connectionId, currentBucket, prefix);
      } catch (e) {
        toast.error("Rename failed", { description: String(e) });
      }
    }

    setPromptDialog(null);
  }

  function handleContextMenu(e: React.MouseEvent, key: string) {
    setContextMenu({ x: e.clientX, y: e.clientY, key });
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      const menu = document.getElementById("context-menu");
      if (menu && menu.contains(e.target as Node)) return;
      setContextMenu(null);
    }
    if (contextMenu) {
      window.addEventListener("mousedown", handler);
      return () => window.removeEventListener("mousedown", handler);
    }
  }, [contextMenu]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Title bar */}
      <div
        className="flex items-center gap-3 px-4 h-[40px] border-b shrink-0 select-none text-sm"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("button, a")) return;
          e.preventDefault();
          getCurrentWindow().startDragging();
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => getCurrentWindow().close()}
            className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] hover:brightness-90 transition-all cursor-pointer"
          />
          <button
            onClick={() => getCurrentWindow().minimize()}
            className="w-3.5 h-3.5 rounded-full bg-[#febc2e] hover:brightness-90 transition-all cursor-pointer"
          />
          <button
            onClick={() => getCurrentWindow().toggleMaximize()}
            className="w-3.5 h-3.5 rounded-full bg-[#28c840] hover:brightness-90 transition-all cursor-pointer"
          />
        </div>
        {connectionId ? (
          <span className="text-sm text-foreground/70">{endpoint}</span>
        ) : (
          <span className="text-sm text-foreground/70">s3client</span>
        )}
        <div className="flex-1" />
        {connectionId && (
          <button
            onClick={() => {
              if (currentBucket) {
                loadObjects(connectionId, currentBucket, prefix);
              } else {
                loadBuckets(connectionId);
              }
            }}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Body: sidebar + right panel */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — full height */}
        <div className="w-56 shrink-0 border-r flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 border-b text-sm h-[37px] shrink-0">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Connections</span>
            <button
              onClick={() => setDialogOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <ConnectionSidebar
            saved={saved}
            activeConnectionId={activeSavedId}
            onConnect={handleSidebarConnect}
            onDelete={handleDeleteConnection}
            onNewConnection={() => setDialogOpen(true)}
          />
        </div>

        {/* Right panel */}
        <div className="flex flex-col flex-1 min-w-0">
          {connectionId ? (
            <>
              <Toolbar
                filter={filter}
                onFilterChange={setFilter}
                onUpload={handleUpload}
                onDownload={handleDownloadSelected}
                onDelete={() => setDeleteDialogOpen(true)}
                onBack={goBack}
                onCreateFolder={handleCreateFolder}
                hasSelection={selected.size > 0}
                inBucket={currentBucket !== null}
                canGoBack={history.length > 0}
              />

              {loading && (
                <div className="px-4 py-1 text-xs text-muted-foreground border-b">
                  Loading...
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {currentBucket === null ? (
                  <BucketList buckets={buckets} filter={filter} onSelect={enterBucket} />
                ) : (
                  <ObjectTable
                    objects={objects}
                    prefix={prefix}
                    filter={filter}
                    selected={selected}
                    onSelect={handleSelect}
                    onNavigate={navigateTo}
                    onContextMenu={handleContextMenu}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
              Select or add a connection to get started
            </div>
          )}
        </div>
      </div>

      {/* Footer — breadcrumbs */}
      {connectionId && (
        <div className="flex items-center gap-0.5 px-4 border-t shrink-0 h-[28px] text-[11px] text-muted-foreground overflow-x-auto">
          <Breadcrumbs
            bucket={currentBucket}
            prefix={prefix}
            bucketCount={buckets.length}
            onCopy={async (path) => {
              try {
                await writeText(path);
                toast.success(`Copied ${path}`);
              } catch (e) {
                console.error("[copy] failed:", e);
                toast.error("Copy failed", { description: String(e) });
              }
            }}
          />
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          id="context-menu"
          className="fixed z-50 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRename(contextMenu.key);
              setContextMenu(null);
            }}
            className="w-full flex items-center rounded-sm px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          >
            Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(contextMenu.key);
              setContextMenu(null);
            }}
            className="w-full flex items-center rounded-sm px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          >
            Download
          </button>
        </div>
      )}

      {/* Prompt dialog (create folder / rename) */}
      <Dialog open={!!promptDialog} onOpenChange={(open) => !open && setPromptDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {promptDialog?.type === "create-folder" ? "New Folder" : "Rename"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePromptConfirm();
            }}
            className="space-y-4"
          >
            <Input
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={promptDialog?.type === "create-folder" ? "Folder name" : "New name"}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPromptDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!promptValue.trim()}>
                {promptDialog?.type === "create-folder" ? "Create" : "Rename"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add connection dialog */}
      <ConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnected={handleConnected}
      />

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
