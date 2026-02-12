import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { KaiseyChatbot } from "./KaiseyChatbot";
import { BrainDumpPlanner } from "./BrainDumpPlanner";
import { MessageSquare, Brain } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
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

interface KaiseyPanelProps {
  openaiKey: string;
  calendarEvents: CalendarEvent[];
  onScheduleChange: (action: CalendarAction) => void;
  onFocusChange: (focus: string) => void;
  onSuggestionsGenerated: (
    suggestions: Array<{
      type: "conflict" | "optimization" | "alert" | "success";
      title: string;
      description: string;
    }>
  ) => void;
  onApiKeyRequest: () => void;
}

export function KaiseyPanel({
  openaiKey,
  calendarEvents,
  onScheduleChange,
  onFocusChange,
  onSuggestionsGenerated,
  onApiKeyRequest,
}: KaiseyPanelProps) {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="chat" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Chat with Kaisey
        </TabsTrigger>
        <TabsTrigger value="planner" className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Brain Dump
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat">
        <KaiseyChatbot
          onScheduleChange={onScheduleChange}
          onFocusChange={onFocusChange}
          variant="widget"
          openaiKey={openaiKey}
        />
      </TabsContent>

      <TabsContent value="planner">
        <BrainDumpPlanner
          openaiKey={openaiKey}
          calendarEvents={calendarEvents}
          onScheduleChange={onScheduleChange}
          onSuggestionsGenerated={onSuggestionsGenerated}
          onApiKeyRequest={onApiKeyRequest}
        />
      </TabsContent>
    </Tabs>
  );
}
