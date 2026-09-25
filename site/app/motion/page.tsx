import type { Metadata } from "next";
import Script from "next/script";
import "../scrollcraft.css";
import "../brand-tokens.css";
import "../brand-page.css";
import "./motion.css";
import { Arrow, SiteClose, SiteTop } from "../site-chrome";

export const metadata: Metadata = {
  title: "Motion · MoCreative Concept.",
  description:
    "Brand motion, UI transitions, micro-interactions and scroll-driven prototypes, built in Figma by Abiodun Adedamola David. Part of the Product Design pillar at MoCreative Concept.",
};

type Piece = {
  title: string;
  label: string;
  desc: string;
  tags: string[];
  kind?: string;
  format: string;
  video?: string;
  figma?: string;
  open: { href: string; label: string };
};

const PIECES: Piece[] = [
  {
    title: "Fanta, brand motion",
    label: "Brand motion",
    desc: "A bold brand motion concept for Fanta. Expressive interactions and animated transitions built around the brand's playful identity.",
    tags: ["Brand motion", "Smart Animate", "Figma"],
    kind: "Concept",
    format: "Figma · MP4",
    video: "https://res.cloudinary.com/dd1zvfkdo/video/upload/q_auto,f_auto/v1780058279/Fanta_lxmi00.mp4",
    open: {
      href: "https://www.figma.com/proto/vVqHaIkvDwgd3keDOPEc8v/Fanta?node-id=1-58&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A58",
      label: "Open in Figma",
    },
  },
  {
    title: "Liquid Glass",
    label: "Glass UI",
    desc: "A glass UI motion study. Translucent layers, depth-driven blur and liquid transitions.",
    tags: ["Glass UI", "UI motion", "Visual design"],
    kind: "Study",
    format: "Figma prototype",
    figma:
      "https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Fproto%2F5ONNz2wVRTqq1BhD4XZYdj%2FLiquid-glass%3Fnode-id%3D30-69%26scaling%3Dscale-down%26content-scaling%3Dfixed%26page-id%3D0%253A1%26starting-point-node-id%3D30%253A69",
    open: { href: "https://www.figma.com/proto/5ONNz2wVRTqq1BhD4XZYdj/Liquid-glass?node-id=30-69&scaling=scale-down", label: "Open in Figma" },
  },
  {
    title: "SmallClosedWorld",
    label: "Motion story",
    desc: "Detail-rich motion at a small scale. Micro-interactions and a contained world, built through animated UI flows.",
    tags: ["Motion story", "Interaction design"],
    kind: "Study",
    format: "Figma · MP4",
    video: "https://res.cloudinary.com/dd1zvfkdo/video/upload/q_auto,f_auto/v1780058247/SmallWorld_iqdbyw.mp4",
    open: {
      href: "https://www.figma.com/proto/tyIbosivFCJcqRw6iL9H0n/SmallClosedWorld--Abiodun-Adedamola?node-id=82-2354&starting-point-node-id=29%3A2",
      label: "Open in Figma",
    },
  },
  {
    title: "Fanta, animation cut",
    label: "Animation",
    desc: "A second direction for the same concept. Tighter timing, faster transitions and a different pace.",
    tags: ["Brand motion", "Animation"],
    kind: "Concept",
    format: "Figma · MP4",
    video: "https://res.cloudinary.com/dd1zvfkdo/video/upload/q_auto,f_auto/v1780058134/Fanta_Animation_bmvju7.mp4",
    open: { href: "https://www.figma.com/proto/vVqHaIkvDwgd3keDOPEc8v/Fanta?node-id=1-58&scaling=min-zoom", label: "Open in Figma" },
  },
  {
    title: "Interactive category carousel",
    label: "Carousel",
    desc: "A gesture-driven category slider. Animated card transitions, clear active states and fluid swipes.",
    tags: ["Carousel", "Smart Animate", "Interaction"],
    format: "Figma · MP4",
    video: "https://res.cloudinary.com/dd1zvfkdo/video/upload/q_auto,f_auto/v1780057817/Interactive_Category_Slide_i6ylv1.mp4",
    open: { href: "mailto:hello@mocreativeconcept.com?subject=Motion%20enquiry", label: "Ask about it" },
  },
];

const TECHNIQUES = [
  "Scroll transitions",
  "Micro-interactions",
  "Smart Animate",
  "Brand motion",
  "Figma variables",
  "Animated onboarding",
  "Prototype-ready handoff",
  "AI-driven flows",
];

const Play = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13l10.5-6.5z" />
  </svg>
);

export default function MotionPage() {
  return (
    <>
      <SiteTop />

      <main id="top">
        {/* 1 · HERO: pin. Scroll is the playhead; the object moves by the brand curve. */}
        <section id="playhead" data-sc-act="pin" data-sc-span="2.4">
          <div data-sc-stage className="mt-hero">
            <div className="mt-hero__ghost" aria-hidden="true">
              Motion
            </div>
            <div className="mt-hero__grid">
              <div className="mt-hero__copy" data-sc-cue="0 1 0 0">
                <p className="mo-kick mo-kick--gold">Motion · Product Design</p>
                <h1 className="mo-h mo-h--xl">Products that move.</h1>
                <p className="mo-p mo-p--ink">
                  Brand motion, UI transitions, micro-interactions and scroll-driven prototypes, built in Figma. Every
                  animation has a job to do.
                </p>
                <div className="hero__ctas">
                  <a className="mo-btn pill-design" href="#reel">
                    <i></i>Watch the work
                    <Arrow />
                  </a>
                  <a className="mo-btn" href="/about">
                    Who makes it
                    <Arrow />
                  </a>
                </div>
              </div>

              <figure className="mo-card mt-curve pill-design" data-sc-cue="0 1 0 0">
                <figcaption className="mt-curve__head">
                  <span className="mo-kick">Scroll is the playhead</span>
                  <span className="mo-mono mt-curve__frame" aria-hidden="true">
                    Frame <b id="mt-frame">00</b> / 60
                  </span>
                </figcaption>
                <svg className="mt-curve__svg" viewBox="0 0 240 180" aria-hidden="true">
                  <path className="mt-curve__grid" d="M20 160H220M20 20H220M20 20V160M220 20V160M70 20V160M120 20V160M170 20V160" />
                  <path className="mt-curve__ghost" d="M20 160C66 20 84 20 220 20" />
                  <defs>
                    <clipPath id="mt-clip">
                      <rect id="mt-clip-rect" x="0" y="0" width="20" height="180" />
                    </clipPath>
                  </defs>
                  <path className="mt-curve__line" clipPath="url(#mt-clip)" d="M20 160C66 20 84 20 220 20" />
                  <line id="mt-head" className="mt-curve__head-line" x1="20" y1="20" x2="20" y2="160" />
                  <circle id="mt-dot" className="mt-curve__dot" cx="20" cy="160" r="5" />
                </svg>
                <p className="mo-mono mt-curve__ease">cubic-bezier(0.23, 1, 0.32, 1)</p>
                <div className="mt-track" aria-hidden="true">
                  <span className="mt-track__rail"></span>
                  <i className="mt-key mt-key--1"></i>
                  <i className="mt-key mt-key--2"></i>
                  <i className="mt-key mt-key--3"></i>
                  <span id="mt-obj" className="mt-track__obj"></span>
                </div>
                <div className="room__lines mt-rules">
                  <p className="mo-p mo-p--ink" data-sc-cue="0 0.36 0 0.1">
                    <b>Purposeful.</b> Motion explains where you came from, what changed and what to do next. If it
                    explains nothing, it goes.
                  </p>
                  <p className="mo-p mo-p--ink" data-sc-cue="0.34 0.68 0.1 0.1">
                    <b>Branded.</b> Timing and easing belong to the brand, like a colour does. This site runs on the one
                    curve above.
                  </p>
                  <p className="mo-p mo-p--ink" data-sc-cue="0.66 1 0.1 0.01">
                    <b>Production-ready.</b> Prototypes an engineer can read: Smart Animate, variables and real
                    states, not a video of a screen.
                  </p>
                </div>
              </figure>
            </div>
          </div>
        </section>

        {/* 2 · THE REEL: flow. Click to play; nothing autoplays. */}
        <section id="reel" className="sc-section mt-reel" data-sc-act="flow" style={{ paddingTop: "clamp(3rem,10vh,6rem)" }}>
          <div className="sc-wrap">
            <div className="mt-reel__head">
              <div className="mt-head" data-sc-in data-sc-stagger="70">
                <p className="mo-kick">Selected motion work</p>
                <h2 className="mo-h mo-h--lg">Five pieces. Press play.</h2>
              </div>
              <dl className="mt-facts" data-sc-in data-sc-stagger="60">
                <div>
                  <dt>Pieces</dt>
                  <dd>5</dd>
                </div>
                <div>
                  <dt>Primary tool</dt>
                  <dd>Figma</dd>
                </div>
                <div>
                  <dt>Core technique</dt>
                  <dd>Smart Animate</dd>
                </div>
              </dl>
            </div>

            <div className="mt-grid">
              {PIECES.map((p, i) => (
                <article key={p.title} className={"mo-card mt-piece pill-design" + (i === 0 ? " mt-piece--lead" : "")} data-sc-in>
                  <div className="mt-media" data-video={p.video} data-figma={p.figma}>
                    <button className="mt-media__poster" type="button" aria-label={(p.figma ? "Open the interactive prototype: " : "Play: ") + p.title}>
                      <span className="mt-media__title" aria-hidden="true">{p.title}</span>
                      <span className="mt-media__label mo-kick">{p.label}</span>
                      <span className="mt-media__play">
                        <Play />
                      </span>
                      <span className="mt-media__hint mo-mono">{p.figma ? "Click to interact" : "Click to play"}</span>
                    </button>
                    <div className="mt-media__embed"></div>
                  </div>
                  <div className="mt-piece__body">
                    <div className="case__meta">
                      <span className="mo-chip">Product Design</span>
                      {p.kind && <span className="mo-tag mo-tag--claimed">{p.kind}</span>}
                      <span className="mt-piece__index mo-mono">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="mo-h mo-h--sm">{p.title}</h3>
                    <p className="mo-p">{p.desc}</p>
                    <ul className="mt-tags">
                      {p.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                    <div className="mt-piece__foot">
                      <a
                        className="mo-btn pill-design"
                        href={p.open.href}
                        {...(p.open.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                      >
                        <i></i>
                        {p.open.label}
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <path d="M5 11l6-6M6 5h5v5" />
                        </svg>
                      </a>
                      <span className="mo-mono mt-piece__format">{p.format}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 3 · WHAT I ANIMATE: flow. */}
        <section id="craft" className="sc-section mt-craft" data-sc-act="flow" style={{ paddingTop: "clamp(2rem,7vh,4.5rem)" }}>
          <div className="sc-wrap mt-craft__grid">
            <div className="mt-head" data-sc-in data-sc-stagger="70">
              <p className="mo-kick">What I animate</p>
              <h2 className="mo-h mo-h--lg">Motion is part of the product, not a layer on top.</h2>
              <p className="mo-p">
                It sits in the Product Design pillar. The same hands that design the flow build the transitions, so
                nothing gets lost between a prototype and the shipped interface.
              </p>
            </div>
            <ul className="mt-craft__list" data-sc-in data-sc-stagger="50">
              {TECHNIQUES.map((t, i) => (
                <li key={t}>
                  <span className="mo-mono">{String(i + 1).padStart(2, "0")}</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <SiteClose
          title="Need an interface that moves with a purpose?"
          lede="Motion work is booked as a Product Design engagement. Booking 20 to 25 hours a week. Lagos, WAT, working with teams anywhere."
          links={[
            { href: "/about", label: "About Damola" },
            { href: "https://mocreativeportfolio.lovable.app/", label: "Portfolio", external: true },
          ]}
        />
      </main>

      <Script src="/mo-core.js" strategy="afterInteractive" />
      <Script src="/motion.js" strategy="afterInteractive" />
    </>
  );
}
