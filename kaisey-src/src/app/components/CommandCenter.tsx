import { Sparkles, Target, Calendar, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  duration: number;
  type: "class" | "meeting" | "study" | "workout" | "networking" | "recruiting";
  color: string;
}

interface CommandCenterProps {
  events: CalendarEvent[];
  userFocus?: string | null;
  userName?: string;
}

// Format time from 24h to 12h format
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function CommandCenter({ events, userFocus, userName }: CommandCenterProps) {
  // Get current time-based greeting
  const now = new Date();
  const currentHour = now.getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 17) greeting = "Good afternoon";
  if (currentHour >= 17) greeting = "Good evening";

  // Get first name for greeting
  const firstName = userName?.split(' ')[0] || "there";

  // Format today's date
  const todayFormatted = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });

  // Filter events for today and sort by time
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayEvents = events
    .filter(e => e.date === todayKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Analyze today's events
  const totalEvents = todayEvents.length;
  const eventTypes = todayEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get upcoming events (events that haven't started yet)
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const upcomingEvents = todayEvents.filter(event => event.time > currentTime);

  // The next upcoming event
  const nextEvent = upcomingEvents[0] || null;

  // Determine focus based on event types or user's stated focus
  let focus = "Balanced Schedule";

  if (userFocus) {
    focus = userFocus;
  } else if (eventTypes.recruiting && eventTypes.networking) {
    focus = "Recruiting & Networking";
  } else if (eventTypes.class && eventTypes.class >= 2) {
    focus = "Academic Focus";
  } else if (eventTypes.recruiting) {
    focus = "Professional Development";
  } else if (eventTypes.networking) {
    focus = "Networking & Connections";
  } else if (eventTypes.study) {
    focus = "Study & Preparation";
  }

  // Generate personalized message
  let message = `${greeting}, ${firstName}! `;

  if (totalEvents === 0) {
    message += "Your calendar is clear today. A great opportunity for focused work or self-care!";
  } else if (upcomingEvents.length === 0) {
    message += "You've completed all your scheduled events for today. Great job!";
  } else if (upcomingEvents.length === 1) {
    message += `You have 1 event left today.`;
  } else {
    message += `You have ${upcomingEvents.length} upcoming events today.`;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-blue-500/20">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold">Your Day at a Glance</h2>
            <Badge className="bg-blue-500 text-white shrink-0">
              <Calendar className="w-3 h-3 mr-1" />
              {todayFormatted}
            </Badge>
          </div>

          <p className="text-sm mb-4 leading-relaxed">
            {message}
          </p>

          {/* Next Upcoming Event - show only one */}
          {nextEvent && (
            <div className="mb-4 p-3 rounded-lg bg-background/60 border">
              <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Up Next
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${nextEvent.color}`}></div>
                <span className="font-mono text-xs text-muted-foreground w-16">
                  {formatTime(nextEvent.time)}
                </span>
                <span className="font-semibold text-sm">{nextEvent.title}</span>
                <span className="text-xs text-muted-foreground">
                  ({nextEvent.duration} min)
                </span>
                {upcomingEvents.length > 1 && (
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-0.5">
                    +{upcomingEvents.length - 1} more
                    <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Today's Focus</div>
              <div className="text-sm font-semibold">{focus}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
