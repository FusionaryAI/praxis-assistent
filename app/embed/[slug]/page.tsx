"use client";
import { useEffect, useRef, useState } from "react";

export default function Embed({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role:"user"|"assistant"; text:string}[]>([
    { role: "assistant", text: "Hallo! Wie kann ich Ihnen helfen?" }
  ]);
  const boxRef = useRef<HTMLDivElement>(null);

  async function send() {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMessages(m => [...m, { role:"user", text:q }]);

    const res = await fetch("/api/chat", {
      method:"POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ slug, message:q })
    });
    const data = await res.json();
    setMessages(m => [...m, { role:"assistant", text: data.text ?? "…" }]);
  }

  // iFrame passt Höhe automatisch an
  useEffect(() => {
    const h = boxRef.current?.scrollHeight ?? 500;
    window.parent.postMessage({ type:"__widget_height__", height:h }, "*");
  }, [messages]);

  return (
    <div className="min-h-[420px] w-[360px] max-w-full bg-white text-gray-900 flex flex-col rounded-2xl shadow-xl border overflow-hidden">
      <div className="px-4 py-3 bg-gray-100 border-b font-semibold">Praxis-Assistent</div>

      <div ref={boxRef} className="flex-1 p-3 space-y-3 overflow-y-auto">
        {messages.map((m,i)=>(
          <div key={i} className={m.role==="user"?"text-right":"text-left"}>
            <div className={`inline-block px-3 py-2 rounded-2xl ${m.role==="user"?"bg-blue-600 text-white":"bg-gray-100"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 flex gap-2 border-t">
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && send()}
          placeholder="Frage eingeben…"
          className="flex-1 rounded-xl border px-3 py-2"
        />
        <button onClick={send} className="rounded-xl bg-blue-600 text-white px-4">Senden</button>
      </div>
    </div>
  );
}
