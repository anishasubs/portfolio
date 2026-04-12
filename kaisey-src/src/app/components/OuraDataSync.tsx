import { useState } from "react";
import { RefreshCw, Unlink, Heart, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { OuraMetrics } from "@/utils/ouraClient";

interface OuraDataSyncProps {
  metrics: Omit<OuraMetrics, "auth"> | null;
  isConnected: boolean;
  onRefresh?: () => Promise<void>;
  onDisconnect?: () => void;
}

export function OuraDataSync({ metrics, isConnected, onRefresh, onDisconnect }: OuraDataSyncProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = () => {
    if (showConfirmDisconnect) {
      onDisconnect?.();
      setShowConfirmDisconnect(false);
    } else {
      setShowConfirmDisconnect(true);
    }
  };

  const lastSync = metrics?.lastFetch
    ? new Date(metrics.lastFetch).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : null;

  const minutesAgo = metrics?.lastFetch
    ? Math.round((Date.now() - metrics.lastFetch) / 60000)
    : null;

  return (
    <div className="p-4 rounded-lg border bg-muted/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          <h4 className="font-semibold text-sm">Oura Ring</h4>
        </div>
        {isConnected ? (
          <span className="flex items-center gap-1 text-xs text-green-500 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <XCircle className="w-3 h-3" /> Not Connected
          </span>
        )}
      </div>

      {isConnected && metrics && (
        <>
          <div className="text-xs text-muted-foreground mb-2 space-y-1">
            {lastSync && (
              <p>Last synced: {lastSync} ({minutesAgo !== null && minutesAgo < 60 ? `${minutesAgo}m ago` : "over 1h ago"})</p>
            )}
            <p>
              Data: {metrics.sleep.length} days sleep, {metrics.activity.length} days activity, {metrics.readiness.length} days readiness
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs h-7"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Syncing..." : "Refresh Now"}
            </Button>

            {showConfirmDisconnect ? (
              <div className="flex gap-1">
                <Button size="sm" variant="destructive" onClick={handleDisconnect} className="text-xs h-7">
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowConfirmDisconnect(false)} className="text-xs h-7">
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDisconnect}
                className="text-xs h-7 text-red-500 hover:text-red-600"
              >
                <Unlink className="w-3 h-3 mr-1" />
                Disconnect
              </Button>
            )}
          </div>
        </>
      )}

      {!isConnected && (
        <p className="text-xs text-muted-foreground">
          Connect your Oura Ring on the login page to see health metrics.
        </p>
      )}
    </div>
  );
}
