"use client";
import { useEffect, useRef, useState } from "react";

type EmbedPageProps = {
  params: {
    slug: string;
  };
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function Embed({ params }: EmbedPageProps) {
  const slug = params.slug;

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hallo! Wie kann ich Ihnen helfen?" },
  ]);

  const boxRef = useRef<HTMLDivElement | null>(null);

  async function send() {
    const q = input.trim();
    if (!q || sending) return;

    setInput("");
    setSending(true);
    setMessages((m) => [...m, { role: "user", text: q }]);

    try {
      const res = await fetch(`/api/chat?slug=${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });

      const data = await res.json().catch(() => null);
      const text =
        (data && (data.text as string)) ??
        "Entschuldigung, ich konnte gerade keine Antwort erzeugen.";

      setMessages((m) => [...m, { role: "assistant", text }]);
    } catch (_) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Es ist ein technischer Fehler aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie die Praxis telefonisch.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  // Scroll nach unten + Höhe an den Parent (IONOS) melden
  useEffect(() => {
    if (!boxRef.current) return;
    const el = boxRef.current;

    // immer ganz nach unten scrollen
    el.scrollTop = el.scrollHeight;

    const height = el.scrollHeight + 120; // Input-Bereich grob einrechnen
    try {
      window.parent.postMessage(
        { type: "__widget_height__", height },
        "*"
      );
    } catch {
      // ignore
    }
  }, [messages.length]);

  return (
    <div className="min-h-[420px] w-[360px] max-w-full bg-white text-gray-900 flex flex-col rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b font-semibold text-gray-900">
        Praxis-Assistent
      </div>

      <div
        ref={boxRef}
        className="flex-1 p-3 space-y-3 overflow-y-auto bg-white"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div
              className={`inline-block px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 flex gap-2 border-t bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Frage eingeben…"
          className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="rounded-xl bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-4 text-sm font-medium"
        >
          Senden
        </button>
      </div>
    </div>
  );
}
