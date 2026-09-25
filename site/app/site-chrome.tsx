/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element --
   Plain <a> on purpose: every page is a full load so mo-core.js mounts fresh
   (the home markup links the same way). Images are pre-sized webp renders,
   served as-is exactly like the home page's. */
// Shared chrome for the pages that are not the home page (/about, /motion).
// The home page renders the same nav, contact card and footer from
// brand-markup.ts (generated from scrollcraft/deploy/version-a). Keep the two
// in step: same classes, same order, same copy. Section links point at the home
// page ("/#work"); the design/AI/contact anchors stay on the current page,
// because every page ends in the same contact card with the same ids.
//
// Plain <a> on purpose, not next/link: every page is a full load, so the
// scrollcraft engine and mo.js mount fresh on each one.

import "./site-chrome.css";

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

export function SiteTop() {
  return (
    <>
      <span data-sc-progress></span>
      <div className="sc-grain" aria-hidden="true"></div>
      <header className="nav">
        <a className="nav__brand" href="/">
          <span className="mo-mark">
            <img src="/assets/mc-logo-lit.webp" alt="" />
          </span>
          <span>
            MoCreative Concept<b>.</b>
          </span>
        </a>
        <nav className="nav__links" aria-label="Sections">
          <a href="/about">About</a>
          <a href="/#services">Services</a>
          <a href="/#os">Agentic OS</a>
          <a href="/#work">Work</a>
          <a href="/motion">Motion</a>
          <a href="#contact">Contact</a>
        </nav>
        <button className="mo-theme" type="button" data-theme-toggle aria-label="Switch theme">
          <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
          </svg>
          <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
          </svg>
        </button>
        <div className="nav__cta">
          <a className="mo-btn pill-design" href="#contact-design">
            <i></i>Start a design project
          </a>
          <a className="mo-btn pill-ai" href="#contact-ai">
            <i></i>Book an AI audit
          </a>
        </div>
        <a className="mo-btn nav__one" href="#contact">
          Contact
        </a>
      </header>
    </>
  );
}

type CloseProps = {
  title: string;
  lede: string;
  /** optional extra links under the email line (portfolio, LinkedIn, sister page) */
  links?: { href: string; label: string; external?: boolean }[];
};

/** The contact card and footer every page closes on. Ids match the home page,
    so the nav's "Start a design project" / "Book an AI audit" land here. */
export function SiteClose({ title, lede, links }: CloseProps) {
  return (
    <section id="contact" className="sc-section close" data-sc-act="flow" style={{ paddingTop: "clamp(2.5rem,8vh,5rem)" }}>
      <div className="sc-wrap">
        <div className="mo-card contact" data-sc-in data-sc-stagger="70">
          <div style={{ display: "grid", gap: "var(--sc-4)" }}>
            <p className="mo-kick mo-kick--gold">Contact</p>
            <h2 className="mo-h mo-h--lg">{title}</h2>
            <p className="mo-p">{lede}</p>
            <p className="mo-mono" style={{ color: "var(--sc-ink-soft)" }}>
              hello@mocreativeconcept.com
            </p>
            {links && links.length > 0 && (
              <p className="site-links mo-mono">
                {links.map((l) => (
                  <a key={l.href} href={l.href} {...(l.external ? { target: "_blank", rel: "noopener" } : {})}>
                    {l.label}
                  </a>
                ))}
              </p>
            )}
          </div>
          <div className="contact__doors">
            <a id="contact-design" className="door pill-design" href="mailto:hello@mocreativeconcept.com?subject=Design%20project">
              <b>Start a design project</b>
              <span>UI/UX, web, design systems, full build</span>
              <Arrow />
            </a>
            <a id="contact-ai" className="door pill-ai" href="mailto:hello@mocreativeconcept.com?subject=AI%20automation%20audit">
              <b>Book an AI audit</b>
              <span>Automation, agents, AI adoption</span>
              <Arrow />
            </a>
          </div>
        </div>

        <footer className="foot">
          <span>MoCreative Concept. · The creative brand that ships</span>
          <a href="mailto:hello@mocreativeconcept.com">hello@mocreativeconcept.com</a>
        </footer>
      </div>
    </section>
  );
}

export { Arrow };
