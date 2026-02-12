import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Pencil, Trash2, Check, X } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";

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
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onScheduleChange?: (action: CalendarAction) => void;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper to get the start of the week (Monday)
function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);

  const dates: Date[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// Helper to format date as YYYY-MM-DD (using local time, not UTC)
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CalendarView({ events, onScheduleChange }: CalendarViewProps) {
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState("");

  const todayKey = formatDateKey(new Date());
  const currentDateKey = formatDateKey(currentDate);

  // Filter events for the selected day
  const dayEvents = events.filter(e => e.date === currentDateKey);

  // Get events grouped by day for the week view
  const weekDates = getWeekDates(currentDate);
  const weekEventsMap: { [key: string]: CalendarEvent[] } = {};

  weekDates.forEach((date, index) => {
    const dateKey = formatDateKey(date);
    weekEventsMap[dayNames[index]] = events.filter(e => e.date === dateKey);
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const handleDelete = (event: CalendarEvent) => {
    if (!onScheduleChange) return;
    onScheduleChange({
      type: "remove",
      event: {
        title: event.title,
        time: event.time,
        duration: event.duration,
      },
    });
    toast.success("Event removed", { description: `"${event.title}" has been removed from your calendar.` });
  };

  const handleEditStart = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setEditTitle(event.title);
    setEditTime(event.time);
    setEditDuration(String(event.duration));
  };

  const handleEditCancel = () => {
    setEditingEventId(null);
    setEditTitle("");
    setEditTime("");
    setEditDuration("");
  };

  const handleEditSave = (event: CalendarEvent) => {
    if (!onScheduleChange) return;
    const newDuration = parseInt(editDuration);

    onScheduleChange({
      type: "replace",
      event: {
        title: event.title,
        time: event.time,
        duration: event.duration,
      },
      replaceWith: {
        title: editTitle,
        time: editTime,
        duration: isNaN(newDuration) ? event.duration : newDuration,
      },
    });

    setEditingEventId(null);
    toast.success("Event updated", { description: `"${editTitle}" has been updated.` });
  };

  const renderEventRow = (event: CalendarEvent) => {
    const isEditing = editingEventId === event.id;

    if (isEditing) {
      return (
        <div key={event.id} className="flex flex-col gap-2 p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
          <div className="flex gap-2 items-center">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 h-8 text-sm"
              placeholder="Event title"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              className="w-28 h-8 text-sm"
            />
            <Input
              type="number"
              value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
              className="w-20 h-8 text-sm"
              placeholder="min"
            />
            <span className="text-xs text-muted-foreground">min</span>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={handleEditCancel} className="h-7 w-7 p-0">
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => handleEditSave(event)} className="h-7 gap-1 bg-blue-600 hover:bg-blue-700">
              <Check className="w-3.5 h-3.5" />
              Save
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div key={event.id} className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
        <div className="text-sm text-muted-foreground font-mono w-16">{event.time}</div>
        <div className={`w-1 rounded-full ${event.color}`}></div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{event.title}</h4>
          <p className="text-xs text-muted-foreground">{event.duration} min &middot; {event.type}</p>
        </div>
        {onScheduleChange && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleEditStart(event)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
              title="Edit event"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(event)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Delete event"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold">Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000 * (view === "month" ? 30 : view === "week" ? 7 : 1)))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {view === "day"
              ? currentDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })
              : view === "week"
                ? `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDates[5].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : formatMonth(currentDate)}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000 * (view === "month" ? 30 : view === "week" ? 7 : 1)))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week" | "month")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>

        {/* Day View */}
        <TabsContent value="day" className="space-y-2">
          <div className="max-h-[500px] overflow-y-auto space-y-1">
            {dayEvents.length > 0 ? (
              dayEvents.map((event) => renderEventRow(event))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">No events for this day</div>
            )}
          </div>
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 gap-2 min-w-[800px]">
              {weekDates.map((date, index) => {
                const dayName = dayNames[index];
                const dateKey = formatDateKey(date);
                const isToday = dateKey === todayKey;
                const dayEvts = weekEventsMap[dayName] || [];

                return (
                  <div key={dayName} className="border rounded-lg p-2">
                    <div className="font-semibold text-sm mb-2 pb-2 border-b">
                      {dayName} {date.getDate()}
                      {isToday && <Badge variant="outline" className="ml-1 text-xs">Today</Badge>}
                    </div>
                    <div className="space-y-2">
                      {dayEvts.map((event) => (
                        <div key={event.id} className={`p-2 rounded text-xs ${event.color} text-white relative group`}>
                          <div className="font-semibold truncate">{event.title}</div>
                          <div className="opacity-90">{event.time}</div>
                          {onScheduleChange && (
                            <button
                              onClick={() => handleDelete(event)}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="Delete event"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {dayEvts.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-2">No events</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Month View */}
        <TabsContent value="month">
          <div className="border rounded-lg">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {daysOfWeek.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {getDaysInMonth(currentDate).map((day, index) => {
                let dayEvts: CalendarEvent[] = [];
                let isToday = false;
                if (day) {
                  const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dateKey = formatDateKey(monthDate);
                  dayEvts = events.filter(e => e.date === dateKey);
                  isToday = dateKey === todayKey;
                }

                return (
                  <div
                    key={index}
                    className={`min-h-[80px] p-2 border-r border-b last:border-r-0 ${
                      day ? "hover:bg-muted/50 cursor-pointer" : "bg-muted/20"
                    } ${isToday ? "bg-blue-500/10 border-blue-500" : ""}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-semibold mb-1 ${isToday ? "text-blue-500" : ""}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvts.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={`w-full h-1.5 rounded-full ${event.color}`}
                              title={`${event.time} - ${event.title}`}
                            />
                          ))}
                          {dayEvts.length > 3 && (
                            <div className="text-xs text-muted-foreground">+{dayEvts.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
