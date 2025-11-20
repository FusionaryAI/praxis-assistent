"use client";
import { useEffect, useRef, useState } from "react";

export default function Embed({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([{ role: "assistant", text: "Hallo! Wie kann ich Ihnen helfen?" }]);

  const boxRef = useRef<HTMLDivElement>(null);

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
    setMessages((m) => [
      ...m,
      { role: "assistant", text: data.text ?? "…" },
    ]);
  }

  // Höhe an Elternseite melden
  useEffect(() => {
    const h = boxRef.current?.scrollHeight ?? 600;
    window.parent.postMessage({ type: "__widget_height__", height: h }, "*");
  }, [messages]);

  return (
    <div
      className="w-[360px] max-w-full bg-white text-gray-900 
      flex flex-col rounded-2xl shadow-xl border border-gray-200 
      overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 font-semibold text-lg">
        Praxis-Assistent
      </div>

      {/* Chatbereich */}
      <div
        ref={boxRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto bg-white"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div
              className={`inline-block px-4 py-2 rounded-2xl leading-relaxed
              ${
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

      {/* Eingabe */}
      <div className="p-3 flex gap-2 border-t border-gray-200 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Frage eingeben…"
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2
          focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={send}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 
          text-white px-5 py-2 font-medium transition"
        >
          Senden
        </button>
      </div>
    </div>
  );
}
