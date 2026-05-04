import { useState, useEffect, useRef } from "react";
import { useS3 } from "@/hooks/useS3";
import type { SavedConnection, ConnectionType } from "@/types";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const AWS_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-north-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "sa-east-1",
  "ca-central-1",
];

interface Props {
  onConnected: (connectionId: string, endpoint: string) => void;
}

export default function ConnectionDialog({ onConnected }: Props) {
  const s3 = useS3();

  const DEFAULT_NAMES: Record<ConnectionType, string> = {
    local: "My LocalStack",
    aws: "My AWS Account",
  };

  const [connectionType, setConnectionType] = useState<ConnectionType>("local");
  const [name, setName] = useState(DEFAULT_NAMES["local"]);

  // Local S3 fields
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("4566");
  const [localAccessKey, setLocalAccessKey] = useState("");
  const [localSecretKey, setLocalSecretKey] = useState("");

  // AWS S3 fields
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");

  const [showLocalSecret, setShowLocalSecret] = useState(false);
  const [showAwsSecret, setShowAwsSecret] = useState(false);
  const [saved, setSaved] = useState<SavedConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    s3.listSavedConnections().then(setSaved).catch(() => {});
  }, []);

  function buildEndpoint(): string {
    if (connectionType === "local") {
      return `http://${host}:${port}`;
    }
    return "";
  }

  function getRegion(): string {
    return connectionType === "local" ? "us-east-1" : awsRegion;
  }

  function getAccessKey(): string {
    return connectionType === "local" ? localAccessKey : awsAccessKey;
  }

  function getSecretKey(): string {
    return connectionType === "local" ? localSecretKey : awsSecretKey;
  }

  function getConnectionName(): string {
    if (name.trim()) return name.trim();
    if (connectionType === "local") return `${host}:${port}`;
    return `AWS (${awsRegion})`;
  }

  function canConnect(): boolean {
    if (!name.trim()) return false;
    if (connectionType === "local") {
      return !!host && !!port && !!localAccessKey && !!localSecretKey;
    }
    return !!awsRegion && !!awsAccessKey && !!awsSecretKey;
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    cancelledRef.current = false;
    const endpoint = buildEndpoint();
    const region = getRegion();
    const accessKey = getAccessKey();
    const secretKey = getSecretKey();

    try {
      const id = await s3.connect(endpoint, region, accessKey, secretKey);

      if (cancelledRef.current) return;

      // Always save the connection
      await s3.saveConnection({
        id,
        name: getConnectionName(),
        connection_type: connectionType,
        endpoint,
        region,
        access_key: accessKey,
        secret_key: secretKey,
      });

      toast.success("Connected", { description: `Connected to ${endpoint || `AWS (${region})`}` });
      onConnected(id, endpoint || `AWS (${region})`);
    } catch (e) {
      if (!cancelledRef.current) {
        toast.error("Connection failed", { description: String(e) });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    cancelledRef.current = true;
    setLoading(false);
    toast.info("Connection cancelled");
  }

  function loadSaved(conn: SavedConnection) {
    const type = (conn.connection_type || "local") as ConnectionType;
    setConnectionType(type);
    setName(conn.name);

    if (type === "local") {
      // Parse host:port from endpoint
      try {
        const url = new URL(conn.endpoint);
        setHost(url.hostname);
        setPort(url.port || "4566");
      } catch {
        setHost("localhost");
        setPort("4566");
      }
      setLocalAccessKey(conn.access_key);
      setLocalSecretKey(conn.secret_key);
    } else {
      setAwsRegion(conn.region);
      setAwsAccessKey(conn.access_key);
      setAwsSecretKey(conn.secret_key);
    }
  }

  async function removeSaved(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await s3.deleteSavedConnection(id);
    setSaved(saved.filter((c) => c.id !== id));
    toast.success("Connection removed");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md pt-0 border border-border">
        <CardHeader className="border-b pt-3 pb-2">
          <CardTitle className="text-md text-center">s3client</CardTitle>
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
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {(c.connection_type || "local").toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">{c.name}</span>
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

          <form onSubmit={handleConnect} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="connection-type">Connection Type</Label>
              <Select
                value={connectionType}
                onValueChange={(v) => {
                  if (!v) return;
                  const newType = v as ConnectionType;
                  // Update name if it's still a default
                  if (!name.trim() || Object.values(DEFAULT_NAMES).includes(name)) {
                    setName(DEFAULT_NAMES[newType]);
                  }
                  setConnectionType(newType);
                }}
              >
                <SelectTrigger id="connection-type" className="w-full cursor-pointer">
                  <SelectValue placeholder="Select connection type">
                    {connectionType === "local"
                      ? "Local S3 (LocalStack, MinIO)"
                      : "AWS S3"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local S3 (LocalStack, MinIO)</SelectItem>
                  <SelectItem value="aws">AWS S3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="name">Connection Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a connection name"
              />
            </div>

            <Separator className="!w-[calc(100%+2rem)] -ml-4" />

            {connectionType === "local" && (
              <>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-3">
                    <Label htmlFor="host">Host <span className="text-destructive">*</span></Label>
                    <Input
                      id="host"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="localhost"
                    />
                  </div>
                  <div className="w-24 space-y-3">
                    <Label htmlFor="port">Port <span className="text-destructive">*</span></Label>
                    <Input
                      id="port"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder="4566"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="local-access-key">Access Key <span className="text-destructive">*</span></Label>
                  <Input
                    id="local-access-key"
                    value={localAccessKey}
                    onChange={(e) => setLocalAccessKey(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="local-secret-key">Secret Key <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="local-secret-key"
                      type={showLocalSecret ? "text" : "password"}
                      value={localSecretKey}
                      onChange={(e) => setLocalSecretKey(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLocalSecret(!showLocalSecret)}
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showLocalSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {connectionType === "aws" && (
              <>
                <div className="space-y-3">
                  <Label htmlFor="aws-region">Region <span className="text-destructive">*</span></Label>
                  <Select value={awsRegion} onValueChange={(v) => v && setAwsRegion(v)}>
                    <SelectTrigger id="aws-region">
                      <SelectValue placeholder="Select a region" />
                    </SelectTrigger>
                    <SelectContent>
                      {AWS_REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="aws-access-key">Access Key ID <span className="text-destructive">*</span></Label>
                  <Input
                    id="aws-access-key"
                    value={awsAccessKey}
                    onChange={(e) => setAwsAccessKey(e.target.value)}
                    placeholder="AKIA..."
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="aws-secret-key">Secret Access Key <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="aws-secret-key"
                      type={showAwsSecret ? "text" : "password"}
                      value={awsSecretKey}
                      onChange={(e) => setAwsSecretKey(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAwsSecret(!showAwsSecret)}
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showAwsSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || !canConnect()}
                className="flex-1"
              >
                {loading ? "Connecting..." : "Connect"}
              </Button>
              {loading && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
