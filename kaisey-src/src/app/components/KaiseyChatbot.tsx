import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Check, Plus, Minus, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";

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
    daysOfWeek?: string[]; // e.g., ["MO", "TU", "WE"]
    until?: string; // YYYY-MM-DD
    count?: number; // number of occurrences
  };
}

interface Message {
  id: string;
  type: "user" | "agent" | "action";
  content: string;
  timestamp: Date;
  action?: CalendarAction & {
    status: "pending" | "approved" | "rejected";
  };
}

interface ConversationMemory {
  preferences: string[];
  recentActions: string[];
  context: string[];
}

interface KaiseyChatbotProps {
  onScheduleChange: (action: CalendarAction) => void;
  onFocusChange?: (focus: string) => void;
  variant?: "widget" | "panel";
  openaiKey?: string; // Add OpenAI API key prop
}

export function KaiseyChatbot({ onScheduleChange, onFocusChange, variant = "floating", openaiKey }: KaiseyChatbotProps) {
  const [isOpen, setIsOpen] = useState(variant === "widget");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "agent",
      content: "Hi Alex! I'm Kaisey, your personal MBA Co-Pilot. What's your priority today? I can help optimize your schedule.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null); // Track API errors
  const [memory, setMemory] = useState<ConversationMemory>({
    preferences: ["Prefers morning workouts at 6 AM", "Avoids back-to-back meetings", "Needs 15min travel buffers", "Most productive 9-11 AM"],
    recentActions: [],
    context: ["Recruiting focus this week", "Goldman Sachs info session today at 12 PM", "Strategy Canvas quiz at 11 AM", "Low HRV - needs recovery"],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const processUserRequest = (input: string): Message[] => {
    const lowerInput = input.toLowerCase();
    const responses: Message[] = [];

    // User message
    responses.push({
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    });

    // Update memory with new context
    const newMemory = { ...memory };
    if (lowerInput.includes("prefer") || lowerInput.includes("like")) {
      newMemory.preferences.push(`User mentioned: ${input}`);
    }

    // Assignment scheduling detection
    if ((lowerInput.includes("schedule") || lowerInput.includes("add time") || lowerInput.includes("block time") || lowerInput.includes("study time")) && 
        (lowerInput.includes("valuation") || lowerInput.includes("case study") || lowerInput.includes("quiz") || 
         lowerInput.includes("assignment") || lowerInput.includes("exam") || lowerInput.includes("marketing") || 
         lowerInput.includes("operations") || lowerInput.includes("ethics"))) {
      
      let assignmentTitle = "";
      let studyTime = "14:00";
      let duration = 120;
      
      // Detect specific assignments
      if (lowerInput.includes("valuation")) {
        assignmentTitle = "Study: Valuation Case Study";
      } else if (lowerInput.includes("marketing")) {
        assignmentTitle = "Study: Marketing Mix Analysis";
      } else if (lowerInput.includes("operations")) {
        assignmentTitle = "Study: Operations Group Project";
      } else if (lowerInput.includes("ethics")) {
        assignmentTitle = "Study: Ethics Discussion Post";
      } else if (lowerInput.includes("quiz")) {
        assignmentTitle = "Study: Strategy Canvas Quiz";
      } else {
        assignmentTitle = "Study: Assignment Work";
      }
      
      // Detect time preferences
      if (lowerInput.match(/(\d+)\s*(pm|am)/)) {
        const timeMatch = lowerInput.match(/(\d+):?(\d+)?\s*(pm|am)/);
        if (timeMatch) {
          let hour = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] || "00";
          const period = timeMatch[3].toLowerCase();
          
          if (period === "pm" && hour !== 12) hour += 12;
          if (period === "am" && hour === 12) hour = 0;
          
          studyTime = `${hour.toString().padStart(2, '0')}:${minutes}`;
        }
      } else if (lowerInput.includes("morning")) {
        studyTime = "09:00";
      } else if (lowerInput.includes("afternoon")) {
        studyTime = "14:00";
      } else if (lowerInput.includes("evening")) {
        studyTime = "18:00";
      }
      
      // Detect duration
      if (lowerInput.match(/(\d+)\s*(hour|hr)/)) {
        const durationMatch = lowerInput.match(/(\d+)\s*(hour|hr)/);
        if (durationMatch) duration = parseInt(durationMatch[1]) * 60;
      } else if (lowerInput.match(/(\d+)\s*(min|minute)/)) {
        const durationMatch = lowerInput.match(/(\d+)\s*(min|minute)/);
        if (durationMatch) duration = parseInt(durationMatch[1]);
      }
      
      // Check if we need to replace existing event
      const shouldReplace = lowerInput.includes("replace") || lowerInput.includes("instead of") || lowerInput.includes("move");
      
      if (shouldReplace) {
        let eventToReplace = "";
        if (lowerInput.includes("gym")) eventToReplace = "Gym Session";
        else if (lowerInput.includes("coffee") || lowerInput.includes("networking")) eventToReplace = "Coffee Chat: Sarah (McKinsey)";
        else if (lowerInput.includes("goldman")) eventToReplace = "Goldman Sachs Info Session";
        
        if (eventToReplace) {
          responses.push({
            id: (Date.now() + 1).toString(),
            type: "agent",
            content: `I'll replace your ${eventToReplace} with ${assignmentTitle}:`,
            timestamp: new Date(),
          });
          
          responses.push({
            id: (Date.now() + 2).toString(),
            type: "action",
            content: "",
            timestamp: new Date(),
            action: {
              type: "replace",
              event: { title: eventToReplace, time: "13:00", duration: 45 },
              replaceWith: { title: assignmentTitle, time: studyTime, duration: duration },
              status: "pending",
            },
          });
        }
      } else {
        responses.push({
          id: (Date.now() + 1).toString(),
          type: "agent",
          content: `Perfect! I'll add ${assignmentTitle} to your calendar:`,
          timestamp: new Date(),
        });
        
        responses.push({
          id: (Date.now() + 2).toString(),
          type: "action",
          content: "",
          timestamp: new Date(),
          action: {
            type: "add",
            event: { title: assignmentTitle, time: studyTime, duration: duration },
            status: "pending",
          },
        });
      }
      
      newMemory.recentActions.push(`Scheduled study time for assignment`);
      setMemory(newMemory);
      return responses;
    }

    // Priority detection and schedule optimization
    if (lowerInput.includes("priority") || lowerInput.includes("priorities") || 
        lowerInput.includes("focus on") || lowerInput.includes("important") ||
        lowerInput.includes("need to")) {
      
      let priority = "";
      let priorityType = "";
      let scheduleActions: CalendarAction[] = [];
      
      // Detect priority type
      if (lowerInput.includes("recruit") || lowerInput.includes("career") || lowerInput.includes("job")) {
        priority = "recruiting and career development";
        priorityType = "recruiting";
        
        // Notify parent about focus change
        if (onFocusChange) {
          onFocusChange("Recruiting & Career Development");
        }
        
        scheduleActions = [
          {
            type: "replace",
            event: { title: "Gym Session", time: "13:00", duration: 45 },
            replaceWith: { title: "Gym Session", time: "06:00", duration: 45 }
          },
          {
            type: "add",
            event: { title: "Goldman Sachs Prep", time: "11:30", duration: 30 }
          },
          {
            type: "replace",
            event: { title: "Coffee Chat: Sarah (McKinsey)", time: "10:15", duration: 45 },
            replaceWith: { title: "Coffee Chat: Sarah (McKinsey)", time: "10:15", duration: 60 }
          }
        ];
      } else if (lowerInput.includes("study") || lowerInput.includes("academic") || lowerInput.includes("exam") || lowerInput.includes("class")) {
        priority = "academics and studying";
        priorityType = "academics";
        
        // Notify parent about focus change
        if (onFocusChange) {
          onFocusChange("Academic Excellence");
        }
        
        scheduleActions = [
          {
            type: "remove",
            event: { title: "Gym Session", time: "13:00", duration: 45 }
          },
          {
            type: "remove",
            event: { title: "Coffee Chat: Sarah (McKinsey)", time: "10:15", duration: 45 }
          },
          {
            type: "add",
            event: { title: "Focused Study Block", time: "14:00", duration: 120 }
          }
        ];
      } else if (lowerInput.includes("health") || lowerInput.includes("recovery") || lowerInput.includes("rest") || lowerInput.includes("well-being")) {
        priority = "health and recovery";
        priorityType = "health";
        
        // Notify parent about focus change
        if (onFocusChange) {
          onFocusChange("Health & Well-being");
        }
        
        scheduleActions = [
          {
            type: "replace",
            event: { title: "Coffee Chat: Sarah (McKinsey)", time: "10:15", duration: 45 },
            replaceWith: { title: "Coffee Chat: Sarah (McKinsey) - Video Call", time: "10:15", duration: 45 }
          },
          {
            type: "replace",
            event: { title: "Gym Session", time: "13:00", duration: 45 },
            replaceWith: { title: "Light Yoga & Stretching", time: "13:00", duration: 30 }
          },
          {
            type: "add",
            event: { title: "Meditation Break", time: "15:00", duration: 30 }
          }
        ];
      } else if (lowerInput.includes("network") || lowerInput.includes("connection") || lowerInput.includes("relationship")) {
        priority = "networking and building connections";
        priorityType = "networking";
        
        // Notify parent about focus change
        if (onFocusChange) {
          onFocusChange("Professional Networking");
        }
        
        scheduleActions = [
          {
            type: "replace",
            event: { title: "Coffee Chat: Sarah (McKinsey)", time: "10:15", duration: 45 },
            replaceWith: { title: "Coffee Chat: Sarah (McKinsey)", time: "10:15", duration: 60 }
          },
          {
            type: "add",
            event: { title: "Goldman Sachs Follow-up", time: "13:00", duration: 15 }
          },
          {
            type: "add",
            event: { title: "Lunch with Classmates", time: "13:30", duration: 60 }
          }
        ];
      } else {
        // Generic priority mentioned
        priority = "your stated goals";
        priorityType = "general";
        scheduleActions = [
          {
            type: "add",
            event: { title: "Protected Focus Time", time: "09:00", duration: 120 }
          },
          {
            type: "add",
            event: { title: "Travel Buffer", time: "11:45", duration: 15 }
          },
          {
            type: "add",
            event: { title: "Deep Work Block", time: "14:30", duration: 90 }
          }
        ];
      }

      responses.push({
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: `Got it, Alex! I understand ${priority} is your top priority today. Here are my recommended calendar changes:`,
        timestamp: new Date(),
      });

      // Create action items for each suggested change
      scheduleActions.forEach((calAction, index) => {
        responses.push({
          id: (Date.now() + 2 + index).toString(),
          type: "action",
          content: "", // Content will be rendered based on action type in UI
          timestamp: new Date(),
          action: {
            ...calAction,
            status: "pending",
          },
        });
      });

      newMemory.context.push(`Priority set: ${priority}`);
      newMemory.preferences.push(`Prioritizes ${priority}`);
      
    } else if (lowerInput.includes("move") || lowerInput.includes("reschedule")) {
      let eventToMove = "event";
      let newTime = "later";
      
      if (lowerInput.includes("gym")) eventToMove = "Gym Session";
      if (lowerInput.includes("meeting")) eventToMove = "meeting";
      if (lowerInput.includes("lunch")) eventToMove = "lunch";
      if (lowerInput.includes("study")) eventToMove = "study session";
      
      if (lowerInput.match(/\d+\s*(pm|am)/)) {
        const timeMatch = lowerInput.match(/(\d+)\s*(pm|am)/);
        if (timeMatch) newTime = `${timeMatch[1]} ${timeMatch[2].toUpperCase()}`;
      } else if (lowerInput.includes("tomorrow")) {
        newTime = "tomorrow morning";
      } else if (lowerInput.includes("afternoon")) {
        newTime = "this afternoon";
      }

      responses.push({
        id: (Date.now() + 1).toString(),
        type: "action",
        content: "",
        timestamp: new Date(),
        action: {
          type: "replace",
          event: { title: eventToMove, time: "13:00", duration: 45 },
          replaceWith: { title: eventToMove, time: newTime === "tomorrow morning" ? "06:00" : "14:00", duration: 45 },
          status: "pending",
        },
      });
      
      newMemory.recentActions.push(`Suggested moving ${eventToMove} to ${newTime}`);
    } else if (lowerInput.includes("remember") || lowerInput.includes("recall") || lowerInput.includes("memory")) {
      responses.push({
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: `Here's what I remember about you:\n\n**Preferences:**\n${memory.preferences.map(p => `• ${p}`).join('\n')}\n\n**Recent Actions:**\n${memory.recentActions.slice(-3).map(a => `• ${a}`).join('\n')}\n\n**Current Context:**\n${memory.context.map(c => `• ${c}`).join('\n')}`,
        timestamp: new Date(),
      });
    } else {
      responses.push({
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: "I can help you optimize your schedule! Try:\n• \"My priority today is recruiting\"\n• \"My priority is academics\"\n• \"My priority is health\"\n• \"My priority is networking\"\n\nOr ask me to move specific events!",
        timestamp: new Date(),
      });
    }

    setMemory(newMemory);
    return responses;
  };

  // Call OpenAI API for real AI responses with function calling
  const callOpenAI = async (userMessage: string, conversationHistory: Message[]): Promise<{ content: string; actions: CalendarAction[] }> => {
    if (!openaiKey || !openaiKey.startsWith('sk-')) {
      throw new Error('Valid OpenAI API key required');
    }

    // Build conversation history for context (last 10 messages)
    const recentMessages = conversationHistory.slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.type === 'action'
        ? `[Proposed calendar action: ${msg.action?.type} - ${msg.action?.event.title} at ${msg.action?.event.time}]`
        : msg.content
    }));

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are Kaisey, an intelligent MBA Co-Pilot assistant that helps MBA students optimize their schedules.

