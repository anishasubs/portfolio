import { useState, useEffect } from "react";
import { Brain, Send, Check, Loader2, ListTodo, Clock, CalendarPlus, Sparkles, RefreshCw, ChevronRight, AlertCircle, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Progress } from "@/app/components/ui/progress";
import { Textarea } from "@/app/components/ui/textarea";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// --- Type Definitions ---

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

interface ExtractedTask {
  id: string;
  title: string;
  estimatedDuration: number | null;
  dueDate: string | null;
  preferredTime: string | null; // HH:MM 24h format, if user specified a time
  priority: "high" | "medium" | "low";
  category: "class" | "meeting" | "study" | "workout" | "networking" | "recruiting";
}

interface ClarificationQuestion {
  taskId: string;
  taskTitle: string;
  question: string;
  field: "estimatedDuration" | "dueDate";
  answered: boolean;
  answer?: string;
}

interface ProposedScheduleBlock {
  taskId: string;
  title: string;
  time: string;
  date: string;
  duration: number;
  category: string;
  isExisting: boolean;
}

interface PlannerSuggestion {
  type: "conflict" | "optimization" | "alert" | "success";
  title: string;
  description: string;
}

type PlannerPhase =
  | "NO_KEY"
  | "IDLE"
  | "BRAIN_DUMP_INPUT"
  | "EXTRACTING"
  | "CLARIFY"
  | "PROPOSING"
  | "REVIEW_SCHEDULE"
  | "REVISING"
  | "ACCEPTED";

interface BrainDumpPlannerProps {
  openaiKey: string;
  calendarEvents: CalendarEvent[];
  onScheduleChange: (action: CalendarAction) => void;
  onSuggestionsGenerated: (suggestions: PlannerSuggestion[]) => void;
  onApiKeyRequest: () => void;
}

// --- Color mapping for task categories ---
const categoryColors: Record<string, string> = {
  class: "bg-blue-500",
  meeting: "bg-purple-500",
  study: "bg-indigo-500",
  workout: "bg-green-500",
  networking: "bg-orange-500",
  recruiting: "bg-red-500",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-green-500 text-white",
};

