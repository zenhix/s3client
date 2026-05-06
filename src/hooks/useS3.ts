import { invoke } from "@tauri-apps/api/core";
import type { BucketInfo, ObjectInfo, SavedConnection } from "@/types";

export function useS3() {
  async function connect(
    endpoint: string,
    region: string,
    accessKey: string,
    secretKey: string,
  ): Promise<string> {
    return invoke<string>("connect", {
      endpoint,
      region,
      accessKey,
      secretKey,
    });
  }

  async function disconnect(connectionId: string): Promise<void> {
    return invoke("disconnect", { connectionId });
  }

  async function listBuckets(connectionId: string): Promise<BucketInfo[]> {
    return invoke<BucketInfo[]>("list_buckets", { connectionId });
  }

  async function listObjects(
    connectionId: string,
    bucket: string,
    prefix: string,
  ): Promise<ObjectInfo[]> {
    return invoke<ObjectInfo[]>("list_objects", {
      connectionId,
      bucket,
      prefix,
    });
  }

  async function downloadObject(
    connectionId: string,
    bucket: string,
    key: string,
    savePath: string,
  ): Promise<void> {
    return invoke("download_object", {
      connectionId,
      bucket,
      key,
      savePath,
    });
  }

  async function downloadFolder(
    connectionId: string,
    bucket: string,
    prefix: string,
    savePath: string,
  ): Promise<void> {
    return invoke("download_folder", {
      connectionId,
      bucket,
      prefix,
      savePath,
    });
  }

  async function uploadObject(
    connectionId: string,
    bucket: string,
    key: string,
    filePath: string,
  ): Promise<void> {
    return invoke("upload_object", {
      connectionId,
      bucket,
      key,
      filePath,
    });
  }

  async function createFolder(
    connectionId: string,
    bucket: string,
    key: string,
  ): Promise<void> {
    return invoke("create_folder", { connectionId, bucket, key });
  }

  async function renameObject(
    connectionId: string,
    bucket: string,
    oldKey: string,
    newKey: string,
  ): Promise<void> {
    return invoke("rename_object", { connectionId, bucket, oldKey, newKey });
  }

  async function deleteObject(
    connectionId: string,
    bucket: string,
    key: string,
  ): Promise<void> {
    return invoke("delete_object", { connectionId, bucket, key });
  }

  async function getObjectBytes(
    connectionId: string,
    bucket: string,
    key: string,
  ): Promise<string> {
    return invoke<string>("get_object_bytes", { connectionId, bucket, key });
  }

  async function saveConnection(
    connection: SavedConnection,
  ): Promise<void> {
    return invoke("save_connection", { connection });
  }

  async function listSavedConnections(): Promise<SavedConnection[]> {
    return invoke<SavedConnection[]>("list_saved_connections");
  }

  async function deleteSavedConnection(id: string): Promise<void> {
    return invoke("delete_saved_connection", { id });
  }

  return {
    connect,
    disconnect,
    listBuckets,
    listObjects,
    downloadObject,
    downloadFolder,
    uploadObject,
    createFolder,
    renameObject,
    deleteObject,
    getObjectBytes,
    saveConnection,
    listSavedConnections,
    deleteSavedConnection,
  };
}
