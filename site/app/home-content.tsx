"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function HomeContent() {
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

    const onScroll = () => {
      const y = window.scrollY;
      const hg1 = document.querySelector<HTMLElement>(".hg1");
      const hg2 = document.querySelector<HTMLElement>(".hg2");
      const dots = document.querySelector<HTMLElement>(".hero-dots");
      if (hg1) hg1.style.transform = `translate(${y * 0.03}px,${y * 0.015}px)`;
      if (hg2) hg2.style.transform = `translate(${-y * 0.02}px,${y * 0.01}px)`;
      if (dots) dots.style.transform = `translateY(${y * 0.08}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
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

        /* ─── ANNOUNCEMENT BAR ─── */
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
          display: inline-block;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }

        /* ─── NAV ─── */
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
          font-family: var(--font);
          font-weight: 900;
          font-size: 13px;
          color: var(--indigo2);
          letter-spacing: -0.02em;
        }
        .nav-logo-text {
          font-family: var(--font);
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
          align-items: center;
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
        .nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nav-count {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.04em;
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
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.15s, transform 0.15s;
        }
        .nav-cta:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        @media (max-width: 768px) {
          .nav-center {
            display: none;
          }
          .nav-count {
            display: none;
          }
        }

        /* ─── HERO ─── */
        .hero {
          padding: 80px max(24px, 4vw) 100px;
          position: relative;
          overflow: hidden;
          min-height: calc(100vh - 100px);
          display: flex;
          align-items: center;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .hero-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.12) 1px,
            transparent 1px
          );
          background-size: 28px 28px;
          mask-image: radial-gradient(
            ellipse 70% 70% at 60% 40%,
            black 0%,
            transparent 100%
          );
          opacity: 0.4;
        }
        .hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }
        .hg1 {
          width: 520px;
          height: 520px;
          background: rgba(91, 91, 214, 0.15);
          top: -10%;
          right: 10%;
          animation: hgdrift 20s ease-in-out infinite alternate;
        }
        .hg2 {
          width: 300px;
          height: 300px;
          background: rgba(34, 211, 238, 0.07);
          bottom: 10%;
          right: 30%;
          animation: hgdrift 26s ease-in-out infinite alternate-reverse;
        }
        @keyframes hgdrift {
          from {
            transform: translate(0, 0);
          }
          to {
            transform: translate(30px, 24px);
          }
        }

        .hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .hero-inner {
            grid-template-columns: 1fr;
          }
          .hero-mockup {
            display: none;
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
          margin-bottom: 28px;
          background: rgba(255, 255, 255, 0.03);
        }
        .badge-pip {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--indigo2);
        }
        .badge-sep {
          color: var(--border3);
          margin: 0 4px;
        }

        .hero-h1 {
          font-size: clamp(48px, 7vw, 78px);
          font-weight: 900;
          letter-spacing: -0.045em;
          line-height: 1;
          color: var(--warm);
          margin-bottom: 28px;
        }
        .hero-h1 .accent {
          color: var(--indigo2);
        }

        .hero-sub {
          font-size: clamp(15px, 1.6vw, 18px);
          color: var(--muted);
          font-weight: 400;
          line-height: 1.65;
          margin-bottom: 14px;
          max-width: 480px;
        }
        .hero-sub2 {
          font-size: 14px;
          color: var(--muted2);
          line-height: 1.6;
          margin-bottom: 40px;
          max-width: 440px;
        }

        .hero-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .cta-primary {
          background: var(--indigo);
          color: var(--warm);
          border: none;
          border-radius: 8px;
          padding: 13px 26px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.15s, transform 0.15s;
        }
        .cta-primary:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .cta-ghost {
          background: transparent;
          color: var(--warm2);
          border: none;
          padding: 13px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: color 0.15s;
        }
        .cta-ghost:hover {
          color: var(--warm);
        }

        .hero-mockup {
          position: relative;
        }
        .mockup-window {
          background: #14141e;
          border: 0.5px solid var(--border2);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6),
            0 0 0 0.5px rgba(255, 255, 255, 0.08);
        }
        .mockup-bar {
          background: #1a1a26;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 0.5px solid var(--border);
        }
        .mock-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .mock-title {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted2);
          margin-left: 8px;
          letter-spacing: 0.04em;
        }
        .mockup-body {
          display: grid;
          grid-template-columns: 140px 1fr;
          min-height: 300px;
        }
        .mock-sidebar {
          background: #111119;
          border-right: 0.5px solid var(--border);
          padding: 12px 0;
        }
        .mock-nav-item {
          padding: 7px 14px;
          font-size: 11px;
          color: var(--muted2);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: default;
        }
        .mock-nav-item.active {
          background: rgba(91, 91, 214, 0.12);
          color: var(--indigo2);
          border-right: 2px solid var(--indigo2);
        }
        .mock-nav-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted2);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px 14px 6px;
        }
        .mock-content {
          padding: 16px;
        }
        .mock-greeting {
          font-size: 13px;
          font-weight: 600;
          color: var(--warm);
          margin-bottom: 3px;
        }
        .mock-sub {
          font-size: 11px;
          color: var(--muted2);
          margin-bottom: 12px;
        }
        .mock-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 12px;
        }
        .mock-stat {
          background: #1a1a26;
          border: 0.5px solid var(--border);
          border-radius: 6px;
          padding: 8px 10px;
        }
        .mock-stat-val {
          font-size: 16px;
          font-weight: 700;
          color: var(--warm);
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .mock-stat-label {
          font-family: var(--mono);
          font-size: 8px;
          color: var(--muted2);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 2px;
        }
        .mock-bar-section {
          background: #1a1a26;
          border: 0.5px solid var(--border);
          border-radius: 6px;
          padding: 10px;
        }
        .mock-bar-title {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted2);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
        }
        .mock-bar-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 2px;
          margin-bottom: 5px;
        }
        .mock-bar-fill {
          height: 4px;
          border-radius: 2px;
          background: var(--indigo);
        }
        .mock-status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--mono);
          font-size: 9px;
          color: var(--pulse);
          margin-top: 8px;
        }
        .mock-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--pulse);
        }

        /* ─── SECTION BASE ─── */
        .section {
          padding: 100px max(24px, 4vw);
        }
        .s-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .s-eyebrow {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--indigo2);
          margin-bottom: 12px;
        }
        .s-title {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1;
          color: var(--warm);
          margin-bottom: 16px;
        }
        .s-title .accent {
          color: var(--indigo2);
        }
        .s-rule {
          width: 48px;
          height: 2px;
          background: var(--indigo);
          border-radius: 1px;
          margin: 0 auto 40px;
        }
        .s-subtitle {
          font-size: 16px;
          color: var(--muted);
          line-height: 1.7;
          text-align: center;
          max-width: 640px;
          margin: 0 auto 60px;
        }

        /* ─── SCORE CARDS ─── */
        .score-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 80px;
        }
        @media (max-width: 900px) {
          .score-grid {
            grid-template-columns: 1fr;
          }
        }
        .score-card {
          background: var(--bg2);
          border: 0.5px solid var(--border2);
          border-radius: 14px;
          padding: 28px 28px 24px;
          overflow: hidden;
        }
        .sc-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .sc-label-pill {
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted2);
          background: var(--bg3);
          border: 0.5px solid var(--border);
          border-radius: 4px;
          padding: 3px 8px;
        }
        .sc-title {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: var(--indigo2);
          margin-bottom: 4px;
        }
        .sc-desc-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--muted2);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .sc-desc {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .sc-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .sc-bar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .sc-bar-label {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted2);
          letter-spacing: 0.02em;
          flex: 1;
        }
        .sc-bar-track {
          flex: 2;
          height: 3px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .sc-bar-fill {
          height: 3px;
          border-radius: 2px;
          background: var(--indigo);
        }
        .sc-bar-pct {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted);
          width: 32px;
          text-align: right;
        }
        .sc-overall {
          display: flex;
          align-items: baseline;
          gap: 4px;
          border-top: 0.5px solid var(--border);
          padding-top: 16px;
        }
        .sc-overall-label {
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted2);
          flex: 1;
        }
        .sc-overall-val {
          font-size: 36px;
          font-weight: 900;
          color: var(--warm);
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .sc-overall-denom {
          font-size: 14px;
          color: var(--muted2);
          font-weight: 400;
        }

        /* ─── FEATURE CARDS ─── */
        .feature-section {
          text-align: center;
          padding: 100px max(24px, 4vw);
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 60px;
          text-align: left;
        }
        @media (max-width: 900px) {
          .feature-grid {
            grid-template-columns: 1fr;
          }
        }
        .feat-card {
          background: var(--bg2);
          border: 0.5px solid var(--border2);
          border-radius: 14px;
          padding: 28px 26px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .feat-card:hover {
          border-color: rgba(91, 91, 214, 0.4);
          transform: translateY(-3px);
        }
        .feat-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .feat-icon {
          width: 32px;
          height: 32px;
          background: var(--bg3);
          border: 0.5px solid var(--border2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .feat-tag {
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted2);
        }
        .feat-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--warm);
          line-height: 1.3;
          margin-bottom: 12px;
        }
        .feat-desc {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.65;
        }
        .feat-mini {
          margin-top: 20px;
          background: var(--bg);
          border: 0.5px solid var(--border);
          border-radius: 8px;
          padding: 12px 14px;
        }
        .feat-mini-row {
          display: flex;
          justify-content: space-between;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted2);
          padding: 3px 0;
          border-bottom: 0.5px solid var(--border);
        }
        .feat-mini-row:last-child {
          border-bottom: none;
        }
        .feat-mini-val {
          color: var(--indigo2);
        }
        .feat-mini-done {
          color: var(--pulse);
        }

        /* ─── MARQUEE ─── */
        .marquee-wrap {
          border-top: 0.5px solid var(--border);
          border-bottom: 0.5px solid var(--border);
          padding: 13px 0;
          overflow: hidden;
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .mi {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted2);
          padding: 0 28px;
          white-space: nowrap;
        }
        .mi b {
          color: var(--indigo2);
          margin-right: 10px;
          font-weight: 400;
        }
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        /* ─── CTA SECTION ─── */
        .cta-section {
          padding: 100px max(24px, 4vw);
          text-align: center;
        }
        .cta-section .s-inner {
          max-width: 700px;
        }
        .cta-eyebrow {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 28px;
        }
        .cta-title {
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.1;
          color: var(--warm);
          margin-bottom: 14px;
        }
        .cta-title .accent {
          color: var(--indigo2);
        }
        .cta-sub {
          font-size: 16px;
          color: var(--muted);
          line-height: 1.65;
          margin-bottom: 8px;
        }
        .cta-sub2 {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--muted2);
          margin-bottom: 40px;
          letter-spacing: 0.04em;
        }
        .cta-btn {
          background: var(--indigo);
          color: var(--warm);
          border: none;
          border-radius: 8px;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          transition: opacity 0.15s, transform 0.15s;
        }
        .cta-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .cta-note {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted2);
          letter-spacing: 0.04em;
        }

        /* ─── FOOTER ─── */
        .footer {
          border-top: 0.5px solid var(--border);
          padding: 60px max(24px, 4vw) 40px;
        }
        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px 1fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 48px;
        }
        @media (max-width: 900px) {
          .footer-inner {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 500px) {
          .footer-inner {
            grid-template-columns: 1fr;
          }
        }
        .footer-brand-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--warm);
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .footer-brand-name span {
          color: var(--indigo2);
        }
        .footer-brand-sub {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .footer-tagline {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--muted2);
          letter-spacing: 0.04em;
          margin-bottom: 14px;
        }
        .footer-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--pulse);
          letter-spacing: 0.06em;
        }
        .fstatus-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--pulse);
        }
        .footer-col-title {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted2);
          margin-bottom: 16px;
        }
        .footer-link {
          display: block;
          font-size: 13px;
          color: var(--muted);
          text-decoration: none;
          margin-bottom: 10px;
          transition: color 0.15s;
        }
        .footer-link:hover {
          color: var(--warm);
        }
        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 24px;
          border-top: 0.5px solid var(--border);
        }
        .footer-copy {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted2);
        }
        .footer-note {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted2);
        }

        /* ─── REVEAL ─── */
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal.show {
          opacity: 1;
          transform: translateY(0);
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 640px) {
          .hero {
            padding: 40px 20px 60px;
          }
          .section,
          .feature-section,
          .cta-section {
            padding: 60px 20px;
          }
          .footer {
            padding: 40px 20px 28px;
          }
        }
      `}</style>

      {/* ANNOUNCEMENT BAR */}
      <div className="ann-bar">
        <span className="ann-dot"></span>
        Abiodun Adedamola · AI Product Designer · Motion Designer · Builder ·
        Lagos, Nigeria · Open to work
      </div>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo-wrap">
            <div className="nav-logo-mark">MC</div>
            <div>
              <div className="nav-logo-text">MoCreativeConcept</div>
              <span className="nav-logo-sub">Product Intelligence</span>
            </div>
          </Link>
          <div className="nav-center">
            <Link href="/" className="nl active">
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
            <Link href="/about" className="nl">
              About
            </Link>
          </div>
          <div className="nav-right">
            <span className="nav-count">5+ motion projects</span>
            <a
              href="mailto:Abiodunadedamola94@gmail.com"
              className="nav-cta"
            >
              Get in touch →
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-dots"></div>
          <div className="hero-glow hg1"></div>
          <div className="hero-glow hg2"></div>
        </div>
        <div className="hero-inner">
          <div>
            <div className="hero-badge reveal">
              <span className="badge-pip"></span>
              Now available
              <span className="badge-sep">·</span>
              Open to work
            </div>
            <h1 className="hero-h1 reveal" style={{ transitionDelay: ".06s" }}>
              The design brand
              <br />
              that <span className="accent">ships.</span>
            </h1>
            <p className="hero-sub reveal" style={{ transitionDelay: ".1s" }}>
              AI product design, motion, and brand — built to production.
              Every project has a metric.
            </p>
            <p
              className="hero-sub2 reveal"
              style={{ transitionDelay: ".13s" }}
            >
              MoCreativeConcept turns complex product problems into
              intelligent, animated digital experiences — then ships them
              live without waiting for a full team.
            </p>
            <div
              className="hero-ctas reveal"
              style={{ transitionDelay: ".17s" }}
            >
              <a
                href="https://mocreativeportfolio.lovable.app"
                target="_blank"
                rel="noopener"
                className="cta-primary"
              >
                View portfolio →
              </a>
              <Link href="/motion" className="cta-ghost">
                See motion reel
                <svg
                  width="14"
                  height="14"
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
          {/* Mockup window right side */}
          <div className="hero-mockup reveal" style={{ transitionDelay: ".2s" }}>
            <div className="mockup-window">
              <div className="mockup-bar">
                <div className="mock-dot" style={{ background: "#ff5f56" }}></div>
                <div className="mock-dot" style={{ background: "#febc2e" }}></div>
                <div className="mock-dot" style={{ background: "#27c840" }}></div>
                <span className="mock-title">mocreativeconcept — workspace</span>
              </div>
              <div className="mockup-body">
                <div className="mock-sidebar">
                  <div className="mock-nav-label">Navigation</div>
                  <div className="mock-nav-item active">◈ &nbsp;Portfolio</div>
                  <div className="mock-nav-item">◎ &nbsp;Motion</div>
                  <div className="mock-nav-label">Projects</div>
                  <div className="mock-nav-item">LeapTra AI</div>
                  <div className="mock-nav-item">Jomppa PWA</div>
                  <div className="mock-nav-item">Fanta Motion</div>
                  <div className="mock-nav-item">Liquid Glass</div>
                </div>
                <div className="mock-content">
                  <div className="mock-greeting">Good evening</div>
                  <div className="mock-sub">
                    MoCreativeConcept workspace · 5 motion projects
                  </div>
                  <div className="mock-stats">
                    <div className="mock-stat">
                      <div className="mock-stat-val">40%</div>
                      <div className="mock-stat-label">Efficiency</div>
                    </div>
                    <div className="mock-stat">
                      <div className="mock-stat-val">52%</div>
                      <div className="mock-stat-label">Faster</div>
                    </div>
                    <div className="mock-stat">
                      <div className="mock-stat-val">28%</div>
                      <div className="mock-stat-label">Conversion</div>
                    </div>
                    <div className="mock-stat">
                      <div className="mock-stat-val">5+</div>
                      <div className="mock-stat-label">Motion</div>
                    </div>
                  </div>
                  <div className="mock-bar-section">
                    <div className="mock-bar-title">
                      <span>Design quality</span>
                      <span style={{ color: "var(--indigo2)" }}>13 issues</span>
                    </div>
                    <div className="mock-bar-track">
                      <div className="mock-bar-fill" style={{ width: "88%" }}></div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "var(--mono)",
                        fontSize: "9px",
                        color: "var(--muted2)",
                        marginBottom: "6px",
                      }}
                    >
                      <span>1 medium</span>
                      <span>88%</span>
                    </div>
                    <div className="mock-bar-track">
                      <div
                        className="mock-bar-fill"
                        style={{ width: "94%", background: "var(--pulse)" }}
                      ></div>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "9px",
                        color: "var(--muted2)",
                        marginBottom: "4px",
                      }}
                    >
                      Motion quality · 94%
                    </div>
                    <div className="mock-status">
                      <div className="mock-status-dot"></div>All systems
                      operational
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track" aria-hidden="true">
          {[0, 1].map((i) => (
            <span key={i}>
              <span className="mi">
                <b>✦</b>AI Product Design
              </span>
              <span className="mi">
                <b>✦</b>Motion & Animation
              </span>
              <span className="mi">
                <b>✦</b>Design Systems
              </span>
              <span className="mi">
                <b>✦</b>Figma Smart Animate
              </span>
              <span className="mi">
                <b>✦</b>Vibe Coding
              </span>
              <span className="mi">
                <b>✦</b>Vercel & Supabase
              </span>
              <span className="mi">
                <b>✦</b>Fintech UX
              </span>
              <span className="mi">
                <b>✦</b>Lagos → World
              </span>
              <span className="mi">
                <b>✦</b>Builder Designer
              </span>
              <span className="mi">
                <b>✦</b>Claude Code
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* SCORE CARDS */}
      <section className="section">
        <div className="s-inner">
          <div style={{ textAlign: "center" }}>
            <div className="s-eyebrow">Measured at every stage</div>
            <h2 className="s-title" style={{ textAlign: "center" }}>
              Every project scores.
              <br />
              Not just delivered.
            </h2>
            <div className="s-rule"></div>
            <p className="s-subtitle">
              Every design deliverable from MoCreativeConcept carries a
              metric — efficiency gains, conversion lifts, and motion
              quality scores — so you always know the value of each stage.
            </p>
          </div>
          <div className="score-grid reveal">
            <div className="score-card">
              <div className="sc-top">
                <div className="sc-title" style={{ color: "var(--indigo2)" }}>
                  DQS
                </div>
                <span className="sc-label-pill">Design</span>
              </div>
              <div className="sc-desc-label">Design Quality Score</div>
              <div className="sc-desc">
                Measures how well each UI design is grounded in user needs,
                business outcomes, and technical feasibility.
              </div>
              <div className="sc-bars">
                {[
                  ["Visual clarity", 94],
                  ["System coherence", 88],
                  ["Accessibility", 91],
                  ["Business alignment", 87],
                  ["Outcome delivery", 96],
                ].map(([label, pct]) => (
                  <div className="sc-bar-row" key={label}>
                    <span className="sc-bar-label">{label}</span>
                    <div className="sc-bar-track">
                      <div className="sc-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="sc-bar-pct">{pct}%</span>
                  </div>
                ))}
              </div>
              <div className="sc-overall">
                <span className="sc-overall-label">Overall DQS</span>
                <span className="sc-overall-val">91</span>
                <span className="sc-overall-denom">/100</span>
              </div>
            </div>

            <div className="score-card">
              <div className="sc-top">
                <div className="sc-title" style={{ color: "var(--sky)" }}>
                  MQS
                </div>
                <span className="sc-label-pill">Motion</span>
              </div>
              <div className="sc-desc-label">Motion Quality Score</div>
              <div className="sc-desc">
                Scores how well each animation serves user comprehension,
                brand feel, and interaction delight — not just aesthetics.
              </div>
              <div className="sc-bars">
                {[
                  ["Timing precision", 90],
                  ["Brand coherence", 95],
                  ["Interaction feel", 88],
                  ["Performance", 85],
                  ["Purposeful motion", 93],
                ].map(([label, pct]) => (
                  <div className="sc-bar-row" key={label}>
                    <span className="sc-bar-label">{label}</span>
                    <div className="sc-bar-track">
                      <div
                        className="sc-bar-fill"
                        style={{ width: `${pct}%`, background: "var(--sky)" }}
                      ></div>
                    </div>
                    <span className="sc-bar-pct">{pct}%</span>
                  </div>
                ))}
              </div>
              <div className="sc-overall">
                <span className="sc-overall-label">Overall MQS</span>
                <span className="sc-overall-val">90</span>
                <span className="sc-overall-denom">/100</span>
              </div>
            </div>

            <div className="score-card">
              <div className="sc-top">
                <div className="sc-title" style={{ color: "var(--pulse)" }}>
                  OQS
                </div>
                <span className="sc-label-pill">Outcomes</span>
              </div>
              <div className="sc-desc-label">Outcome Quality Score</div>
              <div className="sc-desc">
                Tracks real business results from each shipped design —
                efficiency gains, conversion lifts, and engagement
                improvements.
              </div>
              <div className="sc-bars">
                {[
                  ["Efficiency gain", 40],
                  ["Speed improvement", 52],
                  ["Conversion lift", 28],
                  ["Engagement up", 52],
                  ["Social lift", 60],
                ].map(([label, pct]) => (
                  <div className="sc-bar-row" key={label}>
                    <span className="sc-bar-label">{label}</span>
                    <div className="sc-bar-track">
                      <div
                        className="sc-bar-fill"
                        style={{ width: `${pct}%`, background: "var(--pulse)" }}
                      ></div>
                    </div>
                    <span className="sc-bar-pct">{pct}%</span>
                  </div>
                ))}
              </div>
              <div className="sc-overall">
                <span className="sc-overall-label">Overall OQS</span>
                <span className="sc-overall-val">86</span>
                <span className="sc-overall-denom">/100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="feature-section">
        <div className="s-inner">
          <div className="s-eyebrow">How it works</div>
          <h2 className="s-title">
            <span className="accent">MoCreativeConcept</span>
            <br />
            works while you focus.
          </h2>
          <div className="s-rule"></div>
          <p className="s-subtitle">
            Three pillars that make every project faster, sharper, and more
            impactful — from first brief to live production.
          </p>
          <div className="feature-grid reveal">
            <div className="feat-card">
              <div className="feat-top">
                <div className="feat-icon">⬡</div>
                <span className="feat-tag">Systems thinking</span>
              </div>
              <div className="feat-title">
                Designs the whole machine, not just the screen.
              </div>
              <div className="feat-desc">
                Every project starts with workflows, user journeys, and
                system logic — not just visual layouts. AI agents, admin
                dashboards, and operational flows all designed as living
                systems.
              </div>
              <div className="feat-mini">
                <div className="feat-mini-row">
                  <span>User flows mapped</span>
                  <span className="feat-mini-val">12</span>
                </div>
                <div className="feat-mini-row">
                  <span>Systems documented</span>
                  <span className="feat-mini-val">+7</span>
                </div>
                <div className="feat-mini-row">
                  <span>Design quality avg</span>
                  <span className="feat-mini-val">91</span>
                </div>
              </div>
            </div>

            <div className="feat-card">
              <div className="feat-top">
                <div className="feat-icon">⚡</div>
                <span className="feat-tag">Builder designer</span>
              </div>
              <div className="feat-title">
                3 specialists in one. Ships to production solo.
              </div>
              <div className="feat-desc">
                Claude Code, Lovable, Figma, Vercel, and Supabase — design
                and engineering in one motion. No handoff delays. Concept to
                live URL without waiting for a team.
              </div>
              <div className="feat-mini">
                <div className="feat-mini-row">
                  <span>Figma to Vercel</span>
                  <span className="feat-mini-val">Same day</span>
                </div>
                <div className="feat-mini-row">
                  <span>Lovable builds</span>
                  <span className="feat-mini-val">Live</span>
                </div>
                <div className="feat-mini-row">
                  <span>Dev handoff time</span>
                  <span className="feat-mini-done">↓ 40%</span>
                </div>
              </div>
            </div>

            <div className="feat-card">
              <div className="feat-top">
                <div className="feat-icon">◎</div>
                <span className="feat-tag">Outcome engine</span>
              </div>
              <div className="feat-title">
                Loops until the quality threshold is met.
              </div>
              <div className="feat-desc">
                Every deliverable is measured. Research → design → DQS
                evaluate → iterate. Design isn&apos;t done until the metric
                improves. Up to 3 iteration cycles per project phase.
              </div>
              <div className="feat-mini">
                <div className="feat-mini-row">
                  <span>Iteration 1</span>
                  <span style={{ color: "var(--muted2)" }}>DQS 71 — retry</span>
                </div>
                <div className="feat-mini-row">
                  <span>Iteration 2</span>
                  <span style={{ color: "var(--muted2)" }}>DQS 82 — retry</span>
                </div>
                <div className="feat-mini-row">
                  <span>Iteration 3</span>
                  <span className="feat-mini-done">DQS 91 ✓ done</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="s-inner" style={{ textAlign: "center" }}>
          <p className="cta-eyebrow">Built for teams who are done waiting</p>
          <h2 className="cta-title">
            Let&apos;s build something
            <br />
            that <span className="accent">actually ships.</span>
          </h2>
          <p className="cta-sub">
            AI product design, motion, and brand — with outcome metrics
            baked in.
          </p>
          <p className="cta-sub2">
            Open to remote roles & project collaborations. Lagos-based,
            globally wired.
          </p>
          <div>
            <a href="mailto:Abiodunadedamola94@gmail.com" className="cta-btn">
              Get in touch →
            </a>
          </div>
          <p className="cta-note">
            No lengthy brief required. Just a quick intro and we&apos;ll go
            from there.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand-name">
              MoCreative<span>.</span>
            </div>
            <div className="footer-brand-sub">
              The design brand that ships. AI product design, motion, and
              brand — built to production.
            </div>
            <div className="footer-tagline">Built for teams who ship.</div>
            <div className="footer-status">
              <div className="fstatus-dot"></div>All systems operational
            </div>
          </div>
          <div>
            <div className="footer-col-title">Portfolio</div>
            <a
              href="https://mocreativeportfolio.lovable.app"
              target="_blank"
              rel="noopener"
              className="footer-link"
            >
              Product work
            </a>
            <Link href="/motion" className="footer-link">
              Motion reel
            </Link>
            <Link href="/about" className="footer-link">
              Brand one-pager
            </Link>
            <a
              href="mailto:Abiodunadedamola94@gmail.com"
              className="footer-link"
            >
              Get in touch
            </a>
          </div>
          <div>
            <div className="footer-col-title">Projects</div>
            <a
              href="https://mocreativeportfolio.lovable.app"
              target="_blank"
              rel="noopener"
              className="footer-link"
            >
              LeapTra AI
            </a>
            <a
              href="https://mocreativeportfolio.lovable.app"
              target="_blank"
              rel="noopener"
              className="footer-link"
            >
              Jomppa PWA
            </a>
            <a
              href="https://mocreativeportfolio.lovable.app"
              target="_blank"
              rel="noopener"
              className="footer-link"
            >
              Young Titans
            </a>
            <a
              href="https://mocreativeportfolio.lovable.app"
              target="_blank"
              rel="noopener"
              className="footer-link"
            >
              Next Level
            </a>
          </div>
          <div>
            <div className="footer-col-title">Connect</div>
            <a
              href="mailto:Abiodunadedamola94@gmail.com"
              className="footer-link"
            >
              Email
            </a>
            <a
              href="https://linkedin.com/in/abiodun-adedamola"
              target="_blank"
              rel="noopener"
              className="footer-link"
            >
              LinkedIn
            </a>
            <a href="tel:+2348145361262" className="footer-link">
              +234 814 536 1262
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener"
              className="footer-link"
            >
              Twitter / X
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">
            © 2026 MoCreativeConcept · Abiodun Adedamola. All rights
            reserved.
          </div>
          <div className="footer-note">
            AI-native design · Limited availability
          </div>
        </div>
      </footer>
    </>
  );
}
