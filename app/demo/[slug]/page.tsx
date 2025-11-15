"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function Demo() {
  const { slug } = useParams<{ slug: string }>();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);

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
    const text = data.text ?? "Keine Antwort.";

    setMessages((m) => [...m, { role: "assistant", text }]);
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">Chat mit der Praxis</h1>

        <div className="rounded-2xl bg-gray-50 shadow p-4 space-y-3 h-[60vh] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-gray-500">
              Stellen Sie eine Frage zur Praxis (Öffnungszeiten, Leistungen,
              Kontakt …)
            </p>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={`inline-block rounded-2xl px-3 py-2 whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      li: ({ children }) => (
                        <li className="list-disc ml-6">{children}</li>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc ml-4 space-y-1">{children}</ul>
                      ),
                      p: ({ children }) => <p className="mb-2">{children}</p>,
                    }}
                  >
                    {m.text}
                  </ReactMarkdown>
                ) : (
                  m.text
                )}
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
          <button
            onClick={send}
            className="rounded-xl bg-green-600 text-white px-4 py-2"
          >
            Senden
          </button>
        </div>
      </div>
    </div>
  );
}
