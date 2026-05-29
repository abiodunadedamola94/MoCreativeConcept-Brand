# MoCreativeConcept — Brand & Portfolio Site

> **AI Product Designer · Motion Designer · Builder-Designer · Lagos → World**
> Live: [mocreativeconcept.vercel.app](https://mocreativeconcept.vercel.app)

---

## About

**MoCreativeConcept** is the personal creative brand of **Abiodun Adedamola** — an AI product designer, motion designer, and builder-designer based in Lagos, Nigeria.

This repository contains the full source for the MoCreativeConcept brand hub — a static HTML/CSS/JS site deployed on Vercel, covering six brand pillars:

| Pillar | Description |
|---|---|
| 🎨 **Portfolio** | Selected product design case studies with outcome metrics |
| 📦 **Products** | AI-powered tools and digital products built and shipped |
| 🛠 **Services** | Brand identity, UI/UX design, motion design, AI-native builds |
| 📚 **Edutech** | Design tutorials, Figma courses, AI design workflows |
| 📱 **Social Reels** | Motion design content, process videos, design breakdowns |
| 🚀 **Future Mission** | Vision, roadmap, and what MoCreativeConcept is building toward |

---

## Site Structure

```
mocreativeconcept-portfolio/
├── index.html              # Hub homepage — links to all pillars
├── motion.html             # Motion & animation portfolio (Figma prototypes)
├── about.html              # Brand one-pager / resume
├── vercel.json             # Vercel routing config
├── README.md               # This file
└── .gitignore              # Git ignore rules
```

---

## Tech Stack

| Layer | Tool |
|---|---|
| Markup | HTML5 (vanilla, no framework) |
| Styling | CSS3 with custom properties (dark-themed) |
| Scripts | Vanilla JavaScript (no dependencies) |
| Fonts | Google Fonts — Syne, DM Sans, DM Mono |
| Hosting | Vercel (free tier, auto-deploy on push) |
| Version control | GitHub |
| Design source | Figma |
| Build tools | None — pure static files |

---

## Brand Identity

```
Brand name     : MoCreativeConcept
Designer       : Abiodun Adedamola David
Location       : Lagos, Nigeria (Remote)
Primary colour : #7b68ee (Signal violet)
Accent colours : #38bdf8 (Sky), #10b981 (Pulse green)
Background     : #07070e (Void black)
Typography     : Syne (display) · DM Sans (body) · DM Mono (mono/labels)
Direction      : Luminous Dark
```

---

## Deployment

This site auto-deploys to Vercel on every push to `main`.

### Deploy from scratch

1. Fork or clone this repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Select this repo → leave all settings default → Deploy
4. (Optional) Set a custom domain in Vercel → Settings → Domains

### Local preview

No build step required. Open any `.html` file directly in your browser, or use a simple local server:

```bash
# Python (built-in)
python3 -m http.server 3000

# Node (if you have npx)
npx serve .
```

---

## Adding New Work

### Add a motion project
Open `motion.html` and find the relevant card slot comment:
```html
<!-- CARD 4 -->
```
Replace the placeholder art with your embed:
```html
<!-- For Figma prototype -->
<iframe src="https://www.figma.com/embed?embed_host=share&url=YOUR_LINK" allowfullscreen></iframe>

<!-- For MP4 video -->
<video src="your-clip.mp4" autoplay muted loop playsinline></video>
```

### Add a portfolio case study
Each case study card in `index.html` follows this pattern:
```html
<div class="case-card">
  <div class="case-meta">Company · Year</div>
  <div class="case-title">Project title</div>
  <div class="case-desc">Problem → approach → outcome</div>
  <div class="case-metrics">
    <span class="metric-val">40%</span>
    <span class="metric-label">efficiency gain</span>
  </div>
</div>
```

---

## Updating the Site

All updates auto-deploy via Vercel. Workflow:

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/mocreativeconcept-portfolio.git
cd mocreativeconcept-portfolio

# Make your changes, then:
git add .
git commit -m "feat: add new motion project — Project Name"
git push origin main

# Vercel picks up the push and deploys in ~30 seconds
```

### Commit message format
```
feat: add new [thing]         # new content or feature
update: [what changed]        # edit to existing content
fix: [what was broken]        # bug or layout fix
brand: [what changed]         # brand/style updates
```

---

## Figma Source Files

Design source files live in Figma (not in this repo). Key files:

| File | Description |
|---|---|
| Fanta | Brand motion concept — expressive transitions |
| Liquid Glass | Glassmorphic UI motion study |
| SmallClosedWorld | Motion storytelling concept |
| MoCreativeConcept Brand | Logo, colour palette, type system |

> Request access: Abiodunadedamola94@gmail.com

---

## Contact

| | |
|---|---|
| Email | Abiodunadedamola94@gmail.com |
| Portfolio | [mocreativeportfolio.lovable.app](https://mocreativeportfolio.lovable.app) |
| Motion | [mocreativeconcept.vercel.app/motion](https://mocreativeconcept.vercel.app/motion) |
| LinkedIn | [Abiodun Adedamola](https://linkedin.com/in/abiodun-adedamola) |
| Location | Lagos, Nigeria · Open to remote |

---

## License

© 2026 MoCreativeConcept · Abiodun Adedamola. All rights reserved.

Design work, case studies, and visual assets in this repository are the intellectual property of Abiodun Adedamola and may not be reproduced without permission.

The HTML/CSS/JS code structure may be referenced for learning purposes with attribution.
