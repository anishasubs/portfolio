import { Sparkles, Target, Calendar, Clock, ChevronRight, AlertTriangle } from "lucide-react";
import { KaiseyMark } from "@/app/components/KaiseyLogo";
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
  type: "academics" | "recruiting" | "social" | "wellness";
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
    <Card className="p-6 gap-0 border" data-tour-id="command-center">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h2 className="text-[26px] font-semibold" style={{ letterSpacing: "-0.035em" }}>Your day at a glance</h2>
            <span className="font-mono text-xs uppercase bg-primary text-primary-foreground rounded-md px-2 py-1 shrink-0">
              {todayFormatted}
            </span>
          </div>

          <p className="text-sm mb-5 leading-relaxed text-muted-foreground">
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
                className="mb-5 px-4 py-3.5 rounded-xl border"
              >
                {nextPriorityEvent && nextPriorityEvent.id !== nextEvent?.id ? (
                  <>
                    <div className="flex items-center gap-3.5 flex-wrap">
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Next {priority}</span>
                      <span className="font-mono text-sm">
                        {formatTime(nextPriorityEvent.time)}
                      </span>
                      <span className={`w-1 h-5 rounded-full ${nextPriorityEvent.color}`} />
                      <span className="font-semibold text-sm">{nextPriorityEvent.title}</span>
                      <span className="text-xs text-muted-foreground">
                        ({nextPriorityEvent.duration} min)
                      </span>
                    </div>
                  </>
                ) : nextEvent ? (
                  <>
                    <div className="flex items-center gap-3.5 flex-wrap">
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Up next</span>
                      <span className="font-mono text-sm">
                        {formatTime(nextEvent.time)}
                      </span>
                      <span className={`w-1 h-5 rounded-full ${nextEvent.color}`} />
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
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-semibold">Weekly balance</span>
                <span className="font-mono text-xs text-muted-foreground">{totalWeekHours.toFixed(1)}h scheduled</span>
              </div>
              <div className="h-3 flex gap-1">
                {PRIORITY_MODES.map(mode => {
                  const hours = weeklyBalance[mode];
                  if (hours === 0) return null;
                  const pct = (hours / totalWeekHours) * 100;
                  return (
                    <div
                      key={mode}
                      className={`${BALANCE_COLORS[mode]} rounded transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                      title={`${mode}: ${hours.toFixed(1)}h (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>
              <div className="flex gap-4 mt-2 flex-wrap">
                {PRIORITY_MODES.map(mode => {
                  const hours = weeklyBalance[mode];
                  if (hours === 0) return null;
                  return (
                    <div key={mode} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-[2px] ${BALANCE_COLORS[mode]}`} />
                      <span className="font-mono text-[11px] text-muted-foreground">
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
                <div key={i} className="flex items-start gap-2 text-xs text-foreground bg-muted/60 rounded-md px-2.5 py-1.5">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{callout}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm font-semibold">Focus</div>
            <div className="flex-1">
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
