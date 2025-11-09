"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function Demo() {
  const { slug } = useParams<{ slug: string }>(); // <-- so holst du den Slug in einer Client-Komponente
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  async function send() {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, message: q }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "assistant", text: data.text ?? "Keine Antwort." }]);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">Praxis-Assistent – Demo ({slug})</h1>

        <div className="rounded-2xl bg-white shadow p-4 space-y-3 h-[60vh] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-gray-500">Stellen Sie eine Frage zur Praxis (Öffnungszeiten, Leistungen, Kontakt …)</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={`inline-block rounded-2xl px-3 py-2 ${
                  m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Frage eingeben…"
            className="flex-1 rounded-xl border px-3 py-2"
          />
          <button onClick={send} className="rounded-xl bg-blue-600 text-white px-4 py-2">
            Senden
          </button>
        </div>
      </div>
    </div>
  );
}