Current Context:
- Today's date: ${new Date().toISOString().slice(0, 10)}

IMPORTANT RULES:
1. REMEMBER the conversation history. If the user has already provided information (event title, time, duration, recurrence), DO NOT ask for it again.
2. When you have ALL required info (title, time, duration, and for recurring: frequency + duration/count), immediately call the calendar_action function.
3. Always use 24-hour time format (e.g., "18:00" for 6 PM, "09:00" for 9 AM).
4. For RECURRING events, you need: title, start time, session duration, day(s) of week, and how long to repeat (weeks or count).
5. If the user says something like "6pm - 9pm" that means 3 hours (180 minutes) duration starting at 18:00.
6. Create ONLY ONE calendar_action with recurrence parameters, NOT multiple separate events.
7. Once you have all the information, CREATE THE EVENT. Don't keep asking questions.

Example: If user says "Growth Hacking Class, 6pm-9pm, every Tuesday for 4 weeks" - you have everything:
- Title: Growth Hacking Class
- Time: 18:00
- Duration: 180 minutes
- Recurrence: weekly on TU for 4 weeks
→ Call calendar_action immediately!`
            },
            ...recentMessages,
            {
              role: 'user',
              content: userMessage
            }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'calendar_action',
                description: 'Add, remove, or replace a calendar event. For recurring events, use the recurrence parameters instead of creating multiple events.',
                parameters: {
                  type: 'object',
                  properties: {
                    action_type: {
                      type: 'string',
                      enum: ['add', 'remove', 'replace'],
                      description: 'The type of calendar action'
                    },
                    event_title: {
                      type: 'string',
                      description: 'Title of the event'
                    },
                    event_time: {
                      type: 'string',
                      description: 'Time in 24-hour format (HH:MM), e.g., "14:00" for 2 PM'
                    },
                    event_duration: {
                      type: 'number',
                      description: 'Duration in minutes (default 60)'
                    },
                    replace_with_title: {
                      type: 'string',
                      description: 'For replace actions: new event title'
                    },
                    replace_with_time: {
                      type: 'string',
                      description: 'For replace actions: new time in 24-hour format'
                    },
                    replace_with_duration: {
                      type: 'number',
                      description: 'For replace actions: new duration in minutes'
                    },
                    is_recurring: {
                      type: 'boolean',
                      description: 'Whether this is a recurring event'
                    },
                    recurrence_frequency: {
                      type: 'string',
                      enum: ['daily', 'weekly', 'monthly'],
                      description: 'How often the event repeats'
                    },
                    recurrence_days: {
                      type: 'array',
                      items: { type: 'string', enum: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] },
                      description: 'For weekly recurrence: which days (e.g., ["TU", "TH"] for Tuesday and Thursday)'
                    },
                    recurrence_until: {
                      type: 'string',
                      description: 'End date for recurrence in YYYY-MM-DD format'
                    },
                    recurrence_count: {
                      type: 'number',
                      description: 'Number of occurrences (alternative to until date)'
                    }
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

      // Parse function calls if any
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
                  duration: args.event_duration || 60
                }
              };

              if (args.action_type === 'replace' && args.replace_with_title) {
                action.replaceWith = {
                  title: args.replace_with_title,
                  time: args.replace_with_time || args.event_time,
                  duration: args.replace_with_duration || args.event_duration || 60
                };
              }

              // Add recurrence if specified
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
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    setIsTyping(true);
    setApiError(null);

    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // If OpenAI key is available, use real AI
    if (openaiKey && openaiKey.startsWith('sk-')) {
      try {
        // Pass conversation history for context
        const { content, actions } = await callOpenAI(userMessage, messages);

        const newMessages: Message[] = [];

        // Add the AI text response
        if (content) {
          newMessages.push({
            id: (Date.now() + 1).toString(),
            type: "agent",
            content: content,
            timestamp: new Date(),
          });
        }

        // Add action cards for each calendar action
        actions.forEach((action, index) => {
          newMessages.push({
            id: (Date.now() + 2 + index).toString(),
            type: "action",
            content: "",
            timestamp: new Date(),
            action: {
              ...action,
              status: "pending",
            },
          });
        });

        setMessages((prev) => [...prev, ...newMessages]);
        setIsTyping(false);

        // Update memory
        setMemory(prev => ({
          ...prev,
          recentActions: [...prev.recentActions, `AI conversation: ${userMessage.substring(0, 50)}...`]
        }));

      } catch (error) {
        setIsTyping(false);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setApiError(errorMessage);

        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          type: "agent",
          content: `⚠️ OpenAI API Error: ${errorMessage}\n\nFalling back to basic responses. Please check your API key in Settings.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);

        // Fall back to mocked responses after showing error
        setTimeout(() => {
          const newMessages = processUserRequest(userMessage);
          setMessages((prev) => [...prev, ...newMessages.slice(1)]);
        }, 1000);
      }
    } else {
      // Use mocked responses when no API key
      const newMessages = processUserRequest(userMessage);
      
      setTimeout(() => {
        setMessages((prev) => [...prev, ...newMessages.slice(1)]);
        setIsTyping(false);
      }, 800);
    }
  };

  const handleApproveAction = (messageId: string) => {
    // Find the message BEFORE updating state to avoid stale data
    const message = messages.find((m) => m.id === messageId);
    
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.action
          ? { ...msg, action: { ...msg.action, status: "approved" as const } }
          : msg
      )
    );

    if (message?.action && onScheduleChange) {
      const { status, ...actionWithoutStatus } = message.action;
      console.log("Calling onScheduleChange with:", actionWithoutStatus);
      onScheduleChange(actionWithoutStatus);
      
      // Update memory
      setMemory(prev => ({
        ...prev,
        recentActions: [...prev.recentActions, `Approved: ${message.action!.event.title}`],
      }));
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "agent",
          content: "✓ Calendar updated successfully. I've saved this preference for future recommendations.",
          timestamp: new Date(),
        },
      ]);
    }, 500);
  };

  const handleRejectAction = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.action
          ? { ...msg, action: { ...msg.action, status: "rejected" as const } }
          : msg
      )
    );

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "agent",
          content: "Understood. I'll remember this preference. What alternative would work better for you?",
          timestamp: new Date(),
        },
      ]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
                  <div className="text-muted-foreground">{event.time} • {event.duration} min</div>
                  {message.action?.recurrence && (
                    <div className="text-blue-600 mt-1">
                      🔄 Repeats {message.action.recurrence.frequency}
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
                <p className="text-xs font-semibold text-red-600">− Remove from calendar:</p>
                <div className="text-xs bg-white border rounded p-2 opacity-60 line-through">
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-muted-foreground">{event.time} • {event.duration} min</div>
                </div>
              </div>
            )}
            
            {type === "replace" && replaceWith && (
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1">− Current:</p>
                  <div className="text-xs bg-white border rounded p-2 opacity-60">
                    <div className="font-semibold">{event.title}</div>
                    <div className="text-muted-foreground">{event.time} • {event.duration} min</div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1">+ Replace with:</p>
                  <div className="text-xs bg-white border-2 border-green-500 rounded p-2">
                    <div className="font-semibold">{replaceWith.title}</div>
                    <div className="text-muted-foreground">{replaceWith.time} • {replaceWith.duration} min</div>
                  </div>
                </div>
              </div>
            )}
            
            {status === "pending" && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleApproveAction(message.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white h-7 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectAction(message.id)}
                  className="flex-1 h-7 text-xs"
                >
                  Decline
                </Button>
              </div>
            )}
            
            {status === "approved" && (
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold mt-2">
                <Check className="w-3 h-3" />
                Approved & Applied
              </div>
            )}

            {status === "rejected" && (
              <div className="text-xs text-muted-foreground mt-2">
                Declined
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Widget variant (always visible at top)
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
                {openaiKey && openaiKey.startsWith('sk-') && (
                  <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                    AI Active
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">Tell me your priority and I'll optimize your schedule</p>
            </div>
          </div>
        </div>

        {/* Security Warning when API key is active */}
        {openaiKey && openaiKey.startsWith('sk-') && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            <span className="font-semibold">⚠️ Security:</span> Your API key is stored in browser memory. API costs apply.
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., 'Schedule time for valuation case study today'"
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
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
                    ) : (
                      renderActionMessage(message)
                    )}
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
        <div className="fixed bottom-6 right-24 z-50">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
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
                  placeholder="Ask me to adjust your schedule..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
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