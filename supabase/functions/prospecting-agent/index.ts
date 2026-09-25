import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { refuseUnlessAgentCall } from "../_shared/agent-guard.ts";

// Agent 06 — Prospecting Agent
// Finds businesses that could use MoCreative Concept's services, records how
// to reach them and what to pitch, and drafts a first message for strong
// fits. It NEVER sends anything: results go to public.prospects (not
// public.leads, which the Screening Agent emails automatically). The founder
// reviews, sets status 'Approved', and sends by hand.
//
// WHERE LEADS COME FROM: Claude's web search tool (no Google billing needed).
// Search terms and their category live in public.prospect_queries; edit rows
// there to change targeting. Each run takes the QUERIES_PER_RUN
// least-recently-run active queries. Only facts seen in search results are
// stored, each with its source URL; nothing is guessed.
//
// SECTOR RUNS: POST {"sector": "Education"} to search only that sector's
// active queries and draft only that sector's prospects. No body (the cron)
// keeps the normal rotation across all sectors.
//
// WHAT TO PITCH (references/outreach-playbook.md in the AIOS workspace; keep
// the two in step). Having a website is not the same as having one that
// works, so every business's own site is fetched and read first:
//   no website found                        -> Product Design (a website)
//   site shows a problem (placeholder page,
//     no admissions/booking path, CTA that
//     goes to the contact page, template
//     text left in, no mobile viewport)     -> Product Design (a redesign)
//   site works and has a path to act        -> AI Automation (the AI audit)
//   site blocked or unreachable             -> AI Automation, no site claims
// What was seen is stored in site_findings and becomes the draft's personal
// line; nothing else about the business is claimed.
// HOW TO REACH (contact_channel, best first): email, phone (drafted as a
// WhatsApp message), social (Instagram/Facebook DM), none (not drafted).
//
// SCORING (rules, documented — adjust here if the ICP changes):
//   website none_found +3, site problem seen +3, working site +1, unknown +1
//   email +2, phone +2, social +1        (reachability matters most)
//   sector Education +2; Healthcare / Real estate / Logistics +1
//   no way to contact at all -> 0
//
// COST GUARD: web search is metered (about $0.01 per search plus tokens).
// MAX_SEARCHES_PER_QUERY x QUERIES_PER_RUN caps searches per run.
//
// SECRETS REQUIRED: ANTHROPIC_API_KEY.

const QUERIES_PER_RUN = 2;
const MAX_SEARCHES_PER_QUERY = 5;
const DRAFT_MIN_SCORE = 4;  // 4 lets phone-only businesses (the common Lagos case) get a WhatsApp draft
const MAX_DRAFTS_PER_RUN = 15;
const MODEL = "claude-haiku-4-5-20251001";
const INBOX = "hello@mocreativeconcept.com";

type Found = {
  name?: string;
  website?: string | null;
  website_status?: "found" | "none_found" | "unknown";
  phone?: string | null;
  email?: string | null;
  social_url?: string | null;
  address?: string | null;
  source_urls?: string[];
};

const SEARCH_SYSTEM = `You research small businesses in Lagos, Nigeria for a sales prospect list.
Use web search to find up to 10 real, currently operating businesses matching the request.
For each, look for its own website, a phone number, an email address and an Instagram or
Facebook page. Business directories and social profiles are acceptable sources.

Rules:
- Only report facts you actually saw in search results. Never guess or construct a phone
  number, email or URL. Use null when not found.
- website_status: "found" if you found the business's own website; "none_found" if you
  searched and it only appears on directories or social media; "unknown" if unsure.
- A social media page is not a website.
- source_urls: the pages where you saw the details.
Reply with ONLY a JSON array, no prose, no markdown fences:
[{"name":"","website":null,"website_status":"unknown","phone":null,"email":null,"social_url":null,"address":null,"source_urls":[]}]`;

const LIMITS = { email: "about 100 words", whatsapp: "under 70 words", social_dm: "under 60 words" };

