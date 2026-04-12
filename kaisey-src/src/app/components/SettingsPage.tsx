import { useState } from "react";
import { X, LogIn, LogOut, Save, Brain } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { OuraDataSync } from "@/app/components/OuraDataSync";
import type { OuraMetrics } from "@/utils/ouraClient";
import { loadOuraAuth } from "@/utils/ouraStorage";

interface SettingsPageProps {
  credentials: {
    googleCredentials: string;
  };
  onSave: (credentials: { googleCredentials: string }) => void;
  onClose: () => void;
  onLogout: () => void;
  ouraMetrics?: Omit<OuraMetrics, "auth"> | null;
  onOuraRefresh?: () => Promise<void>;
  onOuraDisconnect?: () => void;
}

export function SettingsPage({ credentials, onSave, onClose, onLogout, ouraMetrics, onOuraRefresh, onOuraDisconnect }: SettingsPageProps) {
  const [googleCredentials, setGoogleCredentials] = useState(credentials.googleCredentials);

  const handleSave = () => {
    onSave({ googleCredentials });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Kaisey Settings</h1>
              <p className="text-xs text-muted-foreground">Manage your integrations</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Calendar & Health Integrations</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Connect your calendar and health platforms for comprehensive schedule optimization.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-google-creds" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Google Calendar Credentials
                </Label>
                <Input
                  id="settings-google-creds"
                  type="password"
                  placeholder="Paste your Google OAuth credentials JSON"
                  value={googleCredentials}
                  onChange={(e) => setGoogleCredentials(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enables read/write access to your Google Calendar for dynamic rescheduling
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Health Platform Integrations</h4>
                <OuraDataSync
                  metrics={ouraMetrics || null}
                  isConnected={!!loadOuraAuth()}
                  onRefresh={onOuraRefresh}
                  onDisconnect={onOuraDisconnect}
                />
                <div className="p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 rounded bg-background">
                      <span className="text-muted-foreground">Apple Health</span>
                      <span className="text-xs text-yellow-500 font-semibold">Available</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-background">
                      <span className="text-muted-foreground">Strava</span>
                      <span className="text-xs text-yellow-500 font-semibold">Available</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-background">
                      <span className="text-muted-foreground">Whoop</span>
                      <span className="text-xs text-yellow-500 font-semibold">Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-between">
          <Button variant="destructive" onClick={onLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
