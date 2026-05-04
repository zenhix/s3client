import { useState } from "react";
import type { ObjectInfo, SortField, SortDir } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  objects: ObjectInfo[];
  prefix: string;
  filter: string;
  selected: Set<string>;
  onSelect: (key: string, checked: boolean) => void;
  onNavigate: (prefix: string) => void;
  onPreview: (key: string) => void;
  onContextMenu: (e: React.MouseEvent, key: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(key: string, isFolder: boolean): string {
  if (isFolder) return "📁";
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"].includes(ext))
    return "🖼️";
  if (ext === "pdf") return "📕";
  if (ext === "json") return "📋";
  if (["csv", "tsv", "xls", "xlsx"].includes(ext)) return "📊";
  if (["zip", "gz", "tar", "rar", "7z"].includes(ext)) return "📦";
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "🎬";
  if (["mp3", "wav", "flac", "ogg"].includes(ext)) return "🎵";
  if (["txt", "md", "log"].includes(ext)) return "📄";
  if (["js", "ts", "py", "rs", "go", "java", "html", "css"].includes(ext))
    return "📝";
  return "📄";
}

function displayName(key: string, prefix: string): string {
  const name = key.startsWith(prefix) ? key.slice(prefix.length) : key;
  return name.endsWith("/") ? name.slice(0, -1) : name;
}

function getFileType(key: string, isFolder: boolean): string {
  if (isFolder) return "Folder";
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  if (!ext || ext === key) return "File";
  return ext.toUpperCase();
}

export default function ObjectTable({
  objects,
  prefix,
  filter,
  selected,
  onSelect,
  onNavigate,
  onPreview,
  onContextMenu,
}: Props) {
  const [sortField, setSortField] = useState<SortField>("key");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const filtered = objects.filter((o) => {
    if (!filter) return true;
    const name = displayName(o.key, prefix).toLowerCase();
    return name.includes(filter.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.is_folder !== b.is_folder) return a.is_folder ? -1 : 1;
    let cmp = 0;
    switch (sortField) {
      case "key":
        cmp = a.key.localeCompare(b.key);
        break;
      case "size":
        cmp = a.size - b.size;
        break;
      case "last_modified":
        cmp = (a.last_modified ?? "").localeCompare(b.last_modified ?? "");
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const allFiles = sorted.filter((o) => !o.is_folder);
  const allSelected =
    allFiles.length > 0 && allFiles.every((o) => selected.has(o.key));

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {filter ? "No matching objects" : "This folder is empty"}
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(v) => {
                  allFiles.forEach((o) => onSelect(o.key, v === true));
                }}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:text-foreground"
              onClick={() => handleSort("key")}
            >
              Name{sortIndicator("key")}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:text-foreground w-28"
              onClick={() => handleSort("size")}
            >
              Size{sortIndicator("size")}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:text-foreground w-48"
              onClick={() => handleSort("last_modified")}
            >
              Modified{sortIndicator("last_modified")}
            </TableHead>
            <TableHead className="w-24">Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((obj) => {
            const name = displayName(obj.key, prefix);
            return (
              <TableRow
                key={obj.key}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onContextMenu(e, obj.key);
                }}
                className={selected.has(obj.key) ? "bg-accent" : ""}
              >
                <TableCell>
                  {!obj.is_folder && (
                    <Checkbox
                      checked={selected.has(obj.key)}
                      onCheckedChange={(v) => onSelect(obj.key, v === true)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() =>
                      obj.is_folder
                        ? onNavigate(obj.key)
                        : onPreview(obj.key)
                    }
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <span>{getFileIcon(obj.key, obj.is_folder)}</span>
                    <span className="truncate">{name}</span>
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {obj.is_folder ? "—" : formatSize(obj.size)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(obj.last_modified)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {getFileType(obj.key, obj.is_folder)}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
