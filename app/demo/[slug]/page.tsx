"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

type Message = { role: "user" | "assistant"; text: string };

/* --- Mapping: Slug → Praxisname --- */
const TENANT_LABELS: Record<string, string> = {
  "hausarzt-painten": "Praxis Dr. Kopfmüller",

  // 👇 weitere Kunden einfach so ergänzen:
  // "praxis-muster": "Praxis Dr. Muster",
};

function getPracticeName(slug: string | undefined) {
  if (!slug) return "Ihrer Praxis";
  return TENANT_LABELS[slug] ?? "Ihrer Praxis";
}

export default function DemoPage() {
  const { slug } = useParams<{ slug: string }>();
  const practiceName = getPracticeName(slug);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  async function send() {
    const q = input.trim();
    if (!q || isSending) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, message: q }),
      });

      if (!res.ok) throw new Error("Fehler bei der Anfrage.");

      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.text ?? "Keine Antwort." },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 lg:py-12">

        {/* --- Header --- */}
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Fusionary AI • Digitaler Assistent
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Digitaler Assistent der {practiceName}
            </h1>

            <p className="mt-2 max-w-xl text-sm text-slate-600">
              KI-gestützter Praxisassistent für Terminfragen, Leistungen,
              Kontakt und mehr – individuell auf die Praxis abgestimmt.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold shadow">
              AI
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm font-medium">Praxis-Assistent</span>
              <span className="text-xs text-emerald-600">Online</span>
            </div>
          </div>
        </header>

        {/* --- Layout: Chat links, Info rechts --- */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">

          {/* --- Chatfenster --- */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-800">
                  Chat mit der Praxis
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Antworten in wenigen Sekunden
              </span>
            </div>

            <div className="flex h-[70vh] flex-col">
              {/* Nachrichten */}
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Stellen Sie eine Frage zur Praxis (Öffnungszeiten,
                    Leistungen, Kontakt, Rezepte …)
                  </p>
                )}

                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Eingabe */}
              <div className="border-t border-slate-200 px-4 py-3">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Frage eingeben…"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={isSending}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSending ? "Senden…" : "Senden"}
                  </button>
                </form>

                <p className="mt-1 text-[10px] text-right uppercase tracking-[0.2em] text-slate-400">
                  Powered by Fusionary AI
                </p>
              </div>
            </div>
          </section>

          {/* --- Rechte Info-Spalte --- */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Was kann dieser Assistent?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Der Assistent beantwortet Patientenfragen basierend auf der
                Praxiswebseite und weiteren Informationen.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                <li>• Entlastet das Praxisteam</li>
                <li>• Einheitliche Antworten, rund um die Uhr</li>
                <li>• Individuell auf jede Praxis trainierbar</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Hinweis
              </h3>
              <p className="mt-2">
                Der Assistent ersetzt keine medizinische Beratung. In akuten
                Fällen sollten Patient:innen direkt den ärztlichen Notdienst
                oder den Rettungsdienst kontaktieren.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