// How each sector is addressed, what the audit looks at, and what a working
// website must let a visitor do.
const SECTORS: Record<string, { plural: string; examples: string; action: RegExp; path: string }> = {
  Education: { plural: "schools", examples: "admissions enquiries, fee reminders, parent messages, report cards", action: /admission|apply|enrol|application|register/i, path: "admissions page or application form" },
  Healthcare: { plural: "clinics and hospitals", examples: "appointment reminders, patient enquiries, follow-ups", action: /appointment|book|schedule|consult/i, path: "appointment booking page" },
  Logistics: { plural: "logistics companies", examples: "delivery status enquiries, dispatch updates, customer messages", action: /track|quote|pickup|pick-up|book|ship/i, path: "tracking, quote or booking page" },
  "Real estate": { plural: "real estate firms", examples: "property enquiries, viewing bookings, tenant messages", action: /listing|propert|viewing|inspection|enquir|inquir/i, path: "listings or viewing request page" },
};
const OTHER_SECTOR = { plural: "businesses", examples: "customer enquiries, bookings, follow-ups", action: /book|order|enquir|inquir|quote|appointment/i, path: "booking or enquiry page" };
const sectorOf = (s: string) => SECTORS[s] ?? OTHER_SECTOR;

// The founder's approved templates (25 Sep 2026). Only the personal line and
// the sector words change between messages.
const draftSystem = (channel: "email" | "whatsapp" | "social_dm", sector: string) => {
  const s = sectorOf(sector);
  const signoff = `Adedamola\nMoCreative Concept · ${INBOX}`;
  const ps = `P.S. I used AI to help find ${s.plural} and draft this note. I read and send every message myself.`;
  return `You draft a first outreach message from Adedamola, founder of MoCreative Concept.
Use the approved template for the pillar you are given, word for word, changing only the
parts in {braces}.

THE PERSONAL LINE: one sentence built ONLY from "Seen on their site" in the facts you
receive. Name one concrete thing (for Product Design, the website problem; for AI
Automation, something like an admissions window, an online application or a portal).
If there is nothing there, write: "I came across {Business} while looking at ${s.plural} in Lagos."
Never add anything you were not given.

AI AUTOMATION template:
Subject: A short AI audit for {Business}

Hi {Business} team,

I'm Adedamola, founder of MoCreative Concept, a design and AI automation practice in Lagos. {Personal line}

I run a short AI audit for ${s.plural}. I spend time with your admin team, map where the hours go on repeat work (${s.examples}), and hand you a written report with one change you can make straight away.

If that sounds useful, I can send a one-page outline of how it works and what it costs.

${signoff}

${ps}

PRODUCT DESIGN template:
Subject: {a short subject naming the website issue, or "A website for {Business}" if they have none}

Hi {Business} team,

I'm Adedamola, founder of MoCreative Concept, a design and AI automation practice in Lagos. {Personal line}

I design and build websites for ${s.plural} made to turn visits into enquiries: a clear ${s.path}, an online form, and pages that load fast on a phone.

If that sounds useful, I can send a one-page outline of how it works and what it costs.

${signoff}

${ps}

Rules:
- Never claim experience, clients or results ("I work with...", "I've seen...").
- Never describe how the business runs internally. Never say or imply anything is free, and never state a price.
- Never mention school management software.
- No emojis, no em dashes, no hype.${channel === "email" ? "" : `
- This is a ${channel === "whatsapp" ? "WhatsApp message" : "Instagram/Facebook direct message"}: no subject line, no greeting line of its own, ${LIMITS[channel]}. Keep the introduction, the personal line, the offer in one sentence, the question about the outline, the AI note in one short sentence, and sign "Adedamola, MoCreative Concept".`}
Return only the message text${channel === "email" ? ", starting with the Subject line" : ""}.`;
};

// Sources that are directories or social networks, never the business's own site.
const NOT_OWN_SITE = /(^|\.)(wikipedia\.org|wikidata\.org|facebook\.com|instagram\.com|linkedin\.com|x\.com|twitter\.com|tiktok\.com|youtube\.com|google\.[a-z.]+|nigeriaprivateschools\.com|schoolscompass\.com\.ng|businesslist\.com\.ng|nigeriapropertycentre\.com|crunchbase\.com|clutch\.co|contactout\.com|synctrack\.io|businessconnect\.com\.ng|vconnect\.com|finelib\.com|nairaland\.com)$/i;
const GENERIC_NAME_WORDS = new Set(["school", "schools", "international", "college", "group", "lagos", "lekki", "ikeja", "limited", "hospital", "clinic", "clinics", "dental", "logistics", "real", "estate", "the", "and", "services"]);
const FREEMAIL = /@(gmail|yahoo|hotmail|outlook|live|icloud)\./i;
const validEmail = (e?: string | null) =>
  !!e && /^[^\s@[\]<>()]+@[^\s@[\]<>()]+\.[a-z]{2,}$/i.test(e) && !/protected|example\.|sentry|wixpress|\.(png|jpe?g|gif|webp|svg)$/i.test(e);

