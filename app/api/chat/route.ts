import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supaAdmin } from "@/lib/db"; // funktioniert im App Router

// ---- einfache Guardrails:
function checkEmergency(t: string) {
  const x = t.toLowerCase();
  return [
    "brustschmerzen",
    "atemnot",
    "lähmung",
    "starke blutung",
    "bewusstlos",
    "suizid",
    "vergiftung",
    "schlaganfall",
    "herzinfarkt",
  ].some((k) => x.includes(k));
}

function needsMedicalAdviceBlock(t: string) {
  const x = t.toLowerCase();
  return [
    "diagnose",
    "medikament",
    "dosierung",
    "antibiotikum",
    "behandlung",
  ].some((k) => x.includes(k));
}

const EMERGENCY_MSG =
  "Bei akuter Gefahr rufen Sie bitte sofort **112** an. Außerhalb der Sprechzeiten erreichen Sie den ärztlichen Bereitschaftsdienst unter **116 117**.";
const MEDICAL_BLOCK_MSG =
  "Das darf ich hier nicht beurteilen. Gern unterstütze ich bei der Terminvereinbarung in der Praxis.";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function getTenantBySlug(slug: string) {
  const { data, error } = await supaAdmin
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

async function getTenantVariables(tenant_id: string) {
  const { data, error } = await supaAdmin
    .from("tenant_settings")
    .select("variables")
    .eq("tenant_id", tenant_id)
    .single();
  if (error) throw error;
  return data!.variables as any;
}

function systemPrompt(vars: any) {
  return `Rolle:
Sie sind der digitale Praxis-Assistent der ${vars.Praxisname} in ${vars.Ort} (Allgemeinmedizin/Hausarzt).

WICHTIGE REGELN:

- Keine Diagnosen oder Therapieempfehlungen geben. In Notfällen immer auf 112, außerhalb der Sprechzeiten auf den ärztlichen Bereitschaftsdienst 116 117 hinweisen.
- Antworten Sie immer in der höflichen Sie-Form.
- Beginnen Sie direkt mit der relevanten Information – **keine** formellen Briefanreden wie "Sehr geehrte Damen und Herren" und **keine** Abschlussfloskeln wie "Mit freundlichen Grüßen".
- Schreiben Sie kurze, gut lesbare Absätze, passend für einen Chat.

FORMATIERUNG:

- Wenn mehrere Leistungen, Beispiele oder Optionen genannt werden, geben Sie diese als **Markdown-Aufzählung** mit Bindestrich aus, z. B.:
  - Eigenbluttherapie
  - Führerscheinuntersuchungen
  - Raucherentwöhnung
- Öffnungszeiten nach Möglichkeit ebenfalls als Markdown-Liste im Format:
  - Montag: 08:00–12:00, 16:00–17:00
  - Dienstag: ...
- Verwenden Sie nach Möglichkeit keine Sternchen-Markierung (**Text**) für Fett, sondern nur klare Listen und Absätze.

UMGANG MIT FEHLENDEN INFORMATIONEN:

- Wenn Informationen in den Praxisdaten nicht vorhanden sind, sagen Sie das offen.
- Verweisen Sie dann auf die Kontaktmöglichkeit der Praxis und nennen Sie die Telefonnummer ${vars.Kontakt_Tel}.

TERMINANFRAGEN:

- Wenn jemand einen Termin möchte, fragen Sie strukturiert nach:
  - vollständigem Namen
  - Geburtsdatum (TT.MM.JJJJ)
  - Telefonnummer
  - kurzem Anliegen
  - bevorzugtem Zeitraum
  - Einverständnis zur Weitergabe an das Praxisteam

Weitere Hinweise:

- Halten Sie die Antworten präzise und praxisnah.
- Die von der Praxis kommunizierte durchschnittliche Antwortzeit ist: ${vars.Antwortzeit}.`;
}

// sehr einfacher RAG: beste Treffer aus embeddings holen
async function ragSearch(tenant_id: string, query: string, k = 4) {
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: query,
  });
  const q = emb.data[0].embedding;
  const { data, error } = await supaAdmin.rpc("match_embeddings", {
    query_embedding: q,
    match_count: k,
    p_tenant_id: tenant_id,
  });
  if (error) throw error;
  return data as { id: string; content: string; distance: number }[];
}

export async function POST(req: NextRequest) {
  try {
    const { slug, message } = (await req.json()) as {
      slug: string;
      message: string;
    };
    if (!slug || !message)
      return NextResponse.json(
        { error: "slug & message required" },
        { status: 400 },
      );

    const tenant = await getTenantBySlug(slug);
    const vars = await getTenantVariables(tenant.id);

    if (checkEmergency(message)) {
      return NextResponse.json({
        text: `${EMERGENCY_MSG}\n\nWie kann ich organisatorisch helfen (Termin, Öffnungszeiten, Kontakt)?`,
      });
    }
    if (needsMedicalAdviceBlock(message)) {
      return NextResponse.json({
        text: `${MEDICAL_BLOCK_MSG} Möchten Sie eine Terminanfrage stellen?`,
      });
    }

    const matches = await ragSearch(tenant.id, message, 4);
    const kb = matches.map((m) => `- ${m.content}`).join("\n");
    const system = systemPrompt(vars);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Nutzerfrage:\n"""${message}"""\n\nPraxiswissen (Markdown-Stichpunkte):\n${kb}\n\nFormulieren Sie eine direkte Chat-Antwort entsprechend der obigen Regeln.`,
        },
      ],
    });

    const text =
      completion.choices[0]?.message?.content ??
      "Entschuldigung, dazu habe ich gerade keine Auskunft.";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "server error" },
      { status: 500 },
    );
  }
}
