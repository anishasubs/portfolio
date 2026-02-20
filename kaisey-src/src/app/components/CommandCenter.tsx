import { Sparkles, Target, Calendar, Clock, ChevronRight, AlertTriangle } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { PrioritySelector } from "@/app/components/PrioritySelector";
import {
  type PriorityMode,
  PRIORITY_CONFIG,
  PRIORITY_MODES,
  computeWeeklyBalance,
  computeImbalanceCallouts,
} from "@/app/components/priority";
import { AnimatePresence, motion } from "motion/react";

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
  priority?: PriorityMode | null;
  onPriorityChange?: (priority: PriorityMode) => void;
}

// Format time from 24h to 12h format
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Get start of current week (Monday)
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekEnd(): Date {
  const monday = getWeekStart();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

const BALANCE_COLORS: Record<PriorityMode, string> = {
  Academics: "bg-blue-500",
  Recruiting: "bg-red-500",
  Social: "bg-orange-500",
  Wellness: "bg-green-500",
};

export function CommandCenter({ events, userFocus, userName, priority, onPriorityChange }: CommandCenterProps) {
  // Get current time-based greeting
  const now = new Date();
  const currentHour = now.getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 17) greeting = "Good afternoon";
  if (currentHour >= 17) greeting = "Good evening";

  const firstName = userName?.split(' ')[0] || "there";

  const todayFormatted = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayEvents = events
    .filter(e => e.date === todayKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  const totalEvents = todayEvents.length;
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const upcomingEvents = todayEvents.filter(event => event.time > currentTime);

  // Priority-aware "What's Next"
  let nextEvent = upcomingEvents[0] || null;
  let nextPriorityEvent: CalendarEvent | null = null;

  if (priority) {
    const matchingTypes = PRIORITY_CONFIG[priority].eventTypes;
    nextPriorityEvent = upcomingEvents.find(e => matchingTypes.includes(e.type)) || null;
  }

  // Weekly balance
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const weekEvents = events.filter(e => {
    const d = new Date(e.date + "T00:00:00");
    return d >= weekStart && d <= weekEnd;
  });
  const weeklyBalance = computeWeeklyBalance(weekEvents);
  const totalWeekHours = Object.values(weeklyBalance).reduce((a, b) => a + b, 0);
  const imbalanceCallouts = priority ? computeImbalanceCallouts(weeklyBalance, priority) : [];

  // Message
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
    <Card className="p-6 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-blue-500/20" data-tour-id="command-center">
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

          {/* Priority-aware "Up Next" */}
          <AnimatePresence mode="wait">
            {(nextPriorityEvent || nextEvent) && (
              <motion.div
                key={priority || "default"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="mb-4 p-3 rounded-lg bg-background/60 border"
              >
                {nextPriorityEvent && nextPriorityEvent.id !== nextEvent?.id ? (
                  <>
                    <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Next {priority} Event
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${nextPriorityEvent.color} ring-2 ${PRIORITY_CONFIG[priority!].ringColor} ring-offset-1`}></div>
                      <span className="font-mono text-xs text-muted-foreground w-16">
                        {formatTime(nextPriorityEvent.time)}
                      </span>
                      <span className="font-semibold text-sm">{nextPriorityEvent.title}</span>
                      <span className="text-xs text-muted-foreground">
                        ({nextPriorityEvent.duration} min)
                      </span>
                    </div>
                  </>
                ) : nextEvent ? (
                  <>
                    <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Up Next
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${nextEvent.color} ${
                        priority && PRIORITY_CONFIG[priority].eventTypes.includes(nextEvent.type)
                          ? `ring-2 ${PRIORITY_CONFIG[priority].ringColor} ring-offset-1`
                          : ""
                      }`}></div>
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
                  </>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Weekly Balance Bar */}
          {totalWeekHours > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-1.5">Weekly Balance ({totalWeekHours.toFixed(1)}h)</div>
              <div className="h-3 rounded-full overflow-hidden flex bg-muted/50">
                {PRIORITY_MODES.map(mode => {
                  const hours = weeklyBalance[mode];
                  if (hours === 0) return null;
                  const pct = (hours / totalWeekHours) * 100;
                  return (
                    <div
                      key={mode}
                      className={`${BALANCE_COLORS[mode]} transition-all duration-300 ${
                        priority === mode ? "opacity-100" : "opacity-60"
                      }`}
                      style={{ width: `${pct}%` }}
                      title={`${mode}: ${hours.toFixed(1)}h (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>
              <div className="flex gap-3 mt-1.5 flex-wrap">
                {PRIORITY_MODES.map(mode => {
                  const hours = weeklyBalance[mode];
                  if (hours === 0) return null;
                  return (
                    <div key={mode} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${BALANCE_COLORS[mode]}`} />
                      <span className="text-[10px] text-muted-foreground">
                        {mode} {hours.toFixed(1)}h
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Imbalance Callouts */}
          {imbalanceCallouts.length > 0 && (
            <div className="mb-4 space-y-1.5">
              {imbalanceCallouts.map((callout, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-md px-2.5 py-1.5">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{callout}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1.5">Today's Focus</div>
              {onPriorityChange ? (
                <PrioritySelector
                  mode="inline"
                  currentPriority={priority ?? null}
                  onSelect={onPriorityChange}
                />
              ) : (
                <div className="text-sm font-semibold">{userFocus || "Balanced Schedule"}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
