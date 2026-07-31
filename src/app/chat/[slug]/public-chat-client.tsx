"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Meta = {
  tenantName: string;
  welcomeMessage: string;
  whatsappUrl: string | null;
  hasWhatsapp: boolean;
};

type Msg = { role: "user" | "assistant"; content: string };

function sessionKey(slug: string) {
  return `veluxa_public_chat_${slug}`;
}

export function PublicChatClient({ slug }: { slug: string }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(sessionKey(slug));
      if (stored) setSessionId(stored);
    } catch {
      /* ignore */
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/public-chat/${encodeURIComponent(slug)}`);
      const json = await res.json().catch(() => null);
      if (cancelled) return;
      if (!res.ok) {
        setError(json?.error ?? "Chat indisponível");
        return;
      }
      setMeta(json as Meta);
      if (json.welcomeMessage) {
        setMessages([{ role: "assistant", content: json.welcomeMessage }]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function markHandoff() {
    if (!sessionId) return;
    try {
      await fetch(`/api/public-chat/${encodeURIComponent(slug)}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      /* ignore */
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending || !meta) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await fetch(`/api/public-chat/${encodeURIComponent(slug)}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId ?? undefined, message: text }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              json?.error ??
              "Não foi possível responder agora. Use o WhatsApp para falar com a equipe.",
          },
        ]);
        return;
      }
      if (json.sessionId && json.sessionId !== sessionId) {
        setSessionId(json.sessionId);
        try {
          localStorage.setItem(sessionKey(slug), json.sessionId);
        } catch {
          /* ignore */
        }
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.reply as string },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-2 text-center">
        <p className="font-display text-xl tracking-tight text-[#fafaf9]">{error}</p>
        <p className="mt-2 text-sm text-[#a8a29e]">
          Este link pode estar desativado. Entre em contato com a funerária.
        </p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-[#a8a29e]">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Carregando…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-white/10 pb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#a8a29e]">
          Assistente virtual
        </p>
        <h1 className="font-display mt-1 text-xl tracking-tight text-[#fafaf9] sm:text-2xl">
          {meta.tenantName}
        </h1>
        <p className="mt-1 text-sm text-[#a8a29e]">
          Respostas com base nas informações cadastradas. Valores sujeitos a confirmação.
        </p>
      </header>

      {/* Botão WhatsApp sempre visível — urgências não dependem do chat */}
      {meta.hasWhatsapp && meta.whatsappUrl && (
        <div className="shrink-0 pt-3">
          <a
            href={meta.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void markHandoff()}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full bg-[#25D366] text-[#052e16] hover:bg-[#20bd5a]"
            )}
          >
            <MessageCircle data-icon="inline-start" />
            Falar agora no WhatsApp
          </a>
        </div>
      )}

      <div
        className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain py-1"
        role="log"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed",
              m.role === "user"
                ? "ml-auto bg-[#e7c27a] text-[#0c0a09]"
                : "mr-auto bg-[#1c1917] text-[#fafaf9]"
            )}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="mr-auto flex items-center gap-2 rounded-2xl bg-[#1c1917] px-3.5 py-2.5 text-sm text-[#a8a29e]">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Digitando…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="shrink-0 border-t border-white/10 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Escreva sua pergunta…"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-[#0c0a09] px-3 py-2.5 text-[15px] text-[#fafaf9] outline-none placeholder:text-[#78716c] focus-visible:ring-2 focus-visible:ring-[#e7c27a]/40"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label="Enviar">
            {sending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
