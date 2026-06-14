"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";
import type { Founder } from "@/lib/kpi-engine";

interface AIChatProps {
  founderRole: string;
  founders: Founder[];
}

export function AIChat({ founderRole, founders }: AIChatProps) {
  const [input, setInput] = useState("");

  const foundersContext = useMemo(() => JSON.stringify(founders), [founders]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { founderRole, foundersContext },
      }),
    [founderRole, foundersContext]
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          KPI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
        >
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8 space-y-2">
              <p>
                I can help you define fair and measurable KPIs for the{" "}
                <strong>{founderRole || "founder"}</strong> role.
              </p>
              <p>Try asking:</p>
              <ul className="space-y-1 text-xs">
                <li>&quot;What KPIs should a CTO track?&quot;</li>
                <li>&quot;How do I measure product-market fit?&quot;</li>
                <li>&quot;Is the current equity split fair?&quot;</li>
                <li>&quot;What KPIs am I missing?&quot;</li>
              </ul>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`text-sm ${
                message.role === "user"
                  ? "ml-8 bg-primary/10 rounded-lg p-3"
                  : "mr-4 bg-muted rounded-lg p-3"
              }`}
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {message.role === "user" ? "You" : "AI Assistant"}
              </p>
              <div className="whitespace-pre-wrap">
                {message.parts.map((part, i) =>
                  part.type === "text" ? <span key={i}>{part.text}</span> : null
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-pulse">Thinking...</div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about KPIs, fairness, equity..."
            disabled={isLoading}
          />
          <Button type="submit" size="sm" disabled={isLoading || !input}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
