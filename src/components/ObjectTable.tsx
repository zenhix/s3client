import { useState } from "react";
import type { ObjectInfo, SortField, SortDir } from "../types";

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
  if (["pdf"].includes(ext)) return "📕";
  if (["json"].includes(ext)) return "📋";
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
    // Folders always first
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

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        {filter ? "No matching objects" : "This folder is empty"}
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
          <tr className="text-left text-gray-500 dark:text-gray-400">
            <th className="w-10 px-4 py-2">
              <input
                type="checkbox"
                checked={
                  sorted.length > 0 &&
                  sorted.filter((o) => !o.is_folder).every((o) => selected.has(o.key))
                }
                onChange={(e) => {
                  sorted
                    .filter((o) => !o.is_folder)
                    .forEach((o) => onSelect(o.key, e.target.checked));
                }}
                className="rounded"
              />
            </th>
            <th
              className="px-4 py-2 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
              onClick={() => handleSort("key")}
            >
              Name{sortIndicator("key")}
            </th>
            <th
              className="px-4 py-2 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none w-28"
              onClick={() => handleSort("size")}
            >
              Size{sortIndicator("size")}
            </th>
            <th
              className="px-4 py-2 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none w-48"
              onClick={() => handleSort("last_modified")}
            >
              Modified{sortIndicator("last_modified")}
            </th>
            <th className="px-4 py-2 w-20">Type</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((obj) => {
            const name = displayName(obj.key, prefix);
            return (
              <tr
                key={obj.key}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onContextMenu(e, obj.key);
                }}
                className={`border-t border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-800/50 transition-colors ${
                  selected.has(obj.key)
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
              >
                <td className="px-4 py-2">
                  {!obj.is_folder && (
                    <input
                      type="checkbox"
                      checked={selected.has(obj.key)}
                      onChange={(e) => onSelect(obj.key, e.target.checked)}
                      className="rounded"
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() =>
                      obj.is_folder ? onNavigate(obj.key) : onPreview(obj.key)
                    }
                    className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 text-gray-900 dark:text-white"
                  >
                    <span>{getFileIcon(obj.key, obj.is_folder)}</span>
                    <span className="truncate">{name}</span>
                  </button>
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {obj.is_folder ? "—" : formatSize(obj.size)}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {formatDate(obj.last_modified)}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {getFileType(obj.key, obj.is_folder)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
