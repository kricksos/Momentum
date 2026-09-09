"use client";

import { Bot, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const suggestions = [
  "¿Qué entreno hoy?",
  "Explícame mi plan",
  "¿Cómo va mi progreso?",
  "¿Qué me recomiendas para comer hoy?",
  "¿Qué puedo cambiar en mi dieta?",
];

export function AssistantChat() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
    });
  }, [messages, input, isLoading, error, isOpen]);

  async function sendMessage(event?: FormEvent, suggestedMessage?: string) {
    event?.preventDefault();
    const content = (suggestedMessage ?? input).trim();
    if (!content || isLoading) return;
    setInput("");
    setError(null);
    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setIsLoading(true);

    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, history: messages.slice(-10) }),
    });
    const data = await response.json().catch(() => ({}));
    setIsLoading(false);
    if (!response.ok) {
      setError(data.error ?? "No he podido responder ahora.");
      return;
    }
    setMessages([...nextMessages, { role: "assistant", content: data.answer }]);
  }

  return (
    <>
      {isOpen ? (
        <section className="fixed bottom-5 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[380px] translate-y-0 flex-col overflow-hidden rounded-[30px] border border-[#dfe7d7] bg-[rgba(247,245,239,0.9)] shadow-[0_30px_90px_rgba(17,24,20,0.22)] backdrop-blur-xl ring-1 ring-white/50 transition-all duration-300 ease-out sm:right-5">
          <header className="flex items-center justify-between border-b border-[#dfe7d8] bg-[radial-gradient(circle_at_top_left,_rgba(217,245,111,0.2),_transparent_35%),linear-gradient(135deg,_#1b2724_0%,_#17211f_100%)] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-[18px] bg-gradient-to-br from-[#d9f56f] via-[#edf9be] to-[#bfe7ff] text-[#18231f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_28px_rgba(201,225,127,0.4)]">
                <Bot size={18} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold tracking-[-0.02em]">Asistente Momentum</p>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d9f56f] shadow-[0_0_12px_rgba(217,245,111,0.9)]" />
                </div>
                <p className="text-[11px] text-[#b9c2b7]">Tu coach personal en tiempo real</p>
              </div>
            </div>
            <button type="button" aria-label="Cerrar asistente" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-[#c8d0c5] transition-colors duration-200 hover:bg-white/10 hover:text-white"><X size={18} /></button>
          </header>

          <div ref={scrollContainerRef} aria-live="polite" className="max-h-[min(55vh,420px)] space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(217,245,111,0.18),_transparent_38%)] p-4">
            {messages.length === 0 ? (
              <div className="rounded-[22px] border border-[#dfe6d8] bg-white/80 p-4 shadow-[0_10px_22px_rgba(24,35,31,0.04)] backdrop-blur-sm">
                <p className="text-sm leading-6 text-[#364238]">Estoy aquí para ayudarte con tu entrenamiento, nutrición y progreso.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => sendMessage(undefined, suggestion)} className="rounded-full border border-[#d3dbcf] bg-[#f5f8f2] px-3 py-2 text-[11px] font-semibold text-[#536057] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#edf3e7]">
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-[22px] px-3 py-2.5 text-sm leading-6 tracking-[-0.01em] transition-all duration-200 ${message.role === "user" ? "ml-auto bg-[#1b2724] text-white shadow-[0_14px_24px_rgba(27,39,36,0.18)]" : "bg-white text-[#364238] shadow-[0_10px_18px_rgba(24,35,31,0.04)]"}`}>
                {message.content}
              </div>
            ))}

            {isLoading ? (
              <div className="w-fit rounded-[22px] bg-white px-3 py-2.5 text-sm text-[#819078] shadow-[0_10px_18px_rgba(24,35,31,0.04)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#8ba35d]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#8ba35d] [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#8ba35d] [animation-delay:240ms]" />
                </span>
              </div>
            ) : null}

            {error ? <p className="rounded-[18px] bg-[#f8edd9] px-3 py-2 text-xs text-[#7a5326] shadow-[0_10px_18px_rgba(24,35,31,0.04)]">{error}</p> : null}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#dfe6d8] bg-white/80 p-3 backdrop-blur-sm">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe tu pregunta..." className="min-w-0 flex-1 rounded-[18px] border border-[#d3dbcf] bg-[#f7f8f5] px-3 py-2.5 text-sm text-[#1b2724] shadow-inner outline-none transition-all duration-200 placeholder:text-[#7d867e] focus:border-[#80914d] focus:bg-white" />
            <button type="submit" disabled={!input.trim() || isLoading} aria-label="Enviar mensaje" className="grid size-10 shrink-0 place-items-center rounded-[18px] bg-[#1b2724] text-white shadow-[0_12px_24px_rgba(27,39,36,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(27,39,36,0.24)] disabled:opacity-40">
              <Send size={16} />
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full border border-[#d9f56f]/80 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.8),_transparent_30%),linear-gradient(135deg,_#d9f56f_0%,_#eff9b7_45%,_#dfeaff_100%)] px-4 py-3 text-sm font-semibold text-[#18231f] shadow-[0_18px_42px_rgba(24,35,31,0.22),0_0_0_1px_rgba(255,255,255,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_22px_56px_rgba(24,35,31,0.28)]"
          aria-label="Abrir asistente Momentum"
        >
          <span className="grid size-8 place-items-center rounded-full bg-[#18231f] text-[#f6f7f4] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Bot size={16} />
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} />
            Asistente
          </span>
        </button>
      )}
    </>
  );
}
