import { Calendar, CheckCircle2, Heart, Loader2 } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import type { OuraMetrics } from "@/utils/ouraClient";

interface ProfileSectionProps {
  userProfile?: {
    name: string;
    email: string;
    picture?: string;
  } | null;
  ouraMetrics?: Omit<OuraMetrics, "auth"> | null;
  ouraLoading?: boolean;
  onOuraConnect?: () => void;
}

export function ProfileSection({ userProfile: googleProfile, ouraMetrics, ouraLoading, onOuraConnect }: ProfileSectionProps) {
  // Use Google profile if available, otherwise fall back to demo data
  const name = googleProfile?.name || "Demo User";
  const email = googleProfile?.email || "demo@example.com";
  const picture = googleProfile?.picture;

  // Generate initials from name
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const ouraConnected = !!ouraMetrics && (ouraMetrics.sleep.length > 0 || ouraMetrics.activity.length > 0);

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <Avatar className="h-16 w-16 border-2 border-blue-500">
          {picture && <AvatarImage src={picture} alt={name} />}
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className="text-xl font-bold">{name}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          <div className="flex gap-2 mt-2">
          </div>
        </div>
      </div>

      {/* Connected Services - only show what's actually integrated */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Connected Services</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Google Calendar</span>
            </div>
            <Badge className="bg-green-500 text-white text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Synced
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm">Oura Ring</span>
            </div>
            {ouraLoading ? (
              <Badge variant="outline" className="text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Syncing
              </Badge>
            ) : ouraConnected ? (
              <Badge className="bg-green-500 text-white text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Synced
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={onOuraConnect}
                className="h-6 text-xs px-2"
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
