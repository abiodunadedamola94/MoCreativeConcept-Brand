/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element --
   Plain <a> on purpose: every page is a full load so mo-core.js mounts fresh
   (the home markup links the same way). Images are pre-sized webp renders,
   served as-is exactly like the home page's. */
import type { Metadata } from "next";
import Script from "next/script";
import "../scrollcraft.css";
import "../brand-tokens.css";
import "../brand-page.css";
import "./about.css";
import { Arrow, SiteClose, SiteTop } from "../site-chrome";

export const metadata: Metadata = {
  title: "About · Abiodun Adedamola David · MoCreative Concept.",
  description:
    "Abiodun Adedamola David (Damola) runs MoCreative Concept, an independent, AI-native practice in Lagos with two pillars: product design from brief to deployed code, and AI automation.",
};

const SKILLS: { title: string; items: string[] }[] = [
  {
    title: "Design and research",
    items: ["UX research", "Interaction design", "Design systems", "Wireframing", "Prototyping", "WCAG accessibility", "Data-driven UX"],
  },
  {
    title: "AI and product",
    items: ["AI product design", "Automation design", "Prompt engineering", "Vibe coding", "Full-stack delivery", "Systems design", "Agile"],
  },
  {
    title: "Tools and stack",
    items: ["Figma", "Framer", "Lovable", "Claude Code", "Vercel", "Supabase", "Notion", "Webflow", "Git"],
  },
];

const EDUCATION: { what: string; where: string }[] = [
  { what: "B.Sc. Computer Science", where: "NOUN" },
  { what: "NCE, Computer Science and Mathematics", where: "LASUED" },
  { what: "Design Thinking", where: "IBMI Berlin" },
];

