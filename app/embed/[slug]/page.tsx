"use client";

import React, { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function EmbedPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hallo! Wie kann ich Ihnen helfen?" },
  ]);
  const [isSending, setIsSending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  async function send() {
    const q = input.trim();

    // 🔍 Debug-Log: sehen wir überhaupt den Klick / Enter?
    console.log("SEND KLICK", { q, slug, isSending });

    // Debug: NICHT mehr früh returnen, damit wir den Log immer sehen
    // if (!q || !slug || isSending) return;

    if (!q) {
      // kleine Rückmeldung im Chat, damit du siehst, dass send() läuft
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Bitte geben Sie eine Frage ein." },
      ]);
      return;
    }
    if (!slug) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Technischer Fehler: Kein Mandanten-Slug vorhanden.",
        },
      ]);
      return;
    }
    if (isSending) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, message: q }),
      });

      let answer =
        "Entschuldigung, ich kann dazu gerade keine Auskunft geben.";

      let data: any = null;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Fehler beim Lesen der Antwort:", err);
      }

      if (!res.ok) {
        if (data?.error) {
          answer =
            "Es ist ein Fehler aufgetreten: " +
            String(data.error) +
            " (Slug: " +
            slug +
            ")";
        } else {
          answer =
            "Es ist ein Fehler aufgetreten (Status " + res.status + ").";
        }
      } else if (data?.text) {
        answer = data.text;
      }

      setMessages((m) => [...m, { role: "assistant", text: answer }]);
    } catch (err) {
      console.error("Chat-Anfrage fehlgeschlagen:", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Es ist ein technischer Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    if (!boxRef.current) return;
    boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="min-h-[420px] w-[360px] max-w-full bg-white text-gray-900 flex flex-col rounded-2xl shadow-xl border overflow-hidden">
      <div className="px-4 py-3 bg-gray-100 border-b font-semibold">
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
          onKeyDown={handleKeyDown}
          placeholder="Frage eingeben…"
          className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          // 🔍 hier KEIN disabled mehr – immer klickbar
          onClick={send}
          className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold"
        >
          Senden
        </button>
      </div>
    </div>
  );
}