// The business's own site: the website the search reported, or a source URL
// on a non-directory host that carries a distinctive word from the name.
function ownSite(b: Found, name: string): string | null {
  const w = clean(b.website);
  if (w) return w.startsWith("http") ? w : `https://${w}`;
  const words = name.toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length >= 4 && !GENERIC_NAME_WORDS.has(x));
  for (const u of b.source_urls ?? []) {
    try {
      const host = new URL(u).hostname.replace(/^www\./, "");
      if (!NOT_OWN_SITE.test(host) && words.some((x) => host.includes(x))) return `https://${new URL(u).hostname}/`;
    } catch (_e) { /* not a URL */ }
  }
  return null;
}

type SiteCheck = { state: "ok" | "blocked"; problems: string[]; seen: string[]; emails: string[] };

// Reads the homepage once. Only claims what is on the page; a site that times
// out or blocks automated visits is "blocked" and no claim is made about it.
async function checkSite(url: string, sector: string): Promise<SiteCheck> {
  const out: SiteCheck = { state: "ok", problems: [], seen: [], emails: [] };
  let host = "", html = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "Mozilla/5.0 (compatible; MoCreativeResearch/1.0)" } });
    html = await res.text();
  } catch (_e) {
    return { ...out, state: "blocked" };
  }
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ");
  const lower = text.toLowerCase();

  if (/coming soon|under construction|launching (in|soon)|under maintenance|maintenance mode/.test(lower.slice(0, 3000))) {
    out.problems.push(`${host} shows a "coming soon" or under-construction page instead of a working site`);
    return out;
  }
  if (/_Incapsula_Resource|cf-browser-verification|just a moment\.\.\./i.test(html) || text.trim().length < 300) {
    return { ...out, state: "blocked" };
  }

  const leftovers = ["lorem ipsum", "sample page", "just another wordpress site", "0 lessons", ...(["Retail", "Food"].includes(sector) ? [] : ["buy now"])]
    .filter((p) => lower.includes(p));
  if (leftovers.length) out.problems.push(`the homepage still shows template text such as ${leftovers.map((p) => `"${p}"`).join(" and ")}`);
  if (!/name=["']viewport/i.test(html)) out.problems.push("the homepage has no mobile viewport setting, so it may not fit phone screens");

  const s = sectorOf(sector);
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ href: m[1], label: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() }));
  const actionLinks = links.filter((l) => s.action.test(`${l.href} ${l.label}`));
  if (!actionLinks.length) out.problems.push(`the homepage doesn't link to an ${s.path}`);
  else if (actionLinks.every((l) => /contact/i.test(l.href))) {
    const label = actionLinks.find((l) => l.label)?.label.slice(0, 30);
    out.problems.push(`${label ? `the "${label}" button leads` : "the main call to action leads"} to the general contact page, not an ${s.path}`);
  }

  const intake = text.match(/(\d{4}\s*\/\s*\d{4})\s+admissions?/i) ?? text.match(/admissions?\s+(?:are\s+|is\s+)?(?:now\s+)?open\s+(?:for\s+)?(?:the\s+)?(\d{4}\s*\/\s*\d{4})/i);
  if (intake) out.seen.push(`admissions for ${intake[1].replace(/\s/g, "")} are open`);
  if (/online application|apply online|start (an )?application/i.test(text) || actionLinks.some((l) => /apply|application|regist|form/i.test(`${l.href} ${l.label}`))) out.seen.push("applications or registration can start online");
  if (/portal/i.test(text)) out.seen.push("there is an online portal");
  if (/virtual tour/i.test(text)) out.seen.push("there is a virtual tour");
  if (/fee payment|pay (your )?fees|tuition payment|pay online/i.test(text)) out.seen.push("fees can be paid online");
  if (/wa\.me\/|api\.whatsapp\.com/i.test(html)) out.seen.push("there is a WhatsApp contact link");
  const campuses = text.match(/\b(\d{1,2})\s+campuses\b/i);
  if (campuses) out.seen.push(`it runs ${campuses[1]} campuses`);

  const root = host.split(".").slice(-3).join(".");
  out.emails = [...new Set(html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g) ?? [])]
    .filter((e) => validEmail(e))
    .sort((a, b) => Number(b.toLowerCase().includes(root)) - Number(a.toLowerCase().includes(root)));
  return out;
}

