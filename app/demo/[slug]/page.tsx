"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

type Message = { role: "user" | "assistant"; text: string };

export default function DemoPage() {
  const { slug } = useParams<{ slug: string }>();
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

      if (!res.ok) {
        throw new Error("Fehler bei der Anfrage.");
      }

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
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 lg:py-12">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Fusionary AI · Praxis-Assistent
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Digitaler Praxis-Concierge
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              KI-gestützter Praxisassistent für Terminfragen, Leistungen und
              allgemeine Patientenanliegen – optimiert für Ihre Hausarztpraxis.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Aktiver Mandant / Slug:{" "}
              <span className="font-mono text-slate-300">{slug}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/90 text-sm font-semibold text-slate-950">
              PA
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm font-medium">Praxis-Assistent</span>
              <span className="text-xs text-emerald-400">Live · Online</span>
            </div>
          </div>
        </header>

        {/* Main grid: Chat links, Info rechts */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          {/* Chat */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/40 backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-slate-100">
                  Chat mit Praxis-Assistent
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Antworten in wenigen Sekunden
              </span>
            </div>

            {/* Chat-Fenster */}
            <div className="flex h-[70vh] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Stellen Sie eine Frage zur Praxis (Öffnungszeiten,
                    Leistungen, Kontakt, Rezeptbestellung etc.).
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
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-slate-800 text-slate-100"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Eingabebereich */}
              <div className="border-t border-slate-800 px-4 py-3">
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
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    onClick={send}
                    disabled={isSending}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSending ? "Senden..." : "Senden"}
                  </button>
                </form>
                <p className="mt-1 text-[10px] text-right uppercase tracking-[0.2em] text-slate-500">
                  Powered by Fusionary AI
                </p>
              </div>
            </div>
          </section>

          {/* Info-Panel rechts */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Wofür ist dieser Assistent gedacht?
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Der Praxis-Assistent beantwortet Patientenfragen auf Basis der
                Praxis-Website und weiterer hinterlegter Informationen. Ideal
                für Terminorganisation, Öffnungszeiten, Leistungen und
                allgemeine Orientierung.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-400">
                <li>• Entlastung des Praxisteams im Alltag</li>
                <li>• Konsistente Antworten, 24/7 verfügbar</li>
                <li>• Individuell auf jede Praxis trainiert</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Hinweis
              </h3>
              <p className="mt-2">
                Der Assistent ersetzt keine medizinische Beratung. In
                akuten oder lebensbedrohlichen Situationen sollten
                Patient:innen immer direkt den ärztlichen Notdienst oder
                den Rettungsdienst kontaktieren.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}


