import { useState, useEffect } from "react";
import { useS3 } from "@/hooks/useS3";
import type { SavedConnection } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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

  useEffect(() => {
    s3.listSavedConnections().then(setSaved).catch(() => {});
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
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
      toast.error("Connection failed", { description: String(e) });
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
    toast.success("Connection removed");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Connect to S3</CardTitle>
          <CardDescription>
            Enter your S3 endpoint credentials to browse buckets and objects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {saved.length > 0 && (
            <>
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Saved Connections
                </Label>
                <div className="mt-2 space-y-1">
                  {saved.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadSaved(c)}
                      className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent cursor-pointer group transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {c.endpoint}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => removeSaved(e, c.id)}
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Separator className="mb-4" />
            </>
          )}

          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://localhost:4566"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="us-east-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessKey">Access Key</Label>
              <Input
                id="accessKey"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Toggle
                variant="outline"
                size="sm"
                pressed={saveConn}
                onPressedChange={setSaveConn}
              >
                Save connection
              </Toggle>
              {saveConn && (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Connection name"
                  className="flex-1 h-8 text-sm"
                />
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !endpoint || !accessKey || !secretKey}
              className="w-full"
            >
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