export function BrainDumpPlanner({
  openaiKey,
  calendarEvents,
  onScheduleChange,
  onSuggestionsGenerated,
  onApiKeyRequest,
}: BrainDumpPlannerProps) {
  // --- State ---
  const [phase, setPhase] = useState<PlannerPhase>(
    openaiKey && openaiKey.startsWith("sk-") ? "IDLE" : "NO_KEY"
  );
  const [brainDumpText, setBrainDumpText] = useState("");
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [proposedSchedule, setProposedSchedule] = useState<ProposedScheduleBlock[]>([]);
  const [recommendations, setRecommendations] = useState<PlannerSuggestion[]>([]);
  const [scheduleSummary, setScheduleSummary] = useState("");
  const [revisionInput, setRevisionInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // --- Guardrail: watch API key ---
  useEffect(() => {
    if (openaiKey && openaiKey.startsWith("sk-") && phase === "NO_KEY") {
      setPhase("IDLE");
    } else if ((!openaiKey || !openaiKey.startsWith("sk-")) && phase !== "NO_KEY") {
      setPhase("NO_KEY");
    }
  }, [openaiKey, phase]);

  // --- OpenAI Helpers ---

  const callExtractTasks = async (text: string) => {
    if (!openaiKey || !openaiKey.startsWith("sk-")) {
      throw new Error("Valid OpenAI API key required");
    }

    const todayISO = new Date().toISOString().slice(0, 10);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a task extraction assistant for an MBA student planning tool called Kaisey.
The user will provide a brain dump - unstructured text about everything they need to do.

Your job is to:
1. Extract individual SCHEDULABLE tasks from the brain dump text - things the user needs to DO that take time
2. For each task, determine a category, priority, duration (if inferrable), due date (if mentioned), and preferred time (if the user specified one)
3. If the user mentions a specific time for a task (e.g., "nail appointment at 6pm", "gym at 7"), capture it as preferredTime in HH:MM 24h format (e.g., "18:00", "07:00")
4. If duration or due date cannot be determined from the text, set them to null
5. Generate clarification questions for tasks where duration is null. If a task has a preferred time but no duration, ask about duration specifically.
6. Do NOT ask about due date if the task has a preferred time - assume it's for today.

IMPORTANT: Do NOT extract calendar management commands as tasks. If the user says things like "delete events", "remove everything from my calendar", "cancel my meeting", "clear my schedule", "reschedule X", or "move my appointment" — these are NOT schedulable tasks. Ignore them and return an empty tasks array. The user should use the calendar view or chatbot for managing existing events.

Only extract things that represent NEW work to be done or NEW events to schedule.

Today's date is: ${todayISO}

Categories: class, meeting, study, workout, networking, recruiting
Priorities: high (due soon or critical), medium (important but flexible), low (nice to have)

Return ONLY by calling the extract_tasks function.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tasks",
              description: "Extract structured tasks from a brain dump",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        estimatedDuration: {
                          type: ["number", "null"],
                          description: "Duration in minutes, or null if unknown",
                        },
                        dueDate: {
                          type: ["string", "null"],
                          description: "YYYY-MM-DD or null if unknown. If the user gave a specific time (e.g. 'at 6pm'), assume today's date.",
                        },
                        preferredTime: {
                          type: ["string", "null"],
                          description: "HH:MM in 24h format if the user specified a time (e.g. 'at 6pm' -> '18:00'), or null if no time was mentioned",
                        },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        category: {
                          type: "string",
                          enum: ["class", "meeting", "study", "workout", "networking", "recruiting"],
                        },
                      },
                      required: ["title", "estimatedDuration", "dueDate", "preferredTime", "priority", "category"],
                    },
                  },
                  clarification_questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task_title: { type: "string" },
                        question: { type: "string" },
                        field: { type: "string", enum: ["estimatedDuration", "dueDate"] },
                      },
                      required: ["task_title", "question", "field"],
                    },
                  },
                },
                required: ["tasks", "clarification_questions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_tasks" } },
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No task extraction response received");
    }

    return JSON.parse(toolCall.function.arguments) as {
      tasks: Array<{
        title: string;
        estimatedDuration: number | null;
        dueDate: string | null;
        preferredTime: string | null;
        priority: "high" | "medium" | "low";
        category: "class" | "meeting" | "study" | "workout" | "networking" | "recruiting";
      }>;
      clarification_questions: Array<{
        task_title: string;
        question: string;
        field: "estimatedDuration" | "dueDate";
      }>;
    };
  };

  const callProposeSchedule = async (
    tasks: ExtractedTask[],
    existingEvents: CalendarEvent[],
    revisionRequest?: string,
    previousSchedule?: ProposedScheduleBlock[]
  ) => {
    if (!openaiKey || !openaiKey.startsWith("sk-")) {
      throw new Error("Valid OpenAI API key required");
    }

    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10);
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const todayEvents = existingEvents
      .filter((e) => e.date === todayISO)
      .map((e) => ({ title: e.title, time: e.time, duration: e.duration, type: e.type }));

    const tasksForScheduling = tasks.map((t) => ({
      title: t.title,
      duration: t.estimatedDuration,
      priority: t.priority,
      category: t.category,
      ...(t.preferredTime ? { preferredTime: t.preferredTime } : {}),
    }));

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: `You are a schedule optimization assistant for an MBA student.
Given a list of tasks to schedule and existing calendar events, propose an optimized daily schedule.

CRITICAL RULES:
1. The current time is ${currentTime}. NEVER schedule anything before ${currentTime} - all tasks must be scheduled AFTER the current time.
2. If a task has a "preferredTime" field, schedule it at EXACTLY that time (as long as it's after ${currentTime} and doesn't conflict with existing events).
3. NEVER overlap with existing calendar events
4. Respect task durations exactly. Every task MUST have a positive integer duration in minutes - never return null or 0
5. If a task has no duration specified, estimate a reasonable duration (minimum 15 minutes)
6. Add 15-minute buffer between back-to-back events
7. Schedule high priority tasks during peak productivity hours (9-11 AM, 2-4 PM) when possible
8. Do not schedule after 10:00 PM
9. Group similar category tasks when possible
10. Include short breaks between long blocks (>2 hours)

Today's date is: ${todayISO}
Current time is: ${currentTime}

Existing calendar events for today:
${JSON.stringify(todayEvents, null, 2)}

Tasks to schedule:
${JSON.stringify(tasksForScheduling, null, 2)}

Return ONLY by calling the propose_schedule function.`,
      },
    ];

    if (revisionRequest && previousSchedule) {
      messages.push({
        role: "assistant",
        content: `Previously proposed schedule: ${JSON.stringify(previousSchedule.filter((b) => !b.isExisting))}`,
      });
      messages.push({
        role: "user",
        content: `Please revise the schedule: ${revisionRequest}`,
      });
    } else {
      messages.push({
        role: "user",
        content: "Please create an optimized schedule for today fitting these tasks around my existing calendar events.",
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "propose_schedule",
              description: "Propose a schedule for the given tasks",
              parameters: {
                type: "object",
                properties: {
                  scheduled_blocks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task_title: { type: "string" },
                        time: { type: "string", description: "HH:MM 24h format" },
                        date: { type: "string", description: "YYYY-MM-DD" },
                        duration: { type: "number", description: "minutes" },
                        category: { type: "string" },
                      },
                      required: ["task_title", "time", "date", "duration", "category"],
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["conflict", "optimization", "alert", "success"] },
                        title: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["type", "title", "description"],
                    },
                  },
                  summary: { type: "string", description: "Brief explanation of the proposed schedule" },
                },
                required: ["scheduled_blocks", "recommendations", "summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "propose_schedule" } },
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No schedule proposal received");
    }

    return JSON.parse(toolCall.function.arguments) as {
      scheduled_blocks: Array<{
        task_title: string;
        time: string;
        date: string;
        duration: number;
        category: string;
      }>;
      recommendations: PlannerSuggestion[];
      summary: string;
    };
  };

  // --- Handler Functions ---

  const handleBrainDumpSubmit = async () => {
    if (!brainDumpText.trim()) return;
    setError(null);
    setPhase("EXTRACTING");

    try {
      const result = await callExtractTasks(brainDumpText);

      const todayISO = new Date().toISOString().slice(0, 10);
      const tasks: ExtractedTask[] = result.tasks.map((t, i) => ({
        id: `task-${i}`,
        title: t.title,
        estimatedDuration: t.estimatedDuration,
        dueDate: t.preferredTime ? (t.dueDate || todayISO) : t.dueDate,
        preferredTime: t.preferredTime || null,
        priority: t.priority,
        category: t.category,
      }));

      const questions: ClarificationQuestion[] = result.clarification_questions.map((q, i) => {
        const matchingTask = tasks.find((t) => t.title === q.task_title);
        return {
          taskId: matchingTask?.id || `task-${i}`,
          taskTitle: q.task_title,
          question: q.question,
          field: q.field,
          answered: false,
        };
      });

      if (tasks.length === 0) {
        setError("No schedulable tasks found. To manage existing calendar events (delete, edit, reschedule), use the calendar view below or the floating chatbot.");
        setPhase("BRAIN_DUMP_INPUT");
        return;
      }

      setExtractedTasks(tasks);
      setClarificationQuestions(questions);
      setCurrentQuestionIndex(0);

      if (questions.length === 0) {
        // All tasks have complete info, skip to scheduling
        setPhase("PROPOSING");
        await proposeScheduleFromTasks(tasks);
      } else {
        setPhase("CLARIFY");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract tasks");
      setPhase("BRAIN_DUMP_INPUT");
    }
  };

  const handleClarificationAnswer = () => {
    if (!clarificationAnswer.trim()) return;

    const currentQ = clarificationQuestions[currentQuestionIndex];
    const updatedQuestions = [...clarificationQuestions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQ,
      answered: true,
      answer: clarificationAnswer,
    };

    // Update the corresponding task
    const updatedTasks = extractedTasks.map((task) => {
      if (task.id === currentQ.taskId) {
        if (currentQ.field === "estimatedDuration") {
          const minutes = parseInt(clarificationAnswer);
          return { ...task, estimatedDuration: isNaN(minutes) ? 60 : minutes };
        } else if (currentQ.field === "dueDate") {
          return { ...task, dueDate: clarificationAnswer };
        }
      }
      return task;
    });

    setClarificationQuestions(updatedQuestions);
    setExtractedTasks(updatedTasks);
    setClarificationAnswer("");

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= clarificationQuestions.length) {
      // All questions answered, proceed to scheduling
      setCurrentQuestionIndex(nextIndex);
      setPhase("PROPOSING");
      proposeScheduleFromTasks(updatedTasks);
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const proposeScheduleFromTasks = async (tasks: ExtractedTask[]) => {
    setError(null);
    try {
      const result = await callProposeSchedule(tasks, calendarEvents);

      const todayISO = new Date().toISOString().slice(0, 10);
      const todayExisting: ProposedScheduleBlock[] = calendarEvents
        .filter((e) => e.date === todayISO)
        .map((e) => ({
          taskId: e.id,
          title: e.title,
          time: e.time,
          date: e.date,
          duration: e.duration,
          category: e.type,
          isExisting: true,
        }));

      const newBlocks: ProposedScheduleBlock[] = result.scheduled_blocks.map((b, i) => ({
        taskId: `new-${i}`,
        title: b.task_title,
        time: b.time,
        date: b.date,
        duration: b.duration ?? 30,
        category: b.category,
        isExisting: false,
      }));

      const allBlocks = [...todayExisting, ...newBlocks].sort((a, b) =>
        a.time.localeCompare(b.time)
      );

      setProposedSchedule(allBlocks);
      setRecommendations(result.recommendations);
      setScheduleSummary(result.summary);
      setPhase("REVIEW_SCHEDULE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to propose schedule");
      setPhase("CLARIFY");
    }
  };

  const handleAcceptSchedule = () => {
    const newBlocks = proposedSchedule.filter((b) => !b.isExisting);

    newBlocks.forEach((block, index) => {
      setTimeout(() => {
        onScheduleChange({
          type: "add",
          event: {
            title: block.title,
            time: block.time,
            duration: block.duration,
          },
        });
      }, index * 100);
    });

    if (recommendations.length > 0) {
      onSuggestionsGenerated(recommendations);
    }

    setPhase("ACCEPTED");
    toast.success("Schedule created!", {
      description: `Added ${newBlocks.length} events to your calendar.`,
    });
  };

  const handleRevisionSubmit = async () => {
    if (!revisionInput.trim()) return;
    setError(null);
    setPhase("REVISING");

    try {
      const result = await callProposeSchedule(
        extractedTasks,
        calendarEvents,
        revisionInput,
        proposedSchedule
      );

      const todayISO = new Date().toISOString().slice(0, 10);
      const todayExisting: ProposedScheduleBlock[] = calendarEvents
        .filter((e) => e.date === todayISO)
        .map((e) => ({
          taskId: e.id,
          title: e.title,
          time: e.time,
          date: e.date,
          duration: e.duration,
          category: e.type,
          isExisting: true,
        }));

      const newBlocks: ProposedScheduleBlock[] = result.scheduled_blocks.map((b, i) => ({
        taskId: `rev-${i}`,
        title: b.task_title,
        time: b.time,
        date: b.date,
        duration: b.duration ?? 30,
        category: b.category,
        isExisting: false,
      }));

      const allBlocks = [...todayExisting, ...newBlocks].sort((a, b) =>
        a.time.localeCompare(b.time)
      );

      setProposedSchedule(allBlocks);
      setRecommendations(result.recommendations);
      setScheduleSummary(result.summary);
      setRevisionInput("");
      setPhase("REVIEW_SCHEDULE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revise schedule");
      setPhase("REVIEW_SCHEDULE");
    }
  };

  const handleReset = () => {
    setBrainDumpText("");
    setExtractedTasks([]);
    setClarificationQuestions([]);
    setCurrentQuestionIndex(0);
    setClarificationAnswer("");
    setProposedSchedule([]);
    setRecommendations([]);
    setScheduleSummary("");
    setRevisionInput("");
    setError(null);
    setPhase("IDLE");
  };

  const handleRemoveBlock = (block: ProposedScheduleBlock) => {
    setProposedSchedule((prev) => prev.filter((b) => b.taskId !== block.taskId));
    if (block.isExisting) {
      onScheduleChange({
        type: "remove",
        event: {
          title: block.title,
          time: block.time,
          duration: block.duration,
        },
      });
    }
  };

  // --- Helper: format time for display ---
  const formatTime = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  };

  const formatDuration = (mins: number | null | undefined) => {
    if (mins == null || isNaN(mins)) return "TBD";
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // --- Render by Phase ---

  // NO_KEY: API key gate
  if (phase === "NO_KEY") {
    return (
      <Card className="p-6 border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Brain Dump Planner</h3>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered day planning requires an OpenAI API key. Add your key to start turning brain dumps into optimized schedules.
          </p>
          <Button onClick={onApiKeyRequest} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Add API Key in Settings
          </Button>
        </div>
      </Card>
    );
  }

  // IDLE: Start button
  if (phase === "IDLE") {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Brain Dump Planner</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Dump everything on your mind and I'll extract tasks, ask clarifying questions, and build an optimized schedule around your existing calendar.
          </p>
          <Button
            onClick={() => setPhase("BRAIN_DUMP_INPUT")}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <ListTodo className="w-4 h-4" />
            Start Brain Dump
          </Button>
        </div>
      </Card>
    );
  }

  // BRAIN_DUMP_INPUT: Textarea input
  if (phase === "BRAIN_DUMP_INPUT") {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">Brain Dump</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Write everything you need to do today. Don't worry about structure - just dump it all out.
        </p>
        <Textarea
          value={brainDumpText}
          onChange={(e) => setBrainDumpText(e.target.value)}
          placeholder="e.g., I need to finish my valuation case study by Thursday, prep for the Goldman interview, hit the gym, grab coffee with Sarah about the consulting project, and review operations notes before the quiz..."
          className="min-h-[120px] mb-3"
        />
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 mb-3">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Cancel
          </Button>
          <Button
            onClick={handleBrainDumpSubmit}
            disabled={!brainDumpText.trim()}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Send className="w-4 h-4" />
            Analyze Tasks
          </Button>
        </div>
      </Card>
    );
  }

  // EXTRACTING: Loading state
  if (phase === "EXTRACTING") {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Analyzing your brain dump...</h3>
          <p className="text-sm text-muted-foreground">Extracting tasks and identifying what I need to know</p>
        </div>
      </Card>
    );
  }

  // CLARIFY: Task list + clarification questions
  if (phase === "CLARIFY") {
    const answered = clarificationQuestions.filter((q) => q.answered).length;
    const total = clarificationQuestions.length;
    const progressPercent = total > 0 ? (answered / total) * 100 : 100;
    const currentQ = clarificationQuestions[currentQuestionIndex];

    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListTodo className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">Extracted Tasks</h3>
          <Badge variant="outline" className="text-xs">
            {extractedTasks.length} tasks
          </Badge>
        </div>

        {/* Task checklist */}
        <ScrollArea className="max-h-[200px] mb-4">
          <div className="space-y-2">
            {extractedTasks.map((task) => {
              const isComplete = task.estimatedDuration !== null && task.dueDate !== null;
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    isComplete ? "bg-green-500/5" : "bg-amber-500/5"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isComplete ? "bg-green-500" : "bg-amber-500/30 border border-amber-500"
                    }`}
                  >
                    {isComplete && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm flex-1">{task.title}</span>
                  <Badge className={`text-[10px] ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </Badge>
                  {task.estimatedDuration && (
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(task.estimatedDuration)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Clarification progress */}
        {total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Clarification progress</span>
              <span>
                {answered}/{total}
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}

        {/* Current question */}
        {currentQ && !currentQ.answered && (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-muted/50 rounded-lg p-4 mb-3"
          >
            <p className="text-sm font-medium mb-1">{currentQ.taskTitle}</p>
            <p className="text-sm text-muted-foreground mb-3">{currentQ.question}</p>
            <div className="flex gap-2">
              <Input
                value={clarificationAnswer}
                onChange={(e) => setClarificationAnswer(e.target.value)}
                placeholder={
                  currentQ.field === "estimatedDuration"
                    ? "e.g., 90 (minutes)"
                    : "e.g., 2026-02-08"
                }
                onKeyDown={(e) => e.key === "Enter" && handleClarificationAnswer()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleClarificationAnswer} disabled={!clarificationAnswer.trim()}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 mb-3">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </Card>
    );
  }

  // PROPOSING: Loading state
  if (phase === "PROPOSING") {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Building your optimized schedule...</h3>
          <p className="text-sm text-muted-foreground">
            Fitting {extractedTasks.length} tasks around your {calendarEvents.filter((e) => e.date === new Date().toISOString().slice(0, 10)).length} existing events
          </p>
        </div>
      </Card>
    );
  }

  // REVIEW_SCHEDULE: Proposed timeline + accept/revise
  if (phase === "REVIEW_SCHEDULE") {
    const newBlockCount = proposedSchedule.filter((b) => !b.isExisting).length;

    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarPlus className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">Proposed Schedule</h3>
          <Badge variant="outline" className="text-xs">
            {newBlockCount} new events
          </Badge>
        </div>

        {/* AI Summary */}
        {scheduleSummary && (
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm">{scheduleSummary}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative h-[300px] mb-4 overflow-y-auto rounded-lg border border-border/50">
          <div className="space-y-1 p-2">
            {proposedSchedule.map((block, i) => (
              <motion.div
                key={`${block.taskId}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  block.isExisting
                    ? "bg-muted/30"
                    : "bg-green-500/5 border border-green-500/20 border-dashed"
                }`}
              >
                {/* Time */}
                <div className={`text-xs font-mono w-16 shrink-0 ${block.isExisting ? "text-muted-foreground" : "text-foreground font-semibold"}`}>
                  {formatTime(block.time)}
                </div>

                {/* Category dot */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    categoryColors[block.category] || "bg-gray-400"
                  }`}
                />

                {/* Title */}
                <span className={`text-sm flex-1 truncate ${block.isExisting ? "text-muted-foreground" : ""}`}>
                  {block.title}
                  {block.isExisting && (
                    <span className="text-xs text-muted-foreground/70 ml-1">(existing)</span>
                  )}
                </span>

                {/* Duration */}
                <Badge variant="outline" className="text-[10px] shrink-0">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(block.duration)}
                </Badge>

                {/* New indicator */}
                {!block.isExisting && (
                  <Badge className="bg-green-500 text-white text-[10px] shrink-0">New</Badge>
                )}

                {/* Delete button - always visible */}
                <button
                  onClick={() => handleRemoveBlock(block)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                  title={block.isExisting ? "Remove from calendar" : "Remove from schedule"}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 mb-3">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            Start Over
          </Button>
          <div className="flex-1 flex gap-2">
            <Input
              value={revisionInput}
              onChange={(e) => setRevisionInput(e.target.value)}
              placeholder="Request changes..."
              onKeyDown={(e) => e.key === "Enter" && handleRevisionSubmit()}
              className="flex-1"
            />
            {revisionInput.trim() ? (
              <Button variant="outline" onClick={handleRevisionSubmit} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Revise
              </Button>
            ) : (
              <Button
                onClick={handleAcceptSchedule}
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Check className="w-4 h-4" />
                Accept
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // REVISING: Loading
  if (phase === "REVISING") {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Revising your schedule...</h3>
          <p className="text-sm text-muted-foreground">Adjusting based on your feedback</p>
        </div>
      </Card>
    );
  }

  // ACCEPTED: Success
  if (phase === "ACCEPTED") {
    const addedCount = proposedSchedule.filter((b) => !b.isExisting).length;

    return (
      <Card className="p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Schedule Created!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Added {addedCount} events to your calendar. Check "Your Day at a Glance" and your calendar view to see the updates.
          </p>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <Brain className="w-4 h-4" />
            Plan Another Day
          </Button>
        </motion.div>
      </Card>
    );
  }

  return null;
}
