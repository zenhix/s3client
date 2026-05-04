import { useState, useEffect } from "react";
import { useS3 } from "../hooks/useS3";
import type { SavedConnection } from "../types";

interface Props {
  onConnected: (connectionId: string, endpoint: string) => void;
}

export default function ConnectionDialog({ onConnected }: Props) {
  const s3 = useS3();
  const [endpoint, setEndpoint] = useState("http://localhost:4566");
  const [region, setRegion] = useState("us-east-1");
  const [accessKey, setAccessKey] = useState("test");
  const [secretKey, setSecretKey] = useState("test");
  const [name, setName] = useState("");
  const [saveConn, setSaveConn] = useState(false);
  const [saved, setSaved] = useState<SavedConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    s3.listSavedConnections().then(setSaved).catch(() => {});
  }, []);

  async function handleConnect() {
    setLoading(true);
    setError("");
    try {
      const id = await s3.connect(endpoint, region, accessKey, secretKey);
      if (saveConn && name) {
        await s3.saveConnection({
          id,
          name,
          endpoint,
          region,
          access_key: accessKey,
          secret_key: secretKey,
        });
      }
      onConnected(id, endpoint);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function loadSaved(conn: SavedConnection) {
    setEndpoint(conn.endpoint);
    setRegion(conn.region);
    setAccessKey(conn.access_key);
    setSecretKey(conn.secret_key);
    setName(conn.name);
  }

  async function removeSaved(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await s3.deleteSavedConnection(id);
    setSaved(saved.filter((c) => c.id !== id));
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Connect to S3
        </h1>

        {saved.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Saved Connections
            </h3>
            <div className="space-y-1">
              {saved.map((c) => (
                <div
                  key={c.id}
                  onClick={() => loadSaved(c)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {c.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {c.endpoint}
                    </span>
                  </div>
                  <button
                    onClick={(e) => removeSaved(e, c.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endpoint URL
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:4566"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="us-east-1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Access Key
            </label>
            <input
              type="text"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Secret Key
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="save"
              checked={saveConn}
              onChange={(e) => setSaveConn(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="save"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Save connection
            </label>
            {saveConn && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Connection name"
                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading || !endpoint || !accessKey || !secretKey}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}
