import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Check, Plus, Minus, RefreshCw, Sparkles, Clock, ListTodo, CalendarPlus, Loader2, Brain } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { motion } from "motion/react";
import { toast } from "sonner";
import { type PriorityMode, PRIORITY_CONFIG, PRIORITY_MODES } from "@/app/components/priority";
import { env } from "@/config/env";

// --- Shared Type Definitions ---

interface CalendarAction {
  type: "add" | "remove" | "replace";
  event: {
    title: string;
    time: string;
    duration: number;
    date?: string;
  };
  replaceWith?: {
    title: string;
    time: string;
    duration: number;
    date?: string;
  };
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly";
    interval?: number;
    daysOfWeek?: string[];
    until?: string;
    count?: number;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  duration: number;
  type: string;
  color: string;
}

// --- Brain Dump Types ---

interface ExtractedTask {
  id: string;
  title: string;
  estimatedDuration: number | null;
  dueDate: string | null;
  preferredTime: string | null;
  priority: "high" | "medium" | "low";
  category: "class" | "meeting" | "study" | "workout" | "networking" | "recruiting";
  priorityCategory: "Academics" | "Recruiting" | "Social" | "Wellness";
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

type BrainDumpPhase =
  | "IDLE"
  | "EXTRACTING"
  | "CLARIFY"
  | "PROPOSING"
  | "REVIEW_SCHEDULE"
  | "REVISING"
  | "ACCEPTED";

// --- Message Types ---

interface Message {
  id: string;
  type: "user" | "agent" | "action" | "task-list" | "clarification" | "schedule-proposal" | "schedule-accepted";
  content: string;
  timestamp: Date;
  action?: CalendarAction & {
    status: "pending" | "approved" | "rejected";
  };
  // Brain dump message data
  tasks?: ExtractedTask[];
  clarificationQuestion?: ClarificationQuestion;
  schedule?: ProposedScheduleBlock[];
  scheduleSummary?: string;
  acceptedCount?: number;
}

interface ConversationMemory {
  preferences: string[];
  recentActions: string[];
  context: string[];
}

// --- Constants ---

const categoryColors: Record<string, string> = {
  class: "bg-blue-500",
  meeting: "bg-purple-500",
  study: "bg-indigo-500",
  workout: "bg-green-500",
  networking: "bg-orange-500",
  recruiting: "bg-red-500",
};

const priorityCategoryToCalCategory: Record<string, ExtractedTask["category"]> = {
  Academics: "study",
  Recruiting: "recruiting",
  Social: "networking",
  Wellness: "workout",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-green-500 text-white",
};

// --- Helpers ---

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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

// --- Intent Detection (heuristic, no API call) ---

function detectIntent(text: string): "braindump" | "quick" {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Explicit triggers
  if (lower.includes("plan my day") || lower.includes("brain dump") || lower.includes("braindump") || lower.includes("plan my week")) {
    return "braindump";
  }

  // 3+ sentences
  const sentences = trimmed.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
  if (sentences.length >= 3) return "braindump";

  // 150+ chars with connector words
  const connectors = /\b(and|also|plus|then|after that|need to|have to|gotta|should|want to)\b/i;
  if (trimmed.length >= 150 && connectors.test(trimmed)) return "braindump";

  return "quick";
}

// --- Component ---

interface KaiseyChatbotProps {
  onScheduleChange: (action: CalendarAction) => void;
  onSuggestionsGenerated?: (suggestions: PlannerSuggestion[]) => void;
  variant?: "widget" | "panel";
  priority?: PriorityMode | null;
  calendarEvents?: CalendarEvent[];
}

export function KaiseyChatbot({ onScheduleChange, onSuggestionsGenerated, variant = "floating", priority, calendarEvents = [] }: KaiseyChatbotProps) {
  const [isOpen, setIsOpen] = useState(variant === "widget");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "agent",
      content: "Hi! I'm Kaisey. I can help you manage your schedule in two ways:\n\n\u2022 **Quick actions** \u2014 \"add gym tomorrow at 9am\"\n\u2022 **Brain dump** \u2014 paste everything on your mind and I'll build an optimized schedule\n\nWhat would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [memory, setMemory] = useState<ConversationMemory>({
    preferences: [],
    recentActions: [],
    context: [],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Brain dump state
  const [brainDumpPhase, setBrainDumpPhase] = useState<BrainDumpPhase>("IDLE");
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [proposedSchedule, setProposedSchedule] = useState<ProposedScheduleBlock[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && variant === "floating") {
      inputRef.current.focus();
    }
  }, [isOpen, variant]);

  // --- OpenAI API Calls ---

  const callOpenAI = async (userMessage: string, conversationHistory: Message[]): Promise<{ content: string; actions: CalendarAction[] }> => {
    const recentMessages = conversationHistory.slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.type === 'action'
        ? `[Proposed calendar action: ${msg.action?.type} - ${msg.action?.event.title} at ${msg.action?.event.time}]`
        : msg.content
    }));

    const response = await fetch(env.openai.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Kaisey, an intelligent MBA Co-Pilot assistant that helps MBA students optimize their schedules.

Current Context:
- Today's date: ${localToday()}
- Current time: ${`${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`}
${priority ? `- User's current priority: ${priority}\n- ${PRIORITY_CONFIG[priority].promptHint}` : ""}

Existing calendar events (DO NOT schedule over these):
${calendarEvents.length > 0 ? calendarEvents.map(e => `- ${e.date} ${e.time} (${e.duration}min): ${e.title}`).join('\n') : '(no events)'}

IMPORTANT RULES:
1. REMEMBER the conversation history. If the user has already provided information (event title, time, duration, recurrence), DO NOT ask for it again.
2. When you have ALL required info (title, time, duration, and for recurring: frequency + duration/count), immediately call the calendar_action function.
3. Always use 24-hour time format (e.g., "18:00" for 6 PM, "09:00" for 9 AM).
4. For RECURRING events, you need: title, start time, session duration, day(s) of week, and how long to repeat (weeks or count).
5. If the user says something like "6pm - 9pm" that means 3 hours (180 minutes) duration starting at 18:00.
6. Create ONLY ONE calendar_action with recurrence parameters, NOT multiple separate events.
7. Once you have all the information, CREATE THE EVENT. Don't keep asking questions.
8. When the user specifies a day (e.g. 'Thursday', 'next Monday', 'March 5th'), calculate the correct YYYY-MM-DD date and include it as event_date. If no day is specified, omit event_date (defaults to today).`
          },
          ...recentMessages,
          { role: 'user', content: userMessage }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'calendar_action',
              description: 'Add, remove, or replace a calendar event.',
              parameters: {
                type: 'object',
                properties: {
                  action_type: { type: 'string', enum: ['add', 'remove', 'replace'] },
                  event_title: { type: 'string' },
                  event_time: { type: 'string', description: 'HH:MM 24h format' },
                  event_duration: { type: 'number', description: 'Duration in minutes' },
                  event_date: { type: 'string', description: 'YYYY-MM-DD' },
                  replace_with_title: { type: 'string' },
                  replace_with_time: { type: 'string' },
                  replace_with_duration: { type: 'number' },
                  is_recurring: { type: 'boolean' },
                  recurrence_frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
                  recurrence_days: { type: 'array', items: { type: 'string', enum: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] } },
                  recurrence_until: { type: 'string' },
                  recurrence_count: { type: 'number' }
                },
                required: ['action_type', 'event_title', 'event_time', 'event_duration']
              }
            }
          }
        ],
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices[0]?.message;
    const actions: CalendarAction[] = [];

    if (message?.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.function?.name === 'calendar_action') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const action: CalendarAction = {
              type: args.action_type,
              event: {
                title: args.event_title,
                time: args.event_time,
                duration: args.event_duration || 60,
                date: args.event_date,
              }
            };
            if (args.action_type === 'replace' && args.replace_with_title) {
              action.replaceWith = {
                title: args.replace_with_title,
                time: args.replace_with_time || args.event_time,
                duration: args.replace_with_duration || args.event_duration || 60
              };
            }
            if (args.is_recurring && args.recurrence_frequency) {
              action.recurrence = {
                frequency: args.recurrence_frequency,
                daysOfWeek: args.recurrence_days,
                until: args.recurrence_until,
                count: args.recurrence_count
              };
            }
            actions.push(action);
          } catch (e) {
            console.error('Failed to parse function call:', e);
          }
        }
      }
    }

    const content = message?.content || (actions.length > 0 ? "I'll make this change to your calendar:" : 'Sorry, I could not generate a response.');
    return { content, actions };
  };

  const callExtractTasks = async (text: string) => {
    const todayISO = localToday();
    const response = await fetch(env.openai.proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a task extraction assistant for Kaisey, an MBA student planning tool.
The user will brain dump everything they need to do. Extract ALL of them as tasks.

Rules:
1. Extract every actionable item. Writing emails, sending messages, applying for positions, making calls are ALL schedulable tasks.
2. For each task: set category, priorityCategory, priority, duration (null if unknown), dueDate (null if unknown), preferredTime (HH:MM 24h if user specified, else null).
3. Generate clarification questions ONLY for tasks where duration is null.
4. Ignore calendar management commands like "delete my events."

Today: ${todayISO}

priorityCategory: Academics, Recruiting, Social, Wellness
category: class, meeting, study, workout, networking, recruiting
priority: high / medium / low
${priority ? `\n${PRIORITY_CONFIG[priority].promptHint}` : ""}

Call extract_tasks with ALL items.`,
          },
          { role: "user", content: text },
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
                        estimatedDuration: { type: ["number", "null"] },
                        dueDate: { type: ["string", "null"] },
                        preferredTime: { type: ["string", "null"] },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        priorityCategory: { type: "string", enum: ["Academics", "Recruiting", "Social", "Wellness"] },
                        category: { type: "string", enum: ["class", "meeting", "study", "workout", "networking", "recruiting"] },
                      },
                      required: ["title", "estimatedDuration", "dueDate", "preferredTime", "priority", "priorityCategory", "category"],
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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No task extraction response received");

    return JSON.parse(toolCall.function.arguments) as {
      tasks: Array<{
        title: string;
        estimatedDuration: number | null;
        dueDate: string | null;
        preferredTime: string | null;
        priority: "high" | "medium" | "low";
        priorityCategory: "Academics" | "Recruiting" | "Social" | "Wellness";
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
    const now = new Date();
    const todayISO = localToday();
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

    const msgs: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: `You are a schedule optimization assistant for an MBA student.
Given a list of tasks to schedule and existing calendar events, propose an optimized daily schedule.

CRITICAL RULES:
1. Current time is ${currentTime}. NEVER schedule before ${currentTime}.
2. If a task has "preferredTime", schedule it at EXACTLY that time.
3. NEVER overlap with existing calendar events.
4. Respect task durations exactly. Every task MUST have a positive integer duration (minimum 15 minutes).
5. Add 15-minute buffer between back-to-back events.
6. Schedule high priority tasks during peak productivity hours when possible.
7. Do not schedule after 10:00 PM.
8. Group similar category tasks when possible.

Today: ${todayISO}
Current time: ${currentTime}
${priority ? `\n${PRIORITY_CONFIG[priority].promptHint}` : ""}

Existing events today:
${JSON.stringify(todayEvents, null, 2)}

Tasks to schedule:
${JSON.stringify(tasksForScheduling, null, 2)}

Return ONLY by calling propose_schedule.`,
      },
    ];

    if (revisionRequest && previousSchedule) {
      msgs.push({ role: "assistant", content: `Previously proposed schedule: ${JSON.stringify(previousSchedule.filter((b) => !b.isExisting))}` });
      msgs.push({ role: "user", content: `Please revise the schedule: ${revisionRequest}` });
    } else {
      msgs.push({ role: "user", content: `Create an optimized schedule fitting these tasks around my existing events.${priority ? ` Priority: ${priority}.` : ""}` });
    }

    const response = await fetch(env.openai.proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: msgs,
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
                        time: { type: "string" },
                        date: { type: "string" },
                        duration: { type: "number" },
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
                  summary: { type: "string" },
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
    if (!toolCall) throw new Error("No schedule proposal received");

    return JSON.parse(toolCall.function.arguments) as {
      scheduled_blocks: Array<{ task_title: string; time: string; date: string; duration: number; category: string }>;
      recommendations: PlannerSuggestion[];
      summary: string;
    };
  };

  // --- Keyword Fallback (for when API is down) ---

  const processUserRequestFallback = (input: string): Message[] => {
    const lowerInput = input.toLowerCase();
    const responses: Message[] = [];

    if (lowerInput.includes("move") || lowerInput.includes("reschedule")) {
      let eventToMove = "event";
      let newTime = "14:00";
      if (lowerInput.includes("gym")) eventToMove = "Gym Session";
      if (lowerInput.match(/(\d+)\s*(pm|am)/)) {
        const timeMatch = lowerInput.match(/(\d+)\s*(pm|am)/);
        if (timeMatch) {
          let h = parseInt(timeMatch[1]);
          if (timeMatch[2] === "pm" && h !== 12) h += 12;
          if (timeMatch[2] === "am" && h === 12) h = 0;
          newTime = `${String(h).padStart(2, "0")}:00`;
        }
      }
      responses.push({
        id: (Date.now() + 1).toString(),
        type: "action",
        content: "",
        timestamp: new Date(),
        action: {
          type: "replace",
          event: { title: eventToMove, time: "13:00", duration: 45 },
          replaceWith: { title: eventToMove, time: newTime, duration: 45 },
          status: "pending",
        },
      });
    } else {
      responses.push({
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: "I can help manage your calendar! Try:\n\u2022 \"Add gym tomorrow at 9am\"\n\u2022 \"Schedule a meeting on Friday at 2pm\"\n\u2022 \"Move my study session to 4pm\"\n\u2022 Or paste a brain dump of everything you need to do!",
        timestamp: new Date(),
      });
    }

    return responses;
  };

  // --- Brain Dump Handlers ---

  const resetBrainDump = () => {
    setBrainDumpPhase("IDLE");
    setExtractedTasks([]);
    setClarificationQuestions([]);
    setCurrentQuestionIndex(0);
    setProposedSchedule([]);
  };

  const handleBrainDumpInChat = async (text: string) => {
    setBrainDumpPhase("EXTRACTING");
    setIsTyping(true);

    try {
      const result = await callExtractTasks(text);

      const todayISO = localToday();
      const tasks: ExtractedTask[] = (result.tasks || []).map((t, i) => ({
        id: `task-${i}`,
        title: t.title,
        estimatedDuration: t.estimatedDuration,
        dueDate: t.preferredTime ? (t.dueDate || todayISO) : t.dueDate,
        preferredTime: t.preferredTime || null,
        priority: t.priority || "medium",
        priorityCategory: (t.priorityCategory && PRIORITY_CONFIG[t.priorityCategory]) ? t.priorityCategory : "Academics",
        category: t.category || "study",
      }));

      const questions: ClarificationQuestion[] = (result.clarification_questions || []).map((q, i) => {
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
        setIsTyping(false);
        setBrainDumpPhase("IDLE");
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: "agent",
          content: "I couldn't find any schedulable tasks in that. Try listing specific things you need to do, like \"finish valuation case, prep for Goldman, gym 3x this week.\"",
          timestamp: new Date(),
        }]);
        return;
      }

      setExtractedTasks(tasks);
      setClarificationQuestions(questions);
      setCurrentQuestionIndex(0);
      setIsTyping(false);

      // Add task list message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: "task-list",
        content: `I found ${tasks.length} tasks in your brain dump:`,
        timestamp: new Date(),
        tasks,
      }]);

      if (questions.length === 0) {
        // Skip clarifications, go straight to scheduling
        setBrainDumpPhase("PROPOSING");
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          type: "agent",
          content: "All tasks have complete info. Building your optimized schedule...",
          timestamp: new Date(),
        }]);
        await proposeScheduleFromTasks(tasks);
      } else {
        setBrainDumpPhase("CLARIFY");
        // Add first clarification question
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          type: "clarification",
          content: "",
          timestamp: new Date(),
          clarificationQuestion: questions[0],
        }]);
      }
    } catch (err) {
      setIsTyping(false);
      setBrainDumpPhase("IDLE");
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "agent",
        content: `Something went wrong while analyzing your tasks: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
        timestamp: new Date(),
      }]);
    }
  };

  const handleClarificationInChat = (answer: string) => {
    const currentQ = clarificationQuestions[currentQuestionIndex];
    if (!currentQ) return;

    const updatedQuestions = [...clarificationQuestions];
    updatedQuestions[currentQuestionIndex] = { ...currentQ, answered: true, answer };

    const updatedTasks = extractedTasks.map((task) => {
      if (task.id === currentQ.taskId) {
        if (currentQ.field === "estimatedDuration") {
          const minutes = parseInt(answer);
          return { ...task, estimatedDuration: isNaN(minutes) ? 60 : minutes };
        } else if (currentQ.field === "dueDate") {
          return { ...task, dueDate: answer };
        }
      }
      return task;
    });

    setClarificationQuestions(updatedQuestions);
    setExtractedTasks(updatedTasks);

    // Mark the current question message as answered
    setMessages(prev => prev.map(msg => {
      if (msg.type === "clarification" && msg.clarificationQuestion?.taskId === currentQ.taskId && msg.clarificationQuestion?.field === currentQ.field) {
        return { ...msg, clarificationQuestion: { ...msg.clarificationQuestion, answered: true, answer } };
      }
      return msg;
    }));

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= clarificationQuestions.length) {
      // All answered, move to proposing
      setCurrentQuestionIndex(nextIndex);
      setBrainDumpPhase("PROPOSING");
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "agent",
        content: "Got it! Building your optimized schedule...",
        timestamp: new Date(),
      }]);
      proposeScheduleFromTasks(updatedTasks);
    } else {
      setCurrentQuestionIndex(nextIndex);
      // Add next question
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "clarification",
        content: "",
        timestamp: new Date(),
        clarificationQuestion: updatedQuestions[nextIndex],
      }]);
    }
  };

  const proposeScheduleFromTasks = async (tasks: ExtractedTask[]) => {
    setIsTyping(true);
    try {
      const result = await callProposeSchedule(tasks, calendarEvents);
      const todayISO = localToday();

      const todayExisting: ProposedScheduleBlock[] = calendarEvents
        .filter((e) => e.date === todayISO)
        .map((e) => ({ taskId: e.id, title: e.title, time: e.time, date: e.date, duration: e.duration, category: e.type, isExisting: true }));

      const newBlocks: ProposedScheduleBlock[] = result.scheduled_blocks.map((b, i) => ({
        taskId: `new-${i}`,
        title: b.task_title,
        time: b.time,
        date: b.date,
        duration: b.duration ?? 30,
        category: b.category,
        isExisting: false,
      }));

      const allBlocks = [...todayExisting, ...newBlocks].sort((a, b) => a.time.localeCompare(b.time));
      setProposedSchedule(allBlocks);
      setIsTyping(false);
      setBrainDumpPhase("REVIEW_SCHEDULE");

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "schedule-proposal",
        content: "",
        timestamp: new Date(),
        schedule: allBlocks,
        scheduleSummary: result.summary,
      }]);

      // Store recommendations for later
      if (result.recommendations?.length > 0 && onSuggestionsGenerated) {
        // Will be sent when schedule is accepted
        setMemory(prev => ({ ...prev, context: [...prev.context, JSON.stringify(result.recommendations)] }));
      }
    } catch (err) {
      setIsTyping(false);
      setBrainDumpPhase("CLARIFY");
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "agent",
        content: `Failed to build schedule: ${err instanceof Error ? err.message : "Unknown error"}. You can try again or type "cancel" to start over.`,
        timestamp: new Date(),
      }]);
    }
  };

  const handleRevisionInChat = async (revisionText: string) => {
    setBrainDumpPhase("REVISING");
    setIsTyping(true);

    try {
      const result = await callProposeSchedule(extractedTasks, calendarEvents, revisionText, proposedSchedule);
      const todayISO = localToday();

      const todayExisting: ProposedScheduleBlock[] = calendarEvents
        .filter((e) => e.date === todayISO)
        .map((e) => ({ taskId: e.id, title: e.title, time: e.time, date: e.date, duration: e.duration, category: e.type, isExisting: true }));

      const newBlocks: ProposedScheduleBlock[] = result.scheduled_blocks.map((b, i) => ({
        taskId: `rev-${i}`,
        title: b.task_title,
        time: b.time,
        date: b.date,
        duration: b.duration ?? 30,
        category: b.category,
        isExisting: false,
      }));

      const allBlocks = [...todayExisting, ...newBlocks].sort((a, b) => a.time.localeCompare(b.time));
      setProposedSchedule(allBlocks);
      setIsTyping(false);
      setBrainDumpPhase("REVIEW_SCHEDULE");

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "schedule-proposal",
        content: "",
        timestamp: new Date(),
        schedule: allBlocks,
        scheduleSummary: result.summary,
      }]);
    } catch (err) {
      setIsTyping(false);
      setBrainDumpPhase("REVIEW_SCHEDULE");
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "agent",
        content: `Failed to revise schedule: ${err instanceof Error ? err.message : "Unknown error"}. Try a different revision or click Accept on the current proposal.`,
        timestamp: new Date(),
      }]);
    }
  };

  const handleAcceptSchedule = () => {
    const newBlocks = proposedSchedule.filter((b) => !b.isExisting);

    newBlocks.forEach((block, index) => {
      setTimeout(() => {
        onScheduleChange({
          type: "add",
          event: { title: block.title, time: block.time, duration: block.duration, date: block.date },
        });
      }, index * 100);
    });

    // Send stored recommendations
    if (onSuggestionsGenerated) {
      try {
        const storedRecs = memory.context.find(c => c.startsWith("["));
        if (storedRecs) {
          onSuggestionsGenerated(JSON.parse(storedRecs));
        }
      } catch { /* ignore */ }
    }

    setBrainDumpPhase("ACCEPTED");

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: "schedule-accepted",
      content: "",
      timestamp: new Date(),
      acceptedCount: newBlocks.length,
    }]);

    toast.success("Schedule created!", { description: `Added ${newBlocks.length} events to your calendar.` });

    // Reset brain dump state after a moment so user can continue chatting
    setTimeout(() => {
      resetBrainDump();
    }, 1000);
  };

  // --- Main Send Handler (routes by phase) ---

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const userMessage = inputValue;
    setInputValue("");

    // Check for cancel during brain dump
    if (brainDumpPhase !== "IDLE" && brainDumpPhase !== "ACCEPTED" && userMessage.toLowerCase().trim() === "cancel") {
      resetBrainDump();
      setMessages(prev => [...prev,
        { id: Date.now().toString(), type: "user", content: userMessage, timestamp: new Date() },
        { id: (Date.now() + 1).toString(), type: "agent", content: "Brain dump cancelled. What would you like to do?", timestamp: new Date() },
      ]);
      return;
    }

    // Add user message
    const userMsg: Message = { id: Date.now().toString(), type: "user", content: userMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // Route by brain dump phase
    if (brainDumpPhase === "CLARIFY") {
      handleClarificationInChat(userMessage);
      return;
    }

    if (brainDumpPhase === "REVIEW_SCHEDULE") {
      handleRevisionInChat(userMessage);
      return;
    }

    // During EXTRACTING/PROPOSING/REVISING, input is effectively queued (disabled below)
    if (brainDumpPhase === "EXTRACTING" || brainDumpPhase === "PROPOSING" || brainDumpPhase === "REVISING") {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: "I'm still working on your schedule. Please wait a moment...",
        timestamp: new Date(),
      }]);
      return;
    }

    // IDLE — detect intent
    const intent = detectIntent(userMessage);

    if (intent === "braindump") {
      // Add acknowledging message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: "Analyzing your tasks...",
        timestamp: new Date(),
      }]);
      await handleBrainDumpInChat(userMessage);
    } else {
      // Quick action — use OpenAI chat
      setIsTyping(true);
      try {
        const { content, actions } = await callOpenAI(userMessage, messages);
        const newMessages: Message[] = [];

        if (content) {
          newMessages.push({ id: (Date.now() + 1).toString(), type: "agent", content, timestamp: new Date() });
        }

        actions.forEach((action, index) => {
          newMessages.push({
            id: (Date.now() + 2 + index).toString(),
            type: "action",
            content: "",
            timestamp: new Date(),
            action: { ...action, status: "pending" },
          });
        });

        setMessages(prev => [...prev, ...newMessages]);
        setIsTyping(false);
      } catch (error) {
        console.error("Proxy error, falling back to keyword engine:", error);
        const fallbackMsgs = processUserRequestFallback(userMessage);
        setTimeout(() => {
          setMessages(prev => [...prev, ...fallbackMsgs]);
          setIsTyping(false);
        }, 800);
      }
    }
  };

  // --- Action Approve/Reject ---

  const handleApproveAction = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    setMessages(prev =>
      prev.map(msg => msg.id === messageId && msg.action ? { ...msg, action: { ...msg.action, status: "approved" as const } } : msg)
    );

    if (message?.action && onScheduleChange) {
      const { status, ...actionWithoutStatus } = message.action;
      onScheduleChange(actionWithoutStatus);
    }

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "agent",
        content: "\u2713 Calendar updated successfully.",
        timestamp: new Date(),
      }]);
    }, 500);
  };

  const handleRejectAction = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg => msg.id === messageId && msg.action ? { ...msg, action: { ...msg.action, status: "rejected" as const } } : msg)
    );

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "agent",
        content: "Understood. What alternative would work better for you?",
        timestamp: new Date(),
      }]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Dynamic Placeholder ---

  const getPlaceholder = (): string => {
    switch (brainDumpPhase) {
      case "CLARIFY": {
        const q = clarificationQuestions[currentQuestionIndex];
        return q?.field === "estimatedDuration" ? "e.g., 90 (minutes)" : "e.g., 2026-02-20";
      }
      case "REVIEW_SCHEDULE":
        return "Type revision or click Accept...";
      case "EXTRACTING":
      case "PROPOSING":
      case "REVISING":
        return "Processing...";
      default:
        return "Try \"add gym at 9am\" or paste your brain dump...";
    }
  };

  const isInputDisabled = brainDumpPhase === "EXTRACTING" || brainDumpPhase === "PROPOSING" || brainDumpPhase === "REVISING";

  // --- Message Renderers ---

  const renderActionMessage = (message: Message) => {
    if (!message.action) return null;
    const { type, event, replaceWith, status } = message.action;
    const actionIcon = type === "add" ? Plus : type === "remove" ? Minus : RefreshCw;
    const ActionIcon = actionIcon;
    const actionColor = type === "add" ? "bg-green-500" : type === "remove" ? "bg-red-500" : "bg-blue-500";

    return (
      <div className="flex gap-2">
        <div className={`w-6 h-6 rounded-full ${actionColor} flex items-center justify-center shrink-0`}>
          <ActionIcon className="w-3 h-3 text-white" />
        </div>
        <div className="max-w-[80%] flex-1">
          <div className={`rounded-lg border-2 ${status === "approved" ? "border-green-500 bg-green-500/5" : status === "rejected" ? "border-gray-300 bg-gray-100" : "border-blue-500 bg-blue-500/5"} p-3`}>
            <Badge className={`${actionColor} text-white text-xs mb-2`}>
              {type === "add" ? "ADD" : type === "remove" ? "REMOVE" : "REPLACE"}
            </Badge>

            {type === "add" && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-green-600">+ Add to calendar:</p>
                <div className="text-xs bg-white border rounded p-2">
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-muted-foreground">{event.time} &bull; {event.duration} min</div>
                  {message.action?.recurrence && (
                    <div className="text-blue-600 mt-1">
                      Repeats {message.action.recurrence.frequency}
                      {message.action.recurrence.daysOfWeek && ` on ${message.action.recurrence.daysOfWeek.join(', ')}`}
                      {message.action.recurrence.count && ` (${message.action.recurrence.count} times)`}
                      {message.action.recurrence.until && ` until ${message.action.recurrence.until}`}
                    </div>
                  )}
                </div>
              </div>
            )}

            {type === "remove" && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-red-600">&minus; Remove from calendar:</p>
                <div className="text-xs bg-white border rounded p-2 opacity-60 line-through">
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-muted-foreground">{event.time} &bull; {event.duration} min</div>
                </div>
              </div>
            )}

            {type === "replace" && replaceWith && (
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1">&minus; Current:</p>
                  <div className="text-xs bg-white border rounded p-2 opacity-60">
                    <div className="font-semibold">{event.title}</div>
                    <div className="text-muted-foreground">{event.time} &bull; {event.duration} min</div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1">+ Replace with:</p>
                  <div className="text-xs bg-white border-2 border-green-500 rounded p-2">
                    <div className="font-semibold">{replaceWith.title}</div>
                    <div className="text-muted-foreground">{replaceWith.time} &bull; {replaceWith.duration} min</div>
                  </div>
                </div>
              </div>
            )}

            {status === "pending" && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => handleApproveAction(message.id)} className="flex-1 bg-green-500 hover:bg-green-600 text-white h-7 text-xs">
                  <Check className="w-3 h-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRejectAction(message.id)} className="flex-1 h-7 text-xs">
                  Decline
                </Button>
              </div>
            )}

            {status === "approved" && (
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold mt-2">
                <Check className="w-3 h-3" /> Approved & Applied
              </div>
            )}

            {status === "rejected" && (
              <div className="text-xs text-muted-foreground mt-2">Declined</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskListMessage = (message: Message) => {
    if (!message.tasks) return null;
    return (
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
          <ListTodo className="w-3 h-3 text-white" />
        </div>
        <div className="max-w-[85%] flex-1">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-semibold mb-2">{message.content}</p>
            <div className="space-y-1.5">
              {message.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-xs bg-background rounded p-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${categoryColors[task.category] || "bg-gray-400"}`} />
                  <span className="flex-1 truncate">{task.title}</span>
                  <Badge className={`text-[9px] px-1.5 py-0 ${PRIORITY_CONFIG[task.priorityCategory]?.bgColor || ""} ${PRIORITY_CONFIG[task.priorityCategory]?.textColor || ""} border ${PRIORITY_CONFIG[task.priorityCategory]?.borderColor || ""}`}>
                    {task.priorityCategory}
                  </Badge>
                  <Badge className={`text-[9px] px-1.5 py-0 ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </Badge>
                  {task.estimatedDuration && (
                    <span className="text-muted-foreground text-[10px]">{formatDuration(task.estimatedDuration)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClarificationMessage = (message: Message) => {
    const q = message.clarificationQuestion;
    if (!q) return null;
    return (
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
          <Bot className="w-3 h-3 text-white" />
        </div>
        <div className="max-w-[80%]">
          <div className={`rounded-lg p-3 ${q.answered ? "bg-muted/50" : "bg-amber-500/5 border border-amber-500/20"}`}>
            <p className="text-xs font-semibold mb-1">{q.taskTitle}</p>
            <p className="text-xs text-muted-foreground">{q.question}</p>
            {q.answered && q.answer && (
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <Check className="w-3 h-3" />
                <span>{q.answer}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleProposalMessage = (message: Message) => {
    if (!message.schedule) return null;
    const newBlockCount = message.schedule.filter(b => !b.isExisting).length;
    // Check if this is the latest proposal (last schedule-proposal message)
    const allProposals = messages.filter(m => m.type === "schedule-proposal");
    const isLatest = allProposals[allProposals.length - 1]?.id === message.id;
    const isActive = isLatest && brainDumpPhase === "REVIEW_SCHEDULE";

    return (
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
          <CalendarPlus className="w-3 h-3 text-white" />
        </div>
        <div className="max-w-[90%] flex-1">
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold">Proposed Schedule</span>
              <Badge variant="outline" className="text-[10px]">{newBlockCount} new</Badge>
            </div>

            {message.scheduleSummary && (
              <div className="bg-purple-500/5 border border-purple-500/20 rounded p-2 mb-2">
                <div className="flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
                  <p className="text-[11px]">{message.scheduleSummary}</p>
                </div>
              </div>
            )}

            <div className="space-y-1 mb-2">
              {message.schedule.map((block, i) => (
                <div
                  key={`${block.taskId}-${i}`}
                  className={`flex items-center gap-2 p-2 rounded text-xs ${
                    block.isExisting ? "bg-background/50 text-muted-foreground" : "bg-green-500/5 border border-green-500/20 border-dashed"
                  }`}
                >
                  <span className="font-mono w-14 shrink-0 text-[11px]">{formatTime(block.time)}</span>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${categoryColors[block.category] || "bg-gray-400"}`} />
                  <span className="flex-1 truncate">
                    {block.title}
                    {block.isExisting && <span className="text-muted-foreground/60 ml-1">(existing)</span>}
                  </span>
                  <span className="text-muted-foreground text-[10px] shrink-0">{formatDuration(block.duration)}</span>
                  {!block.isExisting && <Badge className="bg-green-500 text-white text-[9px] px-1 py-0 shrink-0">New</Badge>}
                </div>
              ))}
            </div>

            {isActive && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleAcceptSchedule} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-7 text-xs">
                  <Check className="w-3 h-3 mr-1" /> Accept Schedule
                </Button>
                <Button size="sm" variant="outline" onClick={resetBrainDump} className="h-7 text-xs">
                  Cancel
                </Button>
              </div>
            )}

            {!isActive && brainDumpPhase !== "REVIEW_SCHEDULE" && (
              <div className="text-xs text-muted-foreground mt-1 italic">
                {brainDumpPhase === "ACCEPTED" || messages.some(m => m.type === "schedule-accepted") ? "Schedule accepted" : "Superseded by revision"}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleAcceptedMessage = (message: Message) => {
    return (
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-white" />
        </div>
        <div className="max-w-[80%]">
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
            <p className="text-xs font-semibold text-green-700">Schedule Created!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Added {message.acceptedCount} events to your calendar. Check your calendar view to see the updates.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // --- Widget Variant (always visible) ---

  if (variant === "widget") {
    return (
      <Card className="p-4 border-2 border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Chat with Kaisey
                <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                  AI Active
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Quick actions or brain dump — I'll figure out what you need</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            disabled={isInputDisabled}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isInputDisabled}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {messages.length > 1 && (
          <div className="border-t pt-4">
            <ScrollArea className="h-[450px]">
              <div className="space-y-3 pr-4">
                {messages.slice(1).map((message) => (
                  <div key={message.id}>
                    {message.type === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-lg bg-blue-500 text-white p-2">
                          <p className="text-xs">{message.content}</p>
                        </div>
                      </div>
                    ) : message.type === "agent" ? (
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <div className="max-w-[80%]">
                          <div className="rounded-lg bg-muted p-2">
                            <p className="text-xs whitespace-pre-line">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ) : message.type === "action" ? (
                      renderActionMessage(message)
                    ) : message.type === "task-list" ? (
                      renderTaskListMessage(message)
                    ) : message.type === "clarification" ? (
                      renderClarificationMessage(message)
                    ) : message.type === "schedule-proposal" ? (
                      renderScheduleProposalMessage(message)
                    ) : message.type === "schedule-accepted" ? (
                      renderScheduleAcceptedMessage(message)
                    ) : null}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>
        )}
      </Card>
    );
  }

  // Floating variant (bottom-right)
  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-24 z-50" data-tour-id="kaisey-chat">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 relative group"
          >
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse"></span>
          </Button>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl">
          <Card className="h-full flex flex-col border-2">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-500">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-white" />
                <div>
                  <h3 className="font-semibold text-white text-sm">Kaisey</h3>
                  <p className="text-xs text-white/80">Your MBA Co-Pilot</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0 text-white hover:bg-white/20">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              {/* Messages rendering same as widget */}
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={getPlaceholder()}
                  disabled={isInputDisabled}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isInputDisabled}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
