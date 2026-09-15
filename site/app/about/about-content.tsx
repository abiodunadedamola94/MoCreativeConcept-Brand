"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AboutContent() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));

    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #0c0c14;
          --bg1: #111119;
          --bg2: #16161f;
          --bg3: #1c1c26;
          --border: rgba(255, 255, 255, 0.07);
          --border2: rgba(255, 255, 255, 0.11);
          --border3: rgba(255, 255, 255, 0.18);
          --indigo: #5b5bd6;
          --indigo2: #7c7cef;
          --indigo-dim: rgba(91, 91, 214, 0.15);
          --sky: #22d3ee;
          --pulse: #10b981;
          --amber: #f59e0b;
          --rose: #f43f5e;
          --warm: #ffffff;
          --warm2: #e8e8f0;
          --muted: #8b8fa8;
          --muted2: #3a3d52;
          --font: var(--font-inter), sans-serif;
          --mono: var(--font-jbmono), monospace;
        }
        html {
          scroll-behavior: smooth;
        }
        body {
          background: var(--bg);
          color: var(--warm2);
          font-family: var(--font);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        .ann-bar {
          background: #13131e;
          border-bottom: 0.5px solid var(--border);
          padding: 9px 24px;
          text-align: center;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .ann-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--pulse);
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        .nav {
          background: rgba(12, 12, 20, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 0.5px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 0 max(24px, 4vw);
        }
        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
        }
        .nav-logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .nav-logo-mark {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--indigo-dim);
          border: 0.5px solid rgba(91, 91, 214, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 13px;
          color: var(--indigo2);
        }
        .nav-logo-text {
          font-weight: 700;
          font-size: 15px;
          color: var(--warm);
          letter-spacing: -0.02em;
        }
        .nav-logo-sub {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted2);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: block;
          margin-top: 1px;
        }
        .nav-center {
          display: flex;
          gap: 4px;
        }
        .nl {
          font-size: 13px;
          font-weight: 400;
          color: var(--muted);
          text-decoration: none;
          padding: 6px 14px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }
        .nl:hover {
          color: var(--warm);
          background: rgba(255, 255, 255, 0.05);
        }
        .nl.active {
          color: var(--warm);
        }
        .nav-cta {
          background: var(--indigo);
          color: var(--warm);
          border: none;
          border-radius: 7px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .nav-cta:hover {
          opacity: 0.88;
        }
        @media (max-width: 768px) {
          .nav-center {
            display: none;
          }
        }

        .page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 max(24px, 4vw) 100px;
        }

        .hero {
          padding: 72px 0 56px;
          position: relative;
          border-bottom: 0.5px solid var(--border);
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .hero-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.09) 1px,
            transparent 1px
          );
          background-size: 28px 28px;
          mask-image: radial-gradient(
            ellipse 80% 70% at 70% 40%,
            black 0%,
            transparent 100%
          );
          opacity: 0.3;
        }
        .hglow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
        }
        .hg1 {
          width: 400px;
          height: 400px;
          background: rgba(91, 91, 214, 0.1);
          top: -80px;
          right: -60px;
          animation: gd 20s ease-in-out infinite alternate;
        }
        @keyframes gd {
          from {
            transform: translate(0, 0);
          }
          to {
            transform: translate(20px, 16px);
          }
        }

        .hero-inner {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .hero-inner {
            grid-template-columns: 1fr;
          }
          .hero-contact-block {
            order: -1;
          }
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 0.5px solid var(--border2);
          border-radius: 6px;
          padding: 5px 12px;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.04em;
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.02);
        }
        .badge-pip {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--pulse);
        }

        .hero-name {
          font-size: clamp(44px, 7vw, 80px);
          font-weight: 900;
          letter-spacing: -0.045em;
          line-height: 0.92;
          color: var(--warm);
          margin-bottom: 10px;
        }
        .hero-name .accent {
          color: var(--indigo2);
        }
        .hero-role {
          font-family: var(--mono);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--indigo2);
          margin-bottom: 20px;
        }
        .hero-tagline {
          font-size: clamp(15px, 1.6vw, 18px);
          color: var(--muted);
          font-weight: 300;
          line-height: 1.65;
          max-width: 560px;
          font-style: italic;
          margin-bottom: 32px;
        }

        .hero-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-p {
          background: var(--indigo);
          color: var(--warm);
          border: none;
          border-radius: 8px;
          padding: 11px 22px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: opacity 0.15s, transform 0.15s;
        }
        .btn-p:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .btn-s {
          background: transparent;
          color: var(--warm2);
          border: 0.5px solid var(--border3);
          border-radius: 8px;
          padding: 11px 22px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: border-color 0.2s, background 0.2s;
        }
        .btn-s:hover {
          border-color: var(--indigo2);
          background: var(--indigo-dim);
        }

        .hero-contact-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 240px;
        }
        .hc-label {
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted2);
          margin-bottom: 4px;
        }
        .hc-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--bg2);
          border: 0.5px solid var(--border2);
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s;
        }
        .hc-item:hover {
          border-color: var(--indigo2);
        }
        .hc-val {
          font-size: 12px;
          color: var(--warm2);
        }
        .hc-arr {
          color: var(--indigo2);
          font-size: 14px;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.08);
          border: 0.5px solid rgba(16, 185, 129, 0.25);
          border-radius: 99px;
          padding: 6px 12px;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--pulse);
          letter-spacing: 0.06em;
          margin-top: 4px;
          align-self: flex-start;
        }
        .sdot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--pulse);
          animation: blink 2s ease-in-out infinite;
        }

        .section {
          padding: 64px 0;
        }
        .s-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted2);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .s-label::after {
          content: "";
          flex: 1;
          height: 0.5px;
          background: var(--border);
        }
        .s-title {
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1;
          color: var(--warm);
          margin-bottom: 40px;
        }
        .s-title .accent {
          color: var(--indigo2);
        }

        .mv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 64px;
        }
        @media (max-width: 640px) {
          .mv-grid {
            grid-template-columns: 1fr;
          }
        }
        .mv-card {
          background: var(--bg2);
          border: 0.5px solid var(--border2);
          border-radius: 14px;
          padding: 28px 28px 24px;
          position: relative;
          overflow: hidden;
        }
        .mv-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          border-radius: 2px 0 0 2px;
        }
        .mv-card.mission::before {
          background: var(--indigo);
        }
        .mv-card.vision::before {
          background: var(--sky);
        }
        .mv-type {
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .mv-card.mission .mv-type {
          color: var(--indigo2);
        }
        .mv-card.vision .mv-type {
          color: var(--sky);
        }
        .mv-text {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.7;
          font-weight: 300;
        }

        .pillar-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 0.5px solid var(--border2);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 64px;
        }
        @media (max-width: 768px) {
          .pillar-grid {
            grid-template-columns: 1fr;
          }
        }
        .pillar {
          background: var(--bg1);
          padding: 32px 28px;
          transition: background 0.2s;
        }
        .pillar:hover {
          background: var(--bg2);
        }
        .pillar-icon {
          width: 40px;
          height: 40px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: 0.5px solid var(--border2);
          margin-bottom: 18px;
        }
        .pillar-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--warm);
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }
        .pillar-desc {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.65;
        }

        .exp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 64px;
        }
        @media (max-width: 768px) {
          .exp-grid {
            grid-template-columns: 1fr;
          }
        }
        .exp-card {
          background: var(--bg2);
          border: 0.5px solid var(--border2);
          border-radius: 14px;
          padding: 22px 24px;
          transition: border-color 0.2s;
        }
        .exp-card:hover {
          border-color: rgba(91, 91, 214, 0.35);
        }
        .exp-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 12px;
        }
        .exp-company {
          font-size: 15px;
          font-weight: 700;
          color: var(--warm);
          letter-spacing: -0.02em;
        }
        .exp-period {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted2);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: var(--bg3);
          border: 0.5px solid var(--border);
          border-radius: 4px;
          padding: 3px 8px;
          white-space: nowrap;
        }
        .exp-role {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--indigo2);
          letter-spacing: 0.06em;
          margin-bottom: 12px;
        }
        .exp-metrics {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          padding: 12px 0;
          border-top: 0.5px solid var(--border);
          border-bottom: 0.5px solid var(--border);
          margin-bottom: 12px;
        }
        .em-v {
          font-size: 20px;
          font-weight: 800;
          color: var(--pulse);
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .em-l {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted2);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .exp-desc {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.6;
        }

        .skills-layout {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 64px;
        }
        @media (max-width: 768px) {
          .skills-layout {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .skills-layout {
            grid-template-columns: 1fr;
          }
        }
        .sg-title {
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted2);
          margin-bottom: 12px;
        }
        .skill-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .stag {
          font-size: 11px;
          color: var(--muted);
          background: var(--bg2);
          border: 0.5px solid var(--border2);
          border-radius: 5px;
          padding: 4px 10px;
          font-family: var(--mono);
          letter-spacing: 0.02em;
          transition: border-color 0.15s, color 0.15s;
        }
        .stag:hover {
          border-color: var(--indigo2);
          color: var(--warm2);
        }

        .palette-strip {
          display: flex;
          border-radius: 10px;
          overflow: hidden;
          height: 8px;
          margin-bottom: 64px;
        }
        .ps {
          flex: 1;
        }

        .score-section {
          background: var(--bg2);
          border: 0.5px solid var(--border2);
          border-radius: 14px;
          padding: 32px 32px 28px;
          margin-bottom: 64px;
        }
        .score-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 28px;
        }
        @media (max-width: 768px) {
          .score-grid {
            grid-template-columns: 1fr;
          }
        }
        .sg-head {
          font-size: 13px;
          font-weight: 600;
          color: var(--warm);
          margin-bottom: 4px;
        }
        .sg-sub {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted2);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 7px;
        }
        .bar-label {
          font-size: 11px;
          color: var(--muted);
          flex: 1;
        }
        .bar-track {
          flex: 1.5;
          height: 3px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .bar-fill {
          height: 3px;
          border-radius: 2px;
        }
        .bar-pct {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted2);
          width: 30px;
          text-align: right;
        }

        .cta-strip {
          border: 0.5px solid var(--border2);
          border-radius: 14px;
          padding: 56px 40px;
          text-align: center;
          background: var(--bg2);
          position: relative;
          overflow: hidden;
          margin-bottom: 0;
        }
        .cta-strip::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 60% 70% at 50% 0%,
            rgba(91, 91, 214, 0.09) 0%,
            transparent 70%
          );
          pointer-events: none;
        }
        .cta-eyebrow {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 20px;
        }
        .cta-title {
          font-size: clamp(24px, 3.5vw, 40px);
          font-weight: 800;
          letter-spacing: -0.035em;
          color: var(--warm);
          margin-bottom: 12px;
        }
        .cta-title .accent {
          color: var(--indigo2);
        }
        .cta-sub {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.65;
          margin-bottom: 8px;
        }
        .cta-note {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted2);
          margin-bottom: 36px;
          letter-spacing: 0.04em;
        }
        .cta-btns {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .footer-strip {
          padding: 28px 0;
          border-top: 0.5px solid var(--border);
          margin-top: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }
        .fn {
          font-size: 14px;
          font-weight: 700;
          color: var(--warm);
          letter-spacing: -0.02em;
        }
        .fn span {
          color: var(--indigo2);
        }
        .fl-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .fl {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted2);
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.15s;
        }
        .fl:hover {
          color: var(--warm);
        }
        .fl.cta {
          color: var(--sky);
        }

        .print-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 200;
        }
        .print-btn {
          background: var(--indigo);
          color: var(--warm);
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 4px 24px rgba(91, 91, 214, 0.4);
          transition: opacity 0.15s;
        }
        .print-btn:hover {
          opacity: 0.88;
        }
        @media print {
          .print-fab,
          .ann-bar,
          .nav {
            display: none;
          }
          .page {
            padding: 0;
          }
          body {
            background: #fff;
            color: #000;
          }
        }

        .reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal.show {
          opacity: 1;
          transform: translateY(0);
        }
        @media (max-width: 640px) {
          .page {
            padding: 0 20px 80px;
          }
        }
      `}</style>

      <div className="print-fab">
        <button className="print-btn" onClick={() => window.print()}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Save as PDF
        </button>
      </div>

      <div className="ann-bar">
        <span className="ann-dot"></span>
        Abiodun Adedamola · AI Product Designer · Motion Designer · Builder ·
        Lagos, Nigeria
      </div>

      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo-wrap">
            <div className="nav-logo-mark">MC</div>
            <div>
              <div className="nav-logo-text">MoCreativeConcept</div>
              <span className="nav-logo-sub">Brand One-Pager</span>
            </div>
          </Link>
          <div className="nav-center">
            <Link href="/" className="nl">
              Home
            </Link>
            <a
              href="https://mocreativeportfolio.lovable.app"
              target="_blank"
              rel="noopener"
              className="nl"
            >
              Work
            </a>
            <Link href="/motion" className="nl">
              Motion
            </Link>
            <Link href="/about" className="nl active">
              About
            </Link>
          </div>
          <a href="mailto:Abiodunadedamola94@gmail.com" className="nav-cta">
            Get in touch →
          </a>
        </div>
      </nav>

      <div className="page">
        {/* HERO */}
        <section className="hero">
          <div className="hero-bg">
            <div className="hero-dots"></div>
            <div className="hglow hg1"></div>
          </div>
          <div className="hero-inner">
            <div>
              <div className="hero-badge reveal">
                <span className="badge-pip"></span>Lagos, Nigeria · Remote ·
                Open to work
              </div>
              <h1 className="hero-name reveal" style={{ transitionDelay: ".05s" }}>
                Abiodun
                <br />
                <span className="accent">Adedamola.</span>
              </h1>
              <div className="hero-role reveal" style={{ transitionDelay: ".08s" }}>
                AI Product Designer · Motion Designer · Builder-Designer
              </div>
              <p className="hero-tagline reveal" style={{ transitionDelay: ".11s" }}>
                Where human intuition meets intelligent systems — I design
                the invisible infrastructure of great digital products, then
                build and ship them.
              </p>
              <div className="hero-ctas reveal" style={{ transitionDelay: ".14s" }}>
                <a
                  href="https://mocreativeportfolio.lovable.app"
                  target="_blank"
                  rel="noopener"
                  className="btn-p"
                >
                  View portfolio →
                </a>
                <Link href="/motion" className="btn-s">
                  Motion reel
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="hero-contact-block reveal" style={{ transitionDelay: ".18s" }}>
              <div className="hc-label">Contact</div>
              <a href="tel:+2348145361262" className="hc-item">
                <span className="hc-val">+234 814 536 1262</span>
                <span className="hc-arr">→</span>
              </a>
              <a href="mailto:Abiodunadedamola94@gmail.com" className="hc-item">
                <span className="hc-val" style={{ fontSize: "11px" }}>
                  Abiodunadedamola94@gmail.com
                </span>
                <span className="hc-arr">→</span>
              </a>
              <a
                href="https://mocreativeportfolio.lovable.app"
                target="_blank"
                rel="noopener"
                className="hc-item"
              >
                <span className="hc-val" style={{ fontSize: "11px" }}>
                  mocreativeportfolio.lovable.app
                </span>
                <span className="hc-arr">→</span>
              </a>
              <a
                href="https://linkedin.com/in/abiodun-adedamola"
                target="_blank"
                rel="noopener"
                className="hc-item"
              >
                <span className="hc-val">LinkedIn</span>
                <span className="hc-arr">→</span>
              </a>
              <div className="status-pill">
                <div className="sdot"></div>Open to work
              </div>
            </div>
          </div>
        </section>

        {/* MISSION / VISION */}
        <section className="section">
          <div className="s-label">Mission & Vision</div>
          <h2 className="s-title reveal">
            Purpose-driven design
            <br />
            for <span className="accent">intelligent systems.</span>
          </h2>
          <div className="mv-grid">
            <div className="mv-card mission reveal">
              <div className="mv-type">Mission</div>
              <div className="mv-text">
                To bridge the gap between human needs and AI-powered
                systems — designing products that don&apos;t just look good,
                but fundamentally change how people work, learn, and
                transact.
              </div>
            </div>
            <div className="mv-card vision reveal" style={{ transitionDelay: ".08s" }}>
              <div className="mv-type">Vision</div>
              <div className="mv-text">
                A world where every startup, school, and business in Africa
                and beyond operates on intelligent, beautifully designed
                digital infrastructure — built by designers who think like
                engineers and ship like founders.
              </div>
            </div>
          </div>
        </section>

        {/* BRAND PILLARS */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="s-label">Brand Pillars</div>
          <h2 className="s-title reveal">
            Three things that make
            <br />
            MoCreative <span className="accent">different.</span>
          </h2>
          <div className="pillar-grid reveal">
            <div className="pillar">
              <div
                className="pillar-icon"
                style={{
                  background: "rgba(91,91,214,0.1)",
                  borderColor: "rgba(91,91,214,0.22)",
                }}
              >
                ⬡
              </div>
              <div className="pillar-title">Systems thinker</div>
              <div className="pillar-desc">
                I don&apos;t design screens — I design workflows, AI agents,
                admin dashboards, and operational logic. Every product is a
                living system with inputs, outputs, and feedback loops.
              </div>
            </div>
            <div className="pillar">
              <div
                className="pillar-icon"
                style={{
                  background: "rgba(34,211,238,0.1)",
                  borderColor: "rgba(34,211,238,0.22)",
                }}
              >
                ⚡
              </div>
              <div className="pillar-title">Builder-designer</div>
              <div className="pillar-desc">
                Claude Code, Lovable, Figma, Vercel, Supabase — I take
                products from concept to live production without waiting
                for a full engineering team. Design and build are one
                motion.
              </div>
            </div>
            <div className="pillar">
              <div
                className="pillar-icon"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  borderColor: "rgba(16,185,129,0.22)",
                }}
              >
                ◎
              </div>
              <div className="pillar-title">Outcome-obsessed</div>
              <div className="pillar-desc">
                Every project carries a metric. 40% efficiency gains. 52%
                faster response times. 28% higher lead conversion. Design
                earns its seat at the business table through results.
              </div>
            </div>
          </div>
        </section>

        {/* QUALITY SCORES */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="s-label">Design quality scores</div>
          <div className="score-section reveal">
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--warm)",
                  marginBottom: "4px",
                  letterSpacing: "-0.02em",
                }}
              >
                Measured at every stage. Not just delivered.
              </div>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                Every project from MoCreativeConcept carries a quality
                benchmark — so outcomes are tracked, not assumed.
              </div>
            </div>
            <div className="score-grid">
              <div>
                <div className="sg-head">
                  Design Quality{" "}
                  <span
                    style={{
                      color: "var(--indigo2)",
                      fontSize: "22px",
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    91
                  </span>
                  <span style={{ color: "var(--muted2)", fontSize: "13px" }}>
                    /100
                  </span>
                </div>
                <div className="sg-sub">DQS · Visual & System</div>
                {[
                  ["Visual clarity", 94],
                  ["System coherence", 88],
                  ["Accessibility", 91],
                  ["Outcome delivery", 96],
                ].map(([label, pct]) => (
                  <div className="bar-row" key={label}>
                    <span className="bar-label">{label}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${pct}%`, background: "var(--indigo)" }}
                      ></div>
                    </div>
                    <span className="bar-pct">{pct}%</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="sg-head">
                  Motion Quality{" "}
                  <span
                    style={{
                      color: "var(--sky)",
                      fontSize: "22px",
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    90
                  </span>
                  <span style={{ color: "var(--muted2)", fontSize: "13px" }}>
                    /100
                  </span>
                </div>
                <div className="sg-sub">MQS · Animation</div>
                {[
                  ["Timing precision", 90],
                  ["Brand coherence", 95],
                  ["Interaction feel", 88],
                  ["Purposeful motion", 93],
                ].map(([label, pct]) => (
                  <div className="bar-row" key={label}>
                    <span className="bar-label">{label}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${pct}%`, background: "var(--sky)" }}
                      ></div>
                    </div>
                    <span className="bar-pct">{pct}%</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="sg-head">
                  Outcome Quality{" "}
                  <span
                    style={{
                      color: "var(--pulse)",
                      fontSize: "22px",
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    86
                  </span>
                  <span style={{ color: "var(--muted2)", fontSize: "13px" }}>
                    /100
                  </span>
                </div>
                <div className="sg-sub">OQS · Real results</div>
                {[
                  ["Efficiency gain", 40],
                  ["Speed improvement", 52],
                  ["Conversion lift", 28],
                  ["Engagement up", 60],
                ].map(([label, pct]) => (
                  <div className="bar-row" key={label}>
                    <span className="bar-label">{label}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${pct}%`, background: "var(--pulse)" }}
                      ></div>
                    </div>
                    <span className="bar-pct">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* EXPERIENCE */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="s-label">Experience highlights</div>
          <h2 className="s-title reveal">
            Projects that
            <br />
            <span className="accent">moved the needle.</span>
          </h2>
          <div className="exp-grid">
            <div className="exp-card reveal">
              <div className="exp-top">
                <div>
                  <div className="exp-company">LeapTra · AI SaaS</div>
                  <div className="exp-role">Product Designer</div>
                </div>
                <span className="exp-period">Sept 2025 – Present</span>
              </div>
              <div className="exp-metrics">
                <div>
                  <div className="em-v">40%</div>
                  <div className="em-l">Efficiency</div>
                </div>
                <div>
                  <div className="em-v">52%</div>
                  <div className="em-l">Faster flows</div>
                </div>
                <div>
                  <div className="em-v">28%</div>
                  <div className="em-l">Conversion</div>
                </div>
              </div>
              <div className="exp-desc">
                Designed AI agents for sales, onboarding, and customer
                support automation. Built email organiser, lead qualifier,
                and admin dashboards for efficiency monitoring.
              </div>
            </div>

            <div className="exp-card reveal" style={{ transitionDelay: ".06s" }}>
              <div className="exp-top">
                <div>
                  <div className="exp-company">Jomppa · Artisan PWA</div>
                  <div className="exp-role">Product Designer</div>
                </div>
                <span className="exp-period">Oct 2025 – Present</span>
              </div>
              <div className="exp-metrics">
                <div>
                  <div className="em-v">45%</div>
                  <div className="em-l">Load time</div>
                </div>
                <div>
                  <div className="em-v">40%</div>
                  <div className="em-l">Handoff</div>
                </div>
                <div>
                  <div className="em-v">25%</div>
                  <div className="em-l">Onboarding</div>
                </div>
              </div>
              <div className="exp-desc">
                Delivered MVP PWA and scalable design system. Improved
                artisan-client connection and platform engagement
                end-to-end.
              </div>
            </div>

            <div className="exp-card reveal" style={{ transitionDelay: ".1s" }}>
              <div className="exp-top">
                <div>
                  <div className="exp-company">Young Titans · NGO</div>
                  <div className="exp-role">Product Design Intern</div>
                </div>
                <span className="exp-period">Jul – Oct 2025</span>
              </div>
              <div className="exp-metrics">
                <div>
                  <div className="em-v">52%</div>
                  <div className="em-l">Engagement</div>
                </div>
                <div>
                  <div className="em-v">50+</div>
                  <div className="em-l">Interviews</div>
                </div>
              </div>
              <div className="exp-desc">
                Led team of designers to ship WCAG 2.1-compliant website.
                Turned user research into measurable UX improvements across
                all key flows.
              </div>
            </div>

            <div className="exp-card reveal" style={{ transitionDelay: ".14s" }}>
              <div className="exp-top">
                <div>
                  <div className="exp-company">
                    Next Level Procurement · B2B
                  </div>
                  <div className="exp-role">Design Engineer & Strategist</div>
                </div>
                <span className="exp-period">2021 – Present</span>
              </div>
              <div className="exp-metrics">
                <div>
                  <div className="em-v">60%</div>
                  <div className="em-l">Social lift</div>
                </div>
                <div>
                  <div className="em-v">7yr</div>
                  <div className="em-l">Brand digital</div>
                </div>
              </div>
              <div className="exp-desc">
                Sole designer and developer — built landing page via AI
                vibe coding. Led rebrand and currently building procurement
                management system.
              </div>
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="s-label">Core competencies</div>
          <h2 className="s-title reveal">
            Skills that <span className="accent">ship products.</span>
          </h2>
          <div className="skills-layout reveal">
            <div className="skill-group">
              <div className="sg-title">Design & Research</div>
              <div className="skill-tags">
                {[
                  "UX Research",
                  "Interaction Design",
                  "Design Systems",
                  "Wireframing",
                  "Prototyping",
                  "WCAG Accessibility",
                  "Data-driven UX",
                ].map((t) => (
                  <span className="stag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="skill-group">
              <div className="sg-title">AI & Product</div>
              <div className="skill-tags">
                {[
                  "AI Product Design",
                  "Automation Design",
                  "Prompt Engineering",
                  "Vibe Coding",
                  "Full-stack Delivery",
                  "Systems Design",
                  "Agile",
                ].map((t) => (
                  <span className="stag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="skill-group">
              <div className="sg-title">Tools & Stack</div>
              <div className="skill-tags">
                {[
                  "Figma",
                  "Framer",
                  "Lovable",
                  "Claude Code",
                  "Vercel",
                  "Supabase",
                  "Notion",
                  "Webflow",
                  "Git",
                ].map((t) => (
                  <span className="stag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BRAND IDENTITY STRIP */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="s-label">Brand identity</div>
          <div className="palette-strip">
            {[
              "#0c0c14",
              "#16161f",
              "#1c1c26",
              "#5b5bd6",
              "#7c7cef",
              "#22d3ee",
              "#10b981",
              "#e8e8f0",
            ].map((c) => (
              <div className="ps" style={{ background: c }} key={c}></div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                color: "var(--muted2)",
              }}
            >
              Typography: Inter (body) · JetBrains Mono (labels)
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                color: "var(--muted2)",
              }}
            >
              Direction: Luminous Dark · Praxiomai-inspired
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[
              "B.Sc. Computer Science · NOUN",
              "NCE Comp. Sci. & Math · LASUED",
              "Design Thinking · IBMI Berlin",
            ].map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "10px",
                  color: "var(--muted2)",
                  background: "var(--bg2)",
                  border: "0.5px solid var(--border2)",
                  borderRadius: "4px",
                  padding: "3px 8px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="cta-strip reveal">
          <p className="cta-eyebrow">Ready to collaborate?</p>
          <h2 className="cta-title">
            Let&apos;s build something
            <br />
            that <span className="accent">actually ships.</span>
          </h2>
          <p className="cta-sub">
            Open to AI product design roles, motion projects, and brand
            collaborations.
          </p>
          <p className="cta-note">
            Lagos-based · Globally remote · No lengthy brief required.
          </p>
          <div className="cta-btns">
            <a href="mailto:Abiodunadedamola94@gmail.com" className="btn-p">
              Get in touch →
            </a>
            <a
              href="https://mocreativeportfolio.lovable.app"
              target="_blank"
              rel="noopener"
              className="btn-s"
            >
              View portfolio
            </a>
          </div>
        </div>

        <div className="footer-strip">
          <div className="fn">
            MoCreative<span>.</span>
          </div>
          <div className="fl-row">
            <Link href="/" className="fl">
              Home
            </Link>
            <Link href="/motion" className="fl">
              Motion
            </Link>
            <a href="mailto:Abiodunadedamola94@gmail.com" className="fl">
              Contact
            </a>
            <a
              href="https://mocreativeportfolio.lovable.app"
              target="_blank"
              rel="noopener"
              className="fl cta"
            >
              Portfolio →
            </a>
            <span className="fl" style={{ color: "var(--muted2)" }}>
              © 2026 MoCreativeConcept
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
