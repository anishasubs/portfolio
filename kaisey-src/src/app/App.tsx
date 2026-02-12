import { useState, useEffect } from "react";
import { Bot, Bell, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Toaster } from "@/app/components/ui/sonner";
import { CommandCenter } from "@/app/components/CommandCenter";
import { AgentSuggestion } from "@/app/components/AgentSuggestion";
import { CalendarView } from "@/app/components/CalendarView";
import { HealthMetrics } from "@/app/components/HealthMetrics";
import { AssignmentGrid } from "@/app/components/AssignmentGrid";
import { BrainDumpPlanner } from "@/app/components/BrainDumpPlanner";
import { KaiseyChatbot } from "@/app/components/KaiseyChatbot";
import { WelcomePage } from "@/app/components/WelcomePage";
import { SettingsPage } from "@/app/components/SettingsPage";
import { ProfileSection } from "@/app/components/ProfileSection";
import { toast } from "sonner";
import { validateEnv } from "@/config/env";

// Helper function to fetch Google user profile
async function fetchGoogleUserProfile(accessToken: string): Promise<{ name: string; email: string; picture?: string } | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch user profile:", response.status);
      return null;
    }

    const data = await response.json();
    return {
      name: data.name || data.given_name || "User",
      email: data.email || "",
      picture: data.picture,
    };
  } catch (error) {
    console.error("Error fetching Google user profile:", error);
    return null;
  }
}

// Helper function to add event to Google Calendar (supports recurring events)
interface RecurrenceOptions {
  frequency: "daily" | "weekly" | "monthly";
  interval?: number;
  daysOfWeek?: string[]; // e.g., ["MO", "TU", "WE"]
  until?: string; // YYYY-MM-DD
  count?: number; // number of occurrences
}

async function addGoogleCalendarEvent(
  accessToken: string,
  event: { title: string; time: string; date: string; duration: number },
  recurrence?: RecurrenceOptions
): Promise<string | null> {
  try {
    const startDateTime = new Date(`${event.date}T${event.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + event.duration * 60000);

    const eventBody: any = {
      summary: event.title,
      start: { dateTime: startDateTime.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: endDateTime.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    };

    // Add recurrence rule if specified
    if (recurrence) {
      let rrule = `RRULE:FREQ=${recurrence.frequency.toUpperCase()}`;

      if (recurrence.interval && recurrence.interval > 1) {
        rrule += `;INTERVAL=${recurrence.interval}`;
      }

      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        rrule += `;BYDAY=${recurrence.daysOfWeek.join(',')}`;
      }

      if (recurrence.count) {
        rrule += `;COUNT=${recurrence.count}`;
      } else if (recurrence.until) {
        // Format: YYYYMMDD
        rrule += `;UNTIL=${recurrence.until.replace(/-/g, '')}`;
      }

      eventBody.recurrence = [rrule];
    }

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      console.error("Failed to add event to Google Calendar:", response.status);
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error adding event to Google Calendar:", error);
    return null;
  }
}

// Helper function to delete event from Google Calendar
async function deleteGoogleCalendarEvent(accessToken: string, eventId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok || response.status === 204;
  } catch (error) {
    console.error("Error deleting event from Google Calendar:", error);
    return false;
  }
}

// Helper function to fetch Google Calendar events
async function fetchGoogleCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  try {
    // Get a month's worth of events (2 weeks before and 2 weeks after today)
    const now = new Date();
    const startOfRange = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
    const endOfRange = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);

    const timeMin = startOfRange.toISOString();
    const timeMax = endOfRange.toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Google Calendar events to our format
    const events: CalendarEvent[] = (data.items || []).map((item: any, index: number) => {
      const startTime = item.start?.dateTime || item.start?.date;
      const endTime = item.end?.dateTime || item.end?.date;

      // Parse time and date (using local timezone, not UTC)
      let time = "00:00";
      const nowLocal = new Date();
      let date = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
      let duration = 60;

      if (startTime) {
        const startDate = new Date(startTime);
        time = startDate.toTimeString().slice(0, 5); // HH:MM local time
        date = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`; // YYYY-MM-DD local date

        if (endTime) {
          const endDate = new Date(endTime);
          duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000); // minutes
        }
      }

      // Determine event type based on title
      const title = item.summary || "Untitled Event";
      const lowerTitle = title.toLowerCase();
      let type: CalendarEvent["type"] = "meeting";
      let color = "bg-blue-500";

      if (lowerTitle.includes("gym") || lowerTitle.includes("yoga") || lowerTitle.includes("workout") || lowerTitle.includes("exercise")) {
        type = "workout";
        color = "bg-green-500";
      } else if (lowerTitle.includes("class") || lowerTitle.includes("lecture") || lowerTitle.includes("course")) {
        type = "class";
        color = "bg-blue-500";
      } else if (lowerTitle.includes("study") || lowerTitle.includes("prep") || lowerTitle.includes("homework")) {
        type = "study";
        color = "bg-indigo-500";
      } else if (lowerTitle.includes("coffee") || lowerTitle.includes("lunch") || lowerTitle.includes("network") || lowerTitle.includes("chat")) {
        type = "networking";
        color = "bg-orange-500";
      } else if (lowerTitle.includes("recruit") || lowerTitle.includes("interview") || lowerTitle.includes("info session")) {
        type = "recruiting";
        color = "bg-red-500";
      }

      return {
        id: item.id || String(index + 1),
        title,
        time,
        date,
        duration,
        type,
        color,
      };
    });

    return events.sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    throw error;
  }
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string; // YYYY-MM-DD format
  duration: number;
  type: "class" | "meeting" | "study" | "workout" | "networking" | "recruiting";
  color: string;
}

