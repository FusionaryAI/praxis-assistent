"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function Embed({ params }: { params: { slug: string } }) {
  // 1) Slug sicher bestimmen
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    // Versuch 1: aus URL-Query (?slug=...)
    if (typeof window !== "undefined") {
      const fromQuery =
        new URLSearchParams(window.location.search).get("slug");
      if (fromQuery && fromQuery.trim()) {
        setSlug(fromQuery.trim());
        return;
      }
    }

    // Versuch 2: aus der Route /embed/[slug]
    if (params.slug) {
      setSlug(params.slug);
      return;
    }

    // Fallback (zur Sicherheit – hier kannst du im Zweifel hart codieren)
    setSlug("hausarzt-painten");
  }, [params.slug]);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hallo! Wie kann ich Ihnen helfen?" },
  ]);
  const [pending, setPending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  async function send() {
    const q = input.trim();
    if (!q || !slug || pending) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setPending(true);

    try {
      const res = await fetch(
        // absolut, damit IMMER praxis-assistent.vercel.app getroffen wird
        `https://praxis-assistent.vercel.app/api/chat?slug=${encodeURIComponent(
          slug
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, message: q }),
        }
      );

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // nichts – wir behandeln den Fehler unten
      }

      if (!res.ok || data?.error) {
        const errText =
          data?.error ??
          "Technischer Fehler. Bitte versuchen Sie es später erneut.";
        setMessages((m) => [
          ...m,
          { role: "assistant", text: String(errText) },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text:
              typeof data.text === "string" && data.text.trim()
                ? data.text
                : "Entschuldigung, ich konnte dazu keine Antwort erzeugen.",
          },
        ]);
      }
    } catch (e) {
      console.error("Chat-Request fehlgeschlagen:", e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Technischer Fehler bei der Verbindung. Bitte prüfen Sie Ihre Internetverbindung oder versuchen Sie es später erneut.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  // iFrame-Höhe anpassen
  useEffect(() => {
    const h = boxRef.current?.scrollHeight ?? 500;
    window.parent.postMessage({ type: "__widget_height__", height: h }, "*");
  }, [messages]);

  // Solange der Slug noch nicht bestimmt ist, kleines Loading
  if (!slug) {
    return (
      <div className="min-h-[420px] w-[360px] max-w-full bg-white text-gray-900 flex flex-col rounded-2xl shadow-xl border overflow-hidden">
        <div className="px-4 py-3 bg-gray-100 border-b font-semibold">
          Praxis-Assistent
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Assistent wird geladen …
        </div>
      </div>
    );
  }

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
          disabled={pending || !slug}
          className={`rounded-xl px-4 text-white ${
            pending || !slug
              ? "bg-blue-400 cursor-not-allowed opacity-60"
              : "bg-blue-600"
          }`}
        >
          {pending ? "…" : "Senden"}
        </button>
      </div>
    </div>
  );
}
