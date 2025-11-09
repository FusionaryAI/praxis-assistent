import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supaAdmin } from "@/lib/db"; // funktioniert im App Router
// ---- einfache Guardrails:
function checkEmergency(t: string) {
  const x = t.toLowerCase();
  return ["brustschmerzen","atemnot","lähmung","starke blutung","bewusstlos","suizid","vergiftung","schlaganfall","herzinfarkt"].some(k=>x.includes(k));
}
function needsMedicalAdviceBlock(t: string) {
  const x = t.toLowerCase();
  return ["diagnose","medikament","dosierung","antibiotikum","behandlung"].some(k=>x.includes(k));
}
const EMERGENCY_MSG = "Bei akuter Gefahr rufen Sie bitte sofort **112** an. Außerhalb der Sprechzeiten erreichen Sie den ärztlichen Bereitschaftsdienst unter **116 117**.";
const MEDICAL_BLOCK_MSG = "Das darf ich hier nicht beurteilen. Gern unterstütze ich bei der Terminvereinbarung in der Praxis.";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function getTenantBySlug(slug: string) {
  const { data, error } = await supaAdmin.from("tenants").select("*").eq("slug", slug).single();
  if (error) throw error;
  return data;
}
async function getTenantVariables(tenant_id: string) {
  const { data, error } = await supaAdmin.from("tenant_settings").select("variables").eq("tenant_id", tenant_id).single();
  if (error) throw error;
  return data!.variables as any;
}
function systemPrompt(vars: any) {
  return `Rolle:
Sie sind der digitale Praxis-Assistent der ${vars.Praxisname} in ${vars.Ort} (Allgemeinmedizin/Hausarzt).
Keine Diagnosen/Therapieempfehlungen. Notfall: 112, Bereitschaftsdienst: 116 117.
Ton: höflich, Sie-Form, kurze Absätze. Fehlt Info: ehrlich sagen + Kontakt (${vars.Kontakt_Tel}). Terminaufnahme: Name, Geburtsdatum (TT.MM.JJJJ), Telefon, Anliegen, Zeitfenster, Einverständnis. Antwortzeit: ${vars.Antwortzeit}.`;
}

// sehr einfacher RAG: beste Treffer aus embeddings holen
async function ragSearch(tenant_id: string, query: string, k = 4) {
  const emb = await openai.embeddings.create({ model: "text-embedding-3-large", input: query });
  const q = emb.data[0].embedding;
  const { data, error } = await supaAdmin.rpc("match_embeddings", {
    query_embedding: q, match_count: k, p_tenant_id: tenant_id
  });
  if (error) throw error;
  return data as { id: string; content: string; distance: number }[];
}

export async function POST(req: NextRequest) {
  try {
    const { slug, message } = await req.json() as { slug: string; message: string };
    if (!slug || !message) return NextResponse.json({ error: "slug & message required" }, { status: 400 });

    const tenant = await getTenantBySlug(slug);
    const vars = await getTenantVariables(tenant.id);

    if (checkEmergency(message)) {
      return NextResponse.json({ text: `${EMERGENCY_MSG}\n\nWie kann ich organisatorisch helfen (Termin, Öffnungszeiten, Kontakt)?` });
    }
    if (needsMedicalAdviceBlock(message)) {
      return NextResponse.json({ text: `${MEDICAL_BLOCK_MSG} Möchten Sie eine Terminanfrage stellen?` });
    }

    const matches = await ragSearch(tenant.id, message, 4);
    const kb = matches.map(m => `- ${m.content}`).join("\n");
    const system = systemPrompt(vars);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Nutzerfrage: """${message}"""\n\nPraxiswissen:\n${kb}` }
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "Entschuldigung, dazu habe ich gerade keine Auskunft.";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status: 500 });
  }
}