export default function AboutPage() {
  return (
    <>
      <SiteTop />

      <main id="top">
        {/* 1 · HERO: pin. The founder, one sentence, both pillars. */}
        <section id="intro" data-sc-act="pin" data-sc-span="1.8">
          <div data-sc-stage className="ab-hero">
            <div className="ab-hero__ghost" aria-hidden="true">
              Damola
            </div>
            <div className="ab-hero__grid">
              <div className="ab-hero__copy" data-sc-cue="0 0.86 0">
                <p className="mo-kick mo-kick--gold">About · Lagos</p>
                <h1 className="mo-h mo-h--xl">I design products, then build them myself.</h1>
                <p className="mo-p mo-p--ink">
                  I&apos;m Abiodun Adedamola David. Most people call me Damola. MoCreative Concept is my independent
                  practice: one person, AI-native, working in two pillars.
                </p>
                <div className="ab-hero__pillars">
                  <span className="mo-chip pill-design">Product Design</span>
                  <span className="mo-chip pill-ai">AI Automation</span>
                </div>
                <div className="hero__ctas">
                  <a className="mo-btn pill-design" href="#contact-design">
                    <i></i>Start a design project
                    <Arrow />
                  </a>
                  <a className="mo-btn" href="/motion">
                    See the motion work
                    <Arrow />
                  </a>
                </div>
              </div>
              <figure className="ab-portrait">
                <img src="/assets/mc-founder.webp" width={880} height={1056} alt="Abiodun Adedamola David, founder of MoCreative Concept" />
                <figcaption>
                  <span className="mo-chip mo-chip--venture">Founder</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* 2 · MISSION + VISION: flow. */}
        <section id="mission" className="sc-section ab-mv" data-sc-act="flow">
          <div className="sc-wrap">
            <div className="ab-head" data-sc-in data-sc-stagger="70">
              <p className="mo-kick">Mission and vision</p>
              <h2 className="mo-h mo-h--lg">Design for the systems people actually run on.</h2>
            </div>
            <div className="ab-mv__grid" data-sc-in data-sc-stagger="90">
              <article className="mo-card ab-mv__card">
                <p className="mo-kick mo-kick--gold">Mission</p>
                <p className="ab-mv__text">
                  Close the gap between what people need and what AI-powered systems can do. Design products that change
                  how people work, learn and transact, not only how they look.
                </p>
              </article>
              <article className="mo-card ab-mv__card">
                <p className="mo-kick">Vision</p>
                <p className="ab-mv__text">
                  Startups, schools and businesses in Africa and beyond, running on intelligent, well-designed digital
                  infrastructure. Built by designers who think like engineers and ship like founders.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 3 · THE WHOLE JOB: pin. Three plates light in turn: design, build, automate. */}
        <section id="method" data-sc-act="pin" data-sc-span="3">
          <div data-sc-stage className="ab-job">
            <figure className="mo-card ab-stack" aria-hidden="true">
              <span className="ab-stack__label mo-kick">One pair of hands</span>
              <div className="ab-plate ab-plate--1 pill-design">
                <span className="mo-chip">Design</span>
                <div className="ab-wire">
                  <i className="ab-wire__bar"></i>
                  <i className="ab-wire__side"></i>
                  <i className="ab-wire__main"></i>
                  <i className="ab-wire__main ab-wire__main--2"></i>
                </div>
              </div>
              <div className="ab-plate ab-plate--2 pill-design">
                <span className="mo-chip">Build</span>
                <code className="ab-code">
                  <span>&lt;Case pill=&quot;design&quot;&gt;</span>
                  <span>&nbsp;&nbsp;deploy(&quot;main&quot;)</span>
                  <span>&lt;/Case&gt;</span>
                </code>
              </div>
              <div className="ab-plate ab-plate--3 pill-ai">
                <span className="mo-chip">Automate</span>
                <div className="ab-nodes">
                  <i></i>
                  <b></b>
                  <i></i>
                  <b></b>
                  <i className="ab-nodes__gate"></i>
                </div>
              </div>
            </figure>
            <div className="ab-job__copy">
              <p className="mo-kick mo-kick--gold" data-sc-cue="0 1 0 0">
                One person, the whole job
              </p>
              <h2 className="mo-h mo-h--lg" data-sc-cue="0 1 0 0" style={{ marginTop: "var(--sc-4)" }}>
                Design, build, automate.
              </h2>
              <div className="room__lines ab-job__lines">
                <p className="mo-p mo-p--ink" data-sc-cue="0 0.34 0 0.08">
                  <b>Design.</b> Workflows, admin views and system logic come before the screens. Every project names its
                  success metric before anything is drawn.
                </p>
                <p className="mo-p mo-p--ink" data-sc-cue="0.34 0.67 0.08 0.08">
                  <b>Build.</b> Figma to production with Claude Code, Lovable, Vercel and Supabase. The concept reaches a
                  live URL without waiting for a separate engineering team.
                </p>
                <p className="mo-p mo-p--ink" data-sc-cue="0.67 1 0.08 0.01">
                  <b>Automate.</b> Agents on Claude, MCP and Supabase take the repetitive work. Each one stops at a human
                  approval gate before anything goes out.
                </p>
              </div>
              <dl className="ab-job__steps" data-sc-cue="0 1 0 0">
                <div className="pill-design">
                  <dt>Design</dt>
                  <dd>
                    <i className="ab-bar ab-bar--1"></i>
                  </dd>
                </div>
                <div className="pill-design">
                  <dt>Build</dt>
                  <dd>
                    <i className="ab-bar ab-bar--2"></i>
                  </dd>
                </div>
                <div className="pill-ai">
                  <dt>Automate</dt>
                  <dd>
                    <i className="ab-bar ab-bar--3"></i>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* 4 · THE PRACTICE: flow. Two pillars, never one list, and the flagship. */}
        <section id="practice" className="sc-section ab-practice" data-sc-act="flow" style={{ paddingTop: "clamp(2rem,7vh,4.5rem)" }}>
          <div className="sc-wrap">
            <div className="ab-head" data-sc-in data-sc-stagger="70">
              <p className="mo-kick">The practice</p>
              <h2 className="mo-h mo-h--lg">Two pillars. Never blended.</h2>
              <p className="mo-p">
                MoCreative Concept is independent and solo. Each engagement sits in one pillar, so you always know what
                you are buying.
              </p>
            </div>
            <div className="ab-practice__grid">
              <article className="mo-card ab-pillar pill-design" data-sc-in data-sc-stagger="60">
                <span className="mo-chip">Pillar one · Product Design</span>
                <h3 className="mo-h mo-h--sm">From a sharp brief to deployed code.</h3>
                <ul className="svc__list">
                  <li><span>01</span><div>UI/UX and product design</div></li>
                  <li><span>02</span><div>Web design and development</div></li>
                  <li><span>03</span><div>Design systems</div></li>
                  <li><span>04</span><div>AI-native full build and ship</div></li>
                </ul>
              </article>
              <article className="mo-card ab-pillar pill-ai" data-sc-in data-sc-stagger="60">
                <span className="mo-chip">Pillar two · AI Automation</span>
                <h3 className="mo-h mo-h--sm">From manual busywork to agents that run it.</h3>
                <ul className="svc__list">
                  <li><span>01</span><div>AI automation audit</div></li>
                  <li><span>02</span><div>Workflow automation</div></li>
                  <li><span>03</span><div>Custom agents on Claude, MCP and Supabase</div></li>
                  <li><span>04</span><div>AI adoption consulting</div></li>
                </ul>
              </article>
            </div>
            <article className="ab-flagship pill-ai" data-sc-in data-sc-stagger="70">
              <span className="mo-chip">Flagship · Agentic OS</span>
              <p className="mo-p mo-p--ink">
                The practice itself is being rebuilt as a system of agents, in public, as a template other brands can
                run. The agents in build are labelled that way. So are the ones still planned.
              </p>
              <a className="mo-btn pill-ai" href="/#os">
                <i></i>See the agent OS
                <Arrow />
              </a>
            </article>
          </div>
        </section>

        {/* 5 · SKILLS: flow. */}
        <section id="skills" className="sc-section ab-skills" data-sc-act="flow" style={{ paddingTop: "clamp(2rem,7vh,4.5rem)" }}>
          <div className="sc-wrap">
            <div className="ab-head" data-sc-in data-sc-stagger="70">
              <p className="mo-kick">Core skills</p>
              <h2 className="mo-h mo-h--lg">What the work draws on.</h2>
            </div>
            <div className="ab-skills__grid" data-sc-in data-sc-stagger="80">
              {SKILLS.map((g) => (
                <div className="ab-skillset" key={g.title}>
                  <h3 className="mo-kick">{g.title}</h3>
                  <ul>
                    {g.items.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 · TRACK RECORD + EDUCATION: flow. Practice work and employment kept apart. */}
        <section id="history" className="sc-section ab-history" data-sc-act="flow" style={{ paddingTop: "clamp(2rem,7vh,4.5rem)" }}>
          <div className="sc-wrap ab-history__grid">
            <div>
              <div className="ab-head" data-sc-in data-sc-stagger="70">
                <p className="mo-kick">Track record</p>
                <h2 className="mo-h mo-h--lg">Where the work has been.</h2>
              </div>

              <h3 className="ab-group mo-kick mo-kick--gold" data-sc-in>
                MoCreative Concept
              </h3>
              <ul className="founder__roles ab-roles" data-sc-in data-sc-stagger="60">
                <li>
                  <div>
                    <b>Topkids Montessori School system</b>
                    <span>Operations discovery first, then admin, teacher and parent portals on one schema.</span>
                  </div>
                  <span className="mo-chip pill-design">Design</span>
                </li>
                <li>
                  <div>
                    <b>Next Level Procurement</b>
                    <span>Sole designer and developer. A rebrand and a rebuilt live site. Started in 2021, now concluded.</span>
                  </div>
                  <span className="mo-chip pill-design">Design</span>
                </li>
                <li>
                  <div>
                    <b>The agent OS, built in public</b>
                    <span>The practice&apos;s own system of agents. The first ones are in build.</span>
                  </div>
                  <span className="mo-chip pill-ai">AI</span>
                </li>
              </ul>

              <h3 className="ab-group mo-kick" data-sc-in>
                Venture
              </h3>
              <ul className="founder__roles ab-roles" data-sc-in data-sc-stagger="60">
                <li>
                  <div>
                    <b>Co-founder of Harkardah, a school-operations platform</b>
                  </div>
                  <span className="mo-chip mo-chip--venture">Venture</span>
                </li>
              </ul>

              <h3 className="ab-group mo-kick" data-sc-in>
                Employment and earlier roles
              </h3>
              <p className="ab-note mo-p" data-sc-in>
                Personal work history. None of it is MoCreative Concept work.
              </p>
              <ul className="founder__roles ab-roles" data-sc-in data-sc-stagger="60">
                <li>
                  <div>
                    <b>Product Designer, LeapTra</b>
                    <span>Employer. AI SaaS: design for sales, onboarding and support agents, and the admin dashboards that watch them.</span>
                  </div>
                  <span className="ab-when mo-mono">Sept 2025 to now</span>
                </li>
                <li>
                  <div>
                    <b>Jomppa, artisan PWA</b>
                    <span>LeapTra work. The MVP PWA and its design system, delivered as part of that role.</span>
                  </div>
                  <span className="ab-when mo-mono">Oct 2025 to now</span>
                </li>
                <li>
                  <div>
                    <b>Product Design Intern, Young Titans</b>
                    <span>NGO. Led a small design team that shipped a WCAG 2.1 compliant website.</span>
                  </div>
                  <span className="ab-when mo-mono">Jul to Oct 2025</span>
                </li>
              </ul>
            </div>

            <aside className="ab-edu" data-sc-in data-sc-stagger="70">
              <p className="mo-kick">Education</p>
              <ul>
                {EDUCATION.map((e) => (
                  <li key={e.what}>
                    <b>{e.what}</b>
                    <span className="mo-mono">{e.where}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <SiteClose
          title="Bring the brief you haven't been able to get built."
          lede="Booking 20 to 25 hours a week for new engagements. Lagos, WAT, working with teams anywhere."
          links={[
            { href: "https://mocreativeportfolio.lovable.app/", label: "Portfolio", external: true },
            { href: "https://linkedin.com/in/abiodun-adedamola", label: "LinkedIn", external: true },
            { href: "/motion", label: "Motion work" },
          ]}
        />
      </main>

      <Script src="/mo-core.js" strategy="afterInteractive" />
      <Script src="/about.js" strategy="afterInteractive" />
    </>
  );
}