const findingsText = (site: SiteCheck | null) =>
  !site ? null
  : site.state === "blocked" ? "Site not checked (it blocked automated visits or did not load)."
  : [site.problems.length ? `Website problems: ${site.problems.join("; ")}.` : "", site.seen.length ? `Seen on their site: ${site.seen.join("; ")}.` : ""]
      .filter(Boolean).join(" ") || "Site checked; nothing specific stood out.";

const clean = (v?: string | null) => (v && String(v).trim() && String(v).trim().toLowerCase() !== "null" ? String(v).trim() : null);
const dedupeKey = (name: string, sector: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}|${sector.toLowerCase()}`;

function classify(b: Found, sector: string, website: string | null, site: SiteCheck | null) {
  // Prefer an address on the business's own domain over a free-mail one from a directory.
  const searched = validEmail(clean(b.email)) ? clean(b.email) : null;
  const email = (!searched || FREEMAIL.test(searched)) && site?.emails.length ? site.emails[0] : searched;
  const phone = clean(b.phone);
  const social = clean(b.social_url);
  const status = website ? "found" : (b.website_status === "none_found" ? "none_found" : "unknown");
  const siteProblem = !!site && site.state === "ok" && site.problems.length > 0;
  const pillar = status === "found" && !siteProblem ? "AI Automation" : "Product Design";
  const channel = email ? "email" : phone ? "phone" : social ? "social" : "none";

  const why: string[] = [];
  let fit = 0;
  if (status === "none_found") { fit += 3; why.push("no website found (website pitch)"); }
  else if (siteProblem) { fit += 3; why.push(`website problem seen (redesign pitch): ${site!.problems[0]}`); }
  else if (status === "found") { fit += 1; why.push(site?.state === "blocked" ? "has a website, not readable (AI audit pitch)" : "working website (AI audit pitch)"); }
  else { fit += 1; why.push("website unknown, check before pitching"); }
  if (email) { fit += 2; why.push("email found"); }
  if (phone) { fit += 2; why.push("phone found"); }
  if (social) { fit += 1; why.push("social page found"); }
  if (sector === "Education") { fit += 2; why.push("education (Topkids proof)"); }
  else if (["Healthcare", "Real estate", "Logistics"].includes(sector)) { fit += 1; why.push(sector.toLowerCase()); }
  if (channel === "none") { fit = 0; why.push("no way to contact found"); }

  return { website, email, phone, social, status, pillar, channel, fit, reason: why.join("; ") };
}

function parseArray(text: string): Found[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  try {
    const arr = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(arr) ? arr : [];
  } catch (_e) {
    return [];
  }
}

Deno.serve(async (req: Request) => {
  const refused = await refuseUnlessAgentCall(req);
  if (refused) return refused;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(() => ({}));
  const sector: string | null = clean(body?.sector);
  const log = (status: string, output_summary: string, error_detail?: string) =>
    supabase.from("agent_logs").insert({
      agent_name: "06 — Prospecting Agent",
      layer: "Layer 1 — Acquisition",
      triggered_by: sector ? `manual (sector: ${sector})` : "scheduled-daily",
      status,
      output_summary,
      error_detail: error_detail ?? null,
    });

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      await log("failed", "Missing secret ANTHROPIC_API_KEY — nothing searched.");
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const claude = (body: unknown) =>
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    let queryRows = supabase
      .from("prospect_queries")
      .select("id, query, sector, runs")
      .eq("active", true);
    if (sector) queryRows = queryRows.eq("sector", sector);
    const { data: queries, error: qErr } = await queryRows
      .order("last_run_at", { ascending: true, nullsFirst: true })
      .limit(QUERIES_PER_RUN);
    if (qErr) throw qErr;

    let found = 0, added = 0, searches = 0;
    const errors: string[] = [];

    // ── 1. search, classify, store ──────────────────────────────────────
    for (const q of queries ?? []) {
      const res = await claude({
        model: MODEL,
        max_tokens: 4000,
        system: SEARCH_SYSTEM,
        tools: [{
          type: "web_search_20250305",
          name: "web_search",
          max_uses: MAX_SEARCHES_PER_QUERY,
          // no user_location: the search tool rejects country "NG"; every query names Lagos instead
        }],
        messages: [{ role: "user", content: `Find: ${q.query}` }],
      });
      const json = await res.json();
      await supabase.from("prospect_queries")
        .update({ last_run_at: new Date().toISOString(), runs: (q.runs ?? 0) + 1 })
        .eq("id", q.id);

      if (!res.ok) {
        errors.push(`"${q.query}": ${JSON.stringify(json).slice(0, 300)}`);
        continue;
      }
      searches += json?.usage?.server_tool_use?.web_search_requests ?? 0;
      const text = (json.content ?? [])
        .filter((c: { type: string }) => c.type === "text")
        .map((c: { text: string }) => c.text)
        .join("\n");
      const businesses = parseArray(text);
      if (!businesses.length) {
        errors.push(`"${q.query}": no parseable results`);
        continue;
      }

      // Read every business's own site in parallel before deciding the pitch.
      const named = businesses.map((b) => ({ b, name: clean(b.name) })).filter((x): x is { b: Found; name: string } => !!x.name);
      const checked = await Promise.all(named.map(async ({ b, name }) => {
        const website = ownSite(b, name);
        return { b, name, website, site: website ? await checkSite(website, q.sector) : null };
      }));

      for (const { b, name, website, site } of checked) {
        found++;
        const c = classify(b, q.sector, website, site);
        const { data: ins, error: insErr } = await supabase
          .from("prospects")
          .upsert({
            dedupe_key: dedupeKey(name, q.sector),
            name,
            sector: q.sector,
            query: q.query,
            address: clean(b.address),
            website: c.website,
            website_status: c.status,
            phone: c.phone,
            email: c.email,
            social_url: c.social,
            contact_channel: c.channel,
            pillar: c.pillar,
            fit_score: c.fit,
            fit_reason: c.reason,
            site_findings: findingsText(site),
            site_checked_at: site ? new Date().toISOString() : null,
            sources: Array.isArray(b.source_urls) ? b.source_urls.slice(0, 5) : null,
          }, { onConflict: "dedupe_key", ignoreDuplicates: true })
          .select("id");
        if (insErr) { errors.push(`insert "${name}": ${insErr.message}`); continue; }
        if (ins && ins.length) added++;
      }
    }

    // ── 2. draft messages for the best reachable new fits ───────────────
    let draftRows = supabase
      .from("prospects")
      .select("id, name, sector, pillar, website, website_status, contact_channel, site_findings")
      .eq("status", "New")
      .is("draft_message", null)
      .neq("contact_channel", "none")
      .gte("fit_score", DRAFT_MIN_SCORE);
    if (sector) draftRows = draftRows.eq("sector", sector);
    const { data: toDraft } = await draftRows
      .order("fit_score", { ascending: false })
      .limit(MAX_DRAFTS_PER_RUN);

    let drafted = 0;
    for (const p of toDraft ?? []) {
      const channel = p.contact_channel === "email" ? "email" : p.contact_channel === "phone" ? "whatsapp" : "social_dm";
      const facts = [
        `Business: ${p.name}`,
        `Sector: ${p.sector}`,
        `Pillar to offer: ${p.pillar}`,
        p.website_status === "found" ? `Website: ${p.website}`
          : p.website_status === "none_found" ? "Website: none found; appears only on directories or social media"
          : "Website: not confirmed",
        p.site_findings ?? "Seen on their site: nothing (site not checked).",
      ].join("\n");

      const ai = await claude({
        model: MODEL,
        max_tokens: 600,
        system: draftSystem(channel, p.sector),
        messages: [{ role: "user", content: facts }],
      });
      const aiJson = await ai.json();
      const text: string = aiJson?.content?.[0]?.text?.trim() ?? "";
      if (!ai.ok || !text) {
        errors.push(`draft "${p.name}": ${JSON.stringify(aiJson).slice(0, 300)}`);
        continue;
      }
      await supabase.from("prospects")
        .update({ draft_message: text, draft_channel: channel, drafted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", p.id);
      drafted++;
    }

    // one row per run, including quiet runs, so a silent failure is visible
    const summary = (sector ? `[${sector} only] ` : "") +
      `Searched ${(queries ?? []).map((q) => `"${q.query}"`).join(", ") || "nothing (no active queries)"} ` +
      `(${searches} web searches): ${found} found, ${added} new, ${drafted} drafts written. Nothing sent.`;
    await log(errors.length ? "failed" : "success", summary, errors.length ? errors.join(" | ").slice(0, 2000) : undefined);

    return new Response(JSON.stringify({ found, added, drafted, searches, errors }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    await log("failed", "Prospecting run crashed", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
