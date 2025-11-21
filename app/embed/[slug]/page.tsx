"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type EmbedPageProps = {
  params: { slug: string };
};

export default function Embed({ params }: EmbedPageProps) {
  // Slug aus der URL (App Router) + Fallback über Query-Parameter
  const [slug, setSlug] = useState<string>(params.slug || "");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hallo! Wie kann ich Ihnen helfen?" },
  ]);

  const boxRef = useRef<HTMLDivElement | null>(null);

  // Fallback: falls params.slug aus irgendeinem Grund leer ist,
  // probieren wir, ihn aus der URL (search params) zu holen.
  useEffect(() => {
    if (!slug && typeof window !== "undefined") {
      const qSlug =
        new URLSearchParams(window.location.search).get("slug") || "";
      if (qSlug) {
        setSlug(qSlug);
      }
    }
  }, [slug]);

  async function send() {
    const q = input.trim();
    if (!q) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);

    // Wenn slug fehlt, direkt eine verständliche Fehlermeldung anzeigen
    if (!slug) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Technischer Hinweis: Für diesen Chat ist kein Praxis-Mandant (Slug) hinterlegt.",
        },
      ]);
      return;
    }

    try {
      const payload = { slug, message: q };

      console.log("→ Sende an /api/chat", payload);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();

      console.log("← Antwort von /api/chat", res.status, data);

      const answer =
        data.text ??
        data.error ??
        "Entschuldigung, ich konnte gerade keine Antwort erzeugen.";

      setMessages((m) => [...m, { role: "assistant", text: answer }]);
    } catch (e: any) {
      console.error("Chat-Fehler", e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Entschuldigung, es ist ein technischer Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        },
      ]);
    }
  }

  // Höhe an das Iframe melden (für das Widget auf der Kundenseite)
  useEffect(() => {
    const h = boxRef.current?.scrollHeight ?? 500;
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage(
        { type: "__widget_height__", height: h },
        "*",
      );
    }
  }, [messages]);

  return (
    <div className="min-h-[420px] w-[360px] max-w-full bg-white text-gray-900 flex flex-col rounded-2xl shadow-xl border overflow-hidden">
      <div className="px-4 py-3 bg-gray-100 border-b font-semibold">
        Praxis-Assistent
      </div>

      <div ref={boxRef} className="flex-1 p-3 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block px-3 py-2 rounded-2xl ${
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

      <div className="p-2 flex gap-2 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Frage eingeben…"
          className="flex-1 rounded-xl border px-3 py-2"
        />
        <button
          onClick={send}
          className="rounded-xl bg-blue-600 text-white px-4"
        >
          Senden
        </button>
      </div>
    </div>
  );
}
