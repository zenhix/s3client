export interface BucketInfo {
  name: string;
  created_at: string | null;
}

export interface ObjectInfo {
  key: string;
  size: number;
  last_modified: string | null;
  is_folder: boolean;
}

export type ConnectionType = "local" | "aws";

export interface SavedConnection {
  id: string;
  name: string;
  connection_type: ConnectionType;
  endpoint: string;
  region: string;
  access_key: string;
  secret_key: string;
}

export type SortField = "key" | "size" | "last_modified";
export type SortDir = "asc" | "desc";
