import { Calendar, CheckCircle2 } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

interface ProfileSectionProps {
  userProfile?: {
    name: string;
    email: string;
    picture?: string;
  } | null;
}

export function ProfileSection({ userProfile: googleProfile }: ProfileSectionProps) {
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
            <Badge variant="outline" className="text-xs">MBA Class of 2026</Badge>
            <Badge variant="outline" className="text-xs">Spring Semester</Badge>
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
        </div>
      </div>
    </Card>
  );
}
