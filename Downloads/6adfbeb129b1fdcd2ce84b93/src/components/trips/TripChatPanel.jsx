import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eraser, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AssistantComposer from "@/components/trips/assistant/AssistantComposer";
import AssistantIntro from "@/components/trips/assistant/AssistantIntro";
import AssistantMessage from "@/components/trips/assistant/AssistantMessage";
import ResizeHandle from "@/components/trips/assistant/ResizeHandle";
import ThinkingBubble from "@/components/trips/assistant/ThinkingBubble";
import UserBubble from "@/components/trips/assistant/UserBubble";
import { applyTripChange, askTripAi, clearTripChat } from "@/lib/server-fns";

const PANEL_MIN = 340;
const PANEL_MAX = 780;
const PANEL_DEFAULT = 448;
const PANEL_KEY = "assistant-panel-width";

// The assistant lives beside the plan: every answer is stored on the trip's
// ai_log, so the conversation is still there when the traveller comes back.
export default function TripChatPanel({ trip, onUpdated, disabled }) {
  const ask = useServerFn(askTripAi);
  const apply = useServerFn(applyTripChange);
  const clear = useServerFn(clearTripChat);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(null);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState("");
  const [typedKey, setTypedKey] = useState(null);
  const [width, setWidth] = useState(PANEL_DEFAULT);
  const endRef = useRef(null);
  const log = trip.ai_log || [];
  const busy = Boolean(pending);

  // The chosen width belongs to the traveller, so it is remembered.
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(PANEL_KEY));
    if (saved) setWidth(Math.min(PANEL_MAX, Math.max(PANEL_MIN, saved)));
  }, []);

  const rememberWidth = () => window.localStorage.setItem(PANEL_KEY, String(width));

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [open, log.length, notices.length, pending]);

  async function run(kind) {
    const text = question.trim();
    if (!text || busy) return;
    setError("");
    setQuestion("");
    setPending({ text, kind });
    try {
      if (kind === "apply") {
        const result = await apply({ data: { id: trip.id, instruction: text } });
        setNotices((current) => [
          ...current,
          {
            id: `notice-${Date.now()}`,
            question: text,
            answer: "Done — your plan now reflects that. Scroll back up to see the rewritten days.",
          },
        ]);
        onUpdated?.(result.trip);
      } else {
        const result = await ask({ data: { id: trip.id, question: text } });
        const entries = result?.trip?.ai_log || [];
        setTypedKey(entries.length ? entries[entries.length - 1].asked_at : null);
        onUpdated?.(result.trip);
      }
    } catch (err) {
      setError(err?.message || "The assistant could not answer just now.");
      setQuestion(text);
    } finally {
      setPending(null);
    }
  }

  async function clearChat() {
    if (!window.confirm("Clear this conversation? Your trip plan stays exactly as it is.")) return;
    setError("");
    setNotices([]);
    setTypedKey(null);
    setPending(null);
    const updated = await clear({ data: { id: trip.id } });
    onUpdated?.(updated);
  }

  return (
    <>
      <Button variant="outline" className="rounded-full" onClick={() => setOpen(true)}>
        <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
        Ask the assistant
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          style={{ "--panel-width": `${width}px` }}
          className="flex w-full max-w-none flex-col gap-0 bg-background/95 p-0 backdrop-blur md:w-[var(--panel-width)]"
        >
          <ResizeHandle
            width={width}
            min={PANEL_MIN}
            max={PANEL_MAX}
            onResize={setWidth}
            onResizeEnd={rememberWidth}
          />
          <SheetHeader className="border-b border-border/70 p-4 pr-12 text-left">
            <SheetTitle className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-foreground" aria-hidden="true" />
              </span>
              Trip assistant
            </SheetTitle>
            <SheetDescription>
              Ask anything, or have the plan rewritten. Answers stay with this trip.
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-1.5">
            <span className="text-xs text-foreground/50">
              {log.length ? `${log.length} message${log.length === 1 ? "" : "s"} in this chat` : "New conversation"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-xs text-foreground/70"
              onClick={clearChat}
              disabled={!log.length || busy}
            >
              <Eraser className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Clear chat
            </Button>
          </div>

          <div className="scroll-container flex-1 space-y-5 overflow-y-auto px-4 py-5">
            {log.length === 0 && !pending && <AssistantIntro onPick={setQuestion} />}

            {log.map((entry) => (
              <AssistantMessage
                key={entry.asked_at}
                question={entry.question}
                answer={entry.answer}
                animate={entry.asked_at === typedKey}
              />
            ))}

            {notices.map((notice) => (
              <AssistantMessage key={notice.id} question={notice.question} answer={notice.answer} animate />
            ))}

            {pending && (
              <div className="space-y-2">
                <UserBubble>{pending.text}</UserBubble>
                <ThinkingBubble kind={pending.kind} />
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <AssistantComposer
            value={question}
            onChange={setQuestion}
            onAsk={() => run("ask")}
            onRewrite={() => run("apply")}
            busy={busy}
            disabled={disabled}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}