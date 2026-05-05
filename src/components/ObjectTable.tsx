import { useState } from "react";
import type { ObjectInfo, SortField, SortDir } from "@/types";
import { ArrowUp, ArrowDown, Folder, File } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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

  const sortIcon = (field: SortField) =>
    sortField === field ? (
      sortDir === "asc" ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />
    ) : null;

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

  const allSelected =
    sorted.length > 0 && sorted.every((o) => selected.has(o.key));

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-xs">
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
                  sorted.forEach((o) => onSelect(o.key, v === true));
                }}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:text-foreground"
              onClick={() => handleSort("key")}
            >
              Name{sortIcon("key")}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:text-foreground w-28"
              onClick={() => handleSort("size")}
            >
              Size{sortIcon("size")}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:text-foreground w-48"
              onClick={() => handleSort("last_modified")}
            >
              Modified{sortIcon("last_modified")}
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
                  <Checkbox
                    checked={selected.has(obj.key)}
                    onCheckedChange={(v) => onSelect(obj.key, v === true)}
                  />
                </TableCell>
                <TableCell>
                  <button
                    onClick={() =>
                      obj.is_folder
                        ? onNavigate(obj.key)
                        : onSelect(obj.key, !selected.has(obj.key))
                    }
                    className={`flex items-center gap-2 truncate transition-colors cursor-pointer ${obj.is_folder ? "hover:text-primary hover:underline" : "hover:underline"}`}
                  >
                    {obj.is_folder ? (
                      <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    {name}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {obj.is_folder ? "—" : formatSize(obj.size)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(obj.last_modified)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getFileType(obj.key, obj.is_folder)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