interface CalendarAction {
  type: "add" | "remove" | "replace";
  event: {
    title: string;
    time: string;
    duration: number;
  };
  replaceWith?: {
    title: string;
    time: string;
    duration: number;
  };
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly";
    interval?: number;
    daysOfWeek?: string[];
    until?: string;
    count?: number;
  };
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userFocus, setUserFocus] = useState<string | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; picture?: string } | null>(null);
  const [credentials, setCredentials] = useState({
    openaiKey: "",
    googleCredentials: "",
  });
  const [suggestions, setSuggestions] = useState<Array<{id: string; type: "conflict" | "optimization" | "alert" | "success"; title: string; description: string; actions?: CalendarAction[]}>>([]);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const demoEvents: CalendarEvent[] = [
    { id: "1", title: "Corporate Finance", time: "08:00", date: today, duration: 90, type: "class", color: "bg-blue-500" },
    { id: "2", title: "Coffee Chat: Sarah (McKinsey)", time: "10:15", date: today, duration: 45, type: "networking", color: "bg-orange-500" },
    { id: "3", title: "Strategy Canvas Quiz", time: "11:00", date: today, duration: 60, type: "class", color: "bg-blue-500" },
    { id: "4", title: "Goldman Sachs Info Session", time: "12:00", date: today, duration: 60, type: "recruiting", color: "bg-red-500" },
    { id: "5", title: "Gym Session", time: "13:00", date: today, duration: 45, type: "workout", color: "bg-green-500" },
  ];
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Generate schedule-based suggestions when API key is present
  useEffect(() => {
    if (!credentials.openaiKey || !credentials.openaiKey.startsWith('sk-')) {
      // Clear AI-generated suggestions when no API key
      setSuggestions(prev => prev.filter(s => s.id.startsWith('bd-')));
      return;
    }

    const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const todayEvents = calendarEvents
      .filter(e => e.date === todayKey)
      .sort((a, b) => a.time.localeCompare(b.time));

    const newSuggestions: Array<{id: string; type: "conflict" | "optimization" | "alert" | "success"; title: string; description: string; actions?: CalendarAction[]}> = [];

    // Check for back-to-back events with no buffer
    for (let i = 0; i < todayEvents.length - 1; i++) {
      const current = todayEvents[i];
      const next = todayEvents[i + 1];
      const [ch, cm] = current.time.split(':').map(Number);
      const currentEndMin = ch * 60 + cm + current.duration;
      const [nh, nm] = next.time.split(':').map(Number);
      const nextStartMin = nh * 60 + nm;
      const gap = nextStartMin - currentEndMin;

      if (gap < 0) {
        // Overlap — shift the later event to start after the earlier one ends + 15 min buffer
        const newStartMin = currentEndMin + 15;
        const newTime = formatTimeHelper(newStartMin);
        newSuggestions.push({
          id: `sched-overlap-${i}`,
          type: "conflict",
          title: "Schedule Conflict Detected",
          description: `"${current.title}" (ends at ${formatTimeHelper(currentEndMin)}) overlaps with "${next.title}" (starts at ${next.time}). Accept to move "${next.title}" to ${newTime}.`,
          actions: [{
            type: "replace",
            event: { title: next.title, time: next.time, duration: next.duration },
            replaceWith: { title: next.title, time: newTime, duration: next.duration },
          }],
        });
      } else if (gap === 0) {
        // No buffer — push the later event by 15 minutes
        const newStartMin = nextStartMin + 15;
        const newTime = formatTimeHelper(newStartMin);
        newSuggestions.push({
          id: `sched-buffer-${i}`,
          type: "alert",
          title: "No Buffer Between Events",
          description: `"${current.title}" ends right when "${next.title}" starts at ${next.time}. Accept to add a 15-min buffer (move "${next.title}" to ${newTime}).`,
          actions: [{
            type: "replace",
            event: { title: next.title, time: next.time, duration: next.duration },
            replaceWith: { title: next.title, time: newTime, duration: next.duration },
          }],
        });
      }
    }

    // Check for long blocks without breaks — split into two halves with a 10-min break
    const longEvents = todayEvents.filter(e => e.duration >= 120);
    longEvents.forEach(event => {
      const [eh, em] = event.time.split(':').map(Number);
      const firstHalf = Math.floor(event.duration / 2);
      const secondHalf = event.duration - firstHalf;
      const breakDuration = 10;
      const secondStartMin = eh * 60 + em + firstHalf + breakDuration;
      const secondTime = formatTimeHelper(secondStartMin);

      newSuggestions.push({
        id: `sched-long-${event.id}`,
        type: "optimization",
        title: "Long Block: Consider a Break",
        description: `"${event.title}" is ${event.duration} min. Accept to split into ${firstHalf} min + ${breakDuration} min break + ${secondHalf} min (second half at ${secondTime}).`,
        actions: [
          {
            type: "replace",
            event: { title: event.title, time: event.time, duration: event.duration },
            replaceWith: { title: event.title, time: event.time, duration: firstHalf },
          },
          {
            type: "add",
            event: { title: `${event.title} (Part 2)`, time: secondTime, duration: secondHalf },
          },
        ],
      });
    });

    // Check for empty evening if busy morning
    const currentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    const upcomingEvents = todayEvents.filter(e => e.time > currentTime);
    if (upcomingEvents.length === 0 && todayEvents.length > 0) {
      newSuggestions.push({
        id: `sched-done`,
        type: "success",
        title: "All Events Complete",
        description: "You've finished all your scheduled events for today. Great work! Consider using the Brain Dump Planner if you have more tasks to tackle.",
      });
    }

    // Only update if we have new schedule suggestions (preserve brain-dump ones)
    setSuggestions(prev => {
      const brainDumpSuggestions = prev.filter(s => s.id.startsWith('bd-'));
      return [...newSuggestions, ...brainDumpSuggestions];
    });
  }, [credentials.openaiKey, calendarEvents]);

  function formatTimeHelper(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const handleLogin = async (openaiKey: string, googleCreds: string) => {
    setCredentials({ openaiKey, googleCredentials: googleCreds });
    setIsLoggedIn(true);

    // Try to fetch real calendar events and user profile if we have Google credentials
    if (googleCreds) {
      try {
        const parsed = JSON.parse(googleCreds);
        if (parsed.access_token && !parsed.isDemo) {
          setIsLoadingCalendar(true);
          toast.info("Loading your data...");

          // Fetch user profile and calendar events in parallel
          const [profile, events] = await Promise.all([
            fetchGoogleUserProfile(parsed.access_token),
            fetchGoogleCalendarEvents(parsed.access_token)
          ]);

          // Set user profile
          if (profile) {
            setUserProfile(profile);
          }

          // Always use real Google Calendar data — even if empty
          setCalendarEvents(events);
          if (events.length > 0) {
            toast.success(`Welcome${profile ? `, ${profile.name.split(' ')[0]}` : ''}! Loaded ${events.length} events.`);
          } else {
            toast.info("No events found in your calendar. Use Brain Dump Planner or the chatbot to add events.");
          }
          setIsLoadingCalendar(false);
        } else {
          // Demo mode — load sample events
          setCalendarEvents(demoEvents);
          toast.success("Welcome to Kaisey!", {
            description: "Using demo mode with sample data.",
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setIsLoadingCalendar(false);
        toast.error("Could not load calendar events", {
          description: "Using demo data instead. Check console for details.",
        });
      }
    } else {
      // No Google credentials — load demo events
      setCalendarEvents(demoEvents);
      toast.success("Welcome to Kaisey!", {
        description: "Your AI MBA Co-Pilot is ready.",
      });
    }
  };

  const handleAcceptSuggestion = (id: string) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (suggestion?.actions && suggestion.actions.length > 0) {
      // Execute each calendar action in order
      for (const action of suggestion.actions) {
        handleScheduleChange(action);
      }
      toast.success("Calendar updated", {
        description: suggestion.title,
      });
    } else {
      toast.success("Recommendation noted", {
        description: "Thanks for the feedback!",
      });
    }
    setSuggestions(prev => prev.filter((s) => s.id !== id));
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions(suggestions.filter((s) => s.id !== id));
  };

  const handleBrainDumpSuggestions = (newSuggestions: Array<{type: "conflict" | "optimization" | "alert" | "success"; title: string; description: string; actions?: CalendarAction[]}>) => {
    const mapped = newSuggestions.map((s, i) => ({ ...s, id: `bd-${Date.now()}-${i}` }));
    setSuggestions(prev => [...prev, ...mapped]);
  };

  const handleScheduleChange = async (calendarAction: CalendarAction) => {
    console.log("handleScheduleChange called with:", calendarAction);

    // Get Google access token for syncing
    let accessToken: string | null = null;
    try {
      const parsed = JSON.parse(credentials.googleCredentials);
      if (parsed.access_token && !parsed.isDemo) {
        accessToken = parsed.access_token;
      }
    } catch (e) {
      // No valid credentials
    }

    // Determine event type and color based on title
    const getEventTypeAndColor = (title: string): { type: CalendarEvent["type"], color: string } => {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("gym") || lowerTitle.includes("yoga") || lowerTitle.includes("meditation") || lowerTitle.includes("workout")) {
        return { type: "workout", color: "bg-green-500" };
      } else if (lowerTitle.includes("coffee") || lowerTitle.includes("lunch") || lowerTitle.includes("follow-up") || lowerTitle.includes("networking")) {
        return { type: "networking", color: "bg-orange-500" };
      } else if (lowerTitle.includes("prep") || lowerTitle.includes("study") || lowerTitle.includes("focus") || lowerTitle.includes("deep work") || lowerTitle.includes("buffer")) {
        return { type: "study", color: "bg-indigo-500" };
      } else if (lowerTitle.includes("goldman") || lowerTitle.includes("info session") || lowerTitle.includes("recruiting")) {
        return { type: "recruiting", color: "bg-red-500" };
      } else {
        return { type: "class", color: "bg-blue-500" };
      }
    };

    if (calendarAction.type === "add") {
      const tempId = `local-${Date.now()}`;
      const { type, color } = getEventTypeAndColor(calendarAction.event.title);
      const newEvent: CalendarEvent = {
        id: tempId,
        title: calendarAction.event.title,
        time: calendarAction.event.time,
        date: today,
        duration: calendarAction.event.duration,
        type,
        color,
      };

      // Local update
      setCalendarEvents(prev => [...prev, newEvent].sort((a, b) => a.time.localeCompare(b.time)));

      // Google Calendar sync — update local ID with real Google ID on success
      if (accessToken) {
        const googleId = await addGoogleCalendarEvent(accessToken, newEvent, calendarAction.recurrence);
        if (googleId) {
          setCalendarEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: googleId } : e));
          toast.success(calendarAction.recurrence ? "Recurring event synced to Google Calendar" : "Event synced to Google Calendar");
        }
      }

    } else if (calendarAction.type === "remove") {
      // Find the event first to get its Google Calendar ID
      const eventToRemove = calendarEvents.find(e =>
        e.title === calendarAction.event.title && e.time === calendarAction.event.time
      );

      // Local update
      setCalendarEvents(prev =>
        prev.filter(e => !(e.title === calendarAction.event.title && e.time === calendarAction.event.time))
      );

      // Google Calendar sync
      if (accessToken && eventToRemove?.id) {
        const success = await deleteGoogleCalendarEvent(accessToken, eventToRemove.id);
        if (success) {
          toast.success("Event removed from Google Calendar");
        }
      }

    } else if (calendarAction.type === "replace" && calendarAction.replaceWith) {
      // Find old event to get its Google Calendar ID
      const oldEvent = calendarEvents.find(e =>
        e.title === calendarAction.event.title && e.time === calendarAction.event.time
      );
      const tempId = `local-${Date.now()}`;
      const { type, color } = getEventTypeAndColor(calendarAction.replaceWith.title);

      // Local update
      setCalendarEvents(prev => {
        const updated = prev.map(e => {
          if (e.title === calendarAction.event.title && e.time === calendarAction.event.time) {
            return { ...e, id: tempId, title: calendarAction.replaceWith!.title, time: calendarAction.replaceWith!.time, duration: calendarAction.replaceWith!.duration, type, color };
          }
          return e;
        });
        return updated.sort((a, b) => a.time.localeCompare(b.time));
      });

      // Google Calendar sync — delete old, add new, save new ID
      if (accessToken && oldEvent?.id) {
        await deleteGoogleCalendarEvent(accessToken, oldEvent.id);
        const newGoogleEvent = {
          title: calendarAction.replaceWith.title,
          time: calendarAction.replaceWith.time,
          date: oldEvent.date || today,
          duration: calendarAction.replaceWith.duration,
        };
        const googleId = await addGoogleCalendarEvent(accessToken, newGoogleEvent);
        if (googleId) {
          setCalendarEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: googleId } : e));
          toast.success("Event updated in Google Calendar");
        }
      }
    }

    toast.success("Calendar updated", {
      description: `${calendarAction.type.toUpperCase()}: ${calendarAction.event.title}`,
    });
  };

  const handleAssignmentSchedule = (assignment: any, time: string, duration: number) => {
    // Create a calendar event for the assignment
    const newEvent: CalendarEvent = {
      id: (Math.max(0, ...calendarEvents.map(e => parseInt(e.id) || 0)) + 1).toString(),
      title: `Study: ${assignment.title}`,
      time: time,
      date: today,
      duration: duration,
      type: "study",
      color: "bg-indigo-500"
    };

    setCalendarEvents(prevEvents => {
      const updated = [...prevEvents, newEvent];
      return updated.sort((a, b) => a.time.localeCompare(b.time));
    });

    toast.success("Study time added to calendar", {
      description: `${duration} min for ${assignment.title} at ${time}`,
    });
  };

  // Show welcome page if not logged in
  if (!isLoggedIn) {
    return <WelcomePage onLogin={handleLogin} />;
  }

  // Show settings page
  if (showSettings) {
    return (
      <SettingsPage
        credentials={credentials}
        onSave={(newCreds) => {
          setCredentials(newCreds);
          setShowSettings(false);
          toast.success("Settings saved successfully");
        }}
        onClose={() => setShowSettings(false)}
        onLogout={() => {
          setIsLoggedIn(false);
          setShowSettings(false);
          setCredentials({ openaiKey: "", googleCredentials: "" });
          setCalendarEvents([]);
          setSuggestions([]);
          setUserProfile(null);
          setUserFocus(null);
          localStorage.removeItem("google_calendar_token");
          toast.success("Logged out successfully");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/portfolio/" className="text-muted-foreground hover:text-foreground transition-colors" title="Back to Portfolio">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Kaisey</h1>
              <p className="text-xs text-muted-foreground">MBA Co-Pilot</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="relative">
              <Bell className="w-4 h-4" />
              {suggestions.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                  {suggestions.length}
                </Badge>
              )}
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Quick Insight of the Day */}
        <div className="mb-6">
          <CommandCenter events={calendarEvents} userFocus={userFocus} userName={userProfile?.name} />
        </div>

        {/* Brain Dump Planner */}
        <div className="mb-6">
          <BrainDumpPlanner
            openaiKey={credentials.openaiKey}
            calendarEvents={calendarEvents}
            onScheduleChange={handleScheduleChange}
            onSuggestionsGenerated={handleBrainDumpSuggestions}
            onApiKeyRequest={() => setShowSettings(true)}
          />
        </div>

        {/* My Recommendations - only shown when API key is present */}
        {credentials.openaiKey && credentials.openaiKey.startsWith('sk-') && suggestions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold">My Recommendations</h3>
              <Badge variant="outline" className="text-xs">{suggestions.length}</Badge>
            </div>
            {suggestions.map((suggestion) => (
              <AgentSuggestion
                key={suggestion.id}
                type={suggestion.type}
                title={suggestion.title}
                description={suggestion.description}
                action={{
                  label: "Accept & Update Calendar",
                  onClick: () => handleAcceptSuggestion(suggestion.id),
                }}
                dismiss={() => handleDismissSuggestion(suggestion.id)}
              />
            ))}
          </div>
        )}

        {/* Main View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-2 space-y-6">
            <CalendarView events={calendarEvents} onScheduleChange={handleScheduleChange} />
          </div>

          {/* Right Column - Profile */}
          <div className="space-y-6">
            <ProfileSection userProfile={userProfile} />
          </div>
        </div>
      </main>

      {/* Floating Chatbot */}
      <KaiseyChatbot
        onScheduleChange={handleScheduleChange}
        onFocusChange={setUserFocus}
        variant="floating"
        openaiKey={credentials.openaiKey}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}