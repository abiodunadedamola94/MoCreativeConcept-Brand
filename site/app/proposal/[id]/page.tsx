import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../brand-tokens.css";
import "../../invoice-doc.css";

// The destination for every PROPOSAL_LINK Agent 09 sends.
// Server-rendered: the Supabase service-role key is read here, never shipped
// to the browser, so no RLS policy has to be opened up for anon reads.
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as Vercel env vars.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proposal — MoCreative Concept",
  description: "Proposal from MoCreative Concept.",
  robots: { index: false, follow: false },
};

type ScopeItem = { title: string; description?: string; price: number };

type Proposal = {
  id: string;
  project_name: string;
  summary: string | null;
  scope_json: ScopeItem[] | null;
  timeline: string | null;
  investment_ngn: number | string | null;
  assumptions: string | null;
  status: string;
  created_at: string;
};

const NGN = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

async function getProposal(id: string): Promise<Proposal | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  // a malformed id should 404, not reach the database
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const res = await fetch(
    `${url}/rest/v1/proposals?id=eq.${id}&select=id,project_name,summary,scope_json,timeline,investment_ngn,assumptions,status,created_at`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Proposal[];
  return rows?.[0] ?? null;
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProposal(id);
  if (!p) notFound();

  const scope = Array.isArray(p.scope_json) ? p.scope_json : [];
  const total = Number(p.investment_ngn ?? 0);
  const issued = new Date(p.created_at).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="inv-page">
      <div className="inv-shell">
        <header className="inv-masthead">
          <div className="mast-brand">
            <div className="inv-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/mc-logo-lit.webp" width={1254} height={1254} alt="" />
            </div>
            <div>
              <div className="mast-name">MoCreative Concept</div>
              <div className="mast-role">Product Design &amp; AI Automation</div>
            </div>
          </div>
          <div className="mast-contact">
            <div className="mc-col">
              <div className="mc-label">Email</div>
              <div className="mc-val">hello@email.mocreativeconcept.com</div>
            </div>
            <div className="mc-col">
              <div className="mc-label">Website</div>
              <div className="mc-val">mocreativeconcept.com</div>
            </div>
          </div>
        </header>

        <div className="inv-wave">
          <svg viewBox="0 0 1200 34" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0 0h1200v10c-200 24-420 24-600 10S200 2 0 22z"
              fill="var(--mo-gold)"
              opacity=".92"
            />
          </svg>
        </div>

        <div className="inv-body">
          <div className="inv-head-grid">
            <div>
              <div className="to-label">Proposal</div>
              <div className="to-name">{p.project_name}</div>
              {p.summary ? <p className="to-detail">{p.summary}</p> : null}
            </div>
            <div className="inv-title-block">
              <div className="inv-meta-rows">
                <div className="meta-row">
                  <span className="meta-k">Issued</span>
                  <span className="meta-v">{issued}</span>
                </div>
                {p.timeline ? (
                  <div className="meta-row">
                    <span className="meta-k">Timeline</span>
                    <span className="meta-v">{p.timeline}</span>
                  </div>
                ) : null}
                <div className="meta-row">
                  <span className="meta-k">Investment</span>
                  <span className="meta-v is-gold">{NGN(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="inv-table inv-table--simple">
            <div className="tbl-head">
              <span className="th">Scope</span>
              <span className="th num">Investment</span>
            </div>
            {scope.map((s, i) => (
              <div className="tbl-row is-static" key={i}>
                <div className="td">
                  <div className="item-title">{s.title}</div>
                  {s.description ? <div className="item-sub">{s.description}</div> : null}
                </div>
                <div className="td num" data-k="Investment">
                  {NGN(Number(s.price) || 0)}
                </div>
              </div>
            ))}
          </div>

          <div className="totals-bar">
            <div className="tot-row is-grand">
              <span className="tot-k">Total Investment</span>
              <span className="tot-v">{NGN(total)}</span>
            </div>
          </div>

          {p.assumptions ? (
            <>
              <div className="sec-head">
                <h2>Assumptions</h2>
                <span className="rule"></span>
              </div>
              <div className="notes-block">
                <p>{p.assumptions}</p>
              </div>
            </>
          ) : null}

          <div className="support-strip">
            <div className="ss-k">Next Step</div>
            <div className="ss-v">
              Reply to this proposal and we&apos;ll get the first milestone scheduled. Any part of the
              scope can be adjusted before we start — nothing here is fixed until you say so.
            </div>
          </div>

          <footer className="inv-footer">
            <div>
              <div className="powered">
                <div className="inv-mark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/mc-logo-lit.webp" width={1254} height={1254} alt="" />
                </div>
                <div>
                  <div className="pw-label">Prepared by</div>
                  <div className="pw-name">MoCreative Concept</div>
                </div>
              </div>
            </div>
            <div className="pay-info">
              <div className="pi-label">Contact</div>
              <div className="pay-holder">hello@email.mocreativeconcept.com</div>
              <div className="pay-holder">Abiodun Adedamola David · Lagos</div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
