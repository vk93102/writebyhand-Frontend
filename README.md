# ✍️ WriteByHand.in

> **India's #1 Free Text-to-Handwriting Conversion Platform** — Transforming typed content into photorealistic handwritten documents with multi-language support, intelligent typography simulation, and HD export pipelines.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat-square&logo=django)](https://djangoproject.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Live](https://img.shields.io/badge/Live-writebyhand.in-brightgreen?style=flat-square)](https://writebyhand.in)

---

## 📋 Table of Contents

- [Project Links](#-project-links)
- [Backend Repository Note](#-backend-repository-note)
- [Project Overview](#-project-overview)
- [Core Feature Matrix](#-core-feature-matrix)
- [System Architecture](#️-system-architecture)
- [Tech Stack Deep Dive](#-tech-stack-deep-dive)
- [Handwriting Simulation Engine](#-handwriting-simulation-engine)
- [Theme & Paper Style System](#-theme--paper-style-system)
- [Multi-Language Pipeline](#-multi-language-pipeline)
- [Canvas Rendering Architecture](#️-canvas-rendering-architecture)
- [PDF Export Pipeline](#-pdf-export-pipeline)
- [Anti-Copy & OCR Obfuscation Layer](#-anti-copy--ocr-obfuscation-layer)
- [Frontend State Management](#-frontend-state-management)
- [Backend Django Architecture](#-backend-django-architecture)
- [Database Schema](#-database-schema)
- [Performance Optimization](#-performance-optimization)
- [Directory Structure](#-directory-structure)
- [Setup & Local Development](#-setup--local-development)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [CI / CD Pipeline](#-ci--cd-pipeline)
- [Containerization](#-containerization)
- [Testing Strategy](#-testing-strategy)
- [Contributing](#-contributing)

---

## 🔗 Project Links

- Frontend Repository: https://github.com/vk93102/HandtotextAI-Frontend
- Backend Repository: https://github.com/vk93102/HandtotextAI-Backend
- Demo Video: https://drive.google.com/file/d/1wkw9F5njJeNiZ_bltCMBCbArgOQmcg1q/view?usp=sharing

## 🧩 Frontend Repository Note

This repository contains Frontend services and .tsx files  for the project.
Backend code is maintained separately in the frontend repository linked above.

---

## 🌐 Project Overview

WriteByHand.in is a **client-heavy, server-assisted** SaaS platform that leverages HTML5 Canvas APIs, WebFont rendering pipelines, and procedural noise algorithms to simulate authentic human handwriting across multiple scripts including Latin (English), Devanagari (Hindi), Marathi, Gujarati, and Sanskrit.

The platform solves a uniquely hard problem: **making machine-rendered text indistinguishable from actual handwriting** through stochastic character-level perturbations, ink pressure simulation, baseline wobble injection, ligature approximation, and contextual glyph variation — all running at 60fps in the browser with zero server-side rendering latency.

### Key Design Goals

| Goal | Implementation Approach |
|---|---|
| Zero-latency preview | Client-side canvas rendering; no round-trips for live preview |
| Photorealistic output | Multi-layer compositing: ink bleed, paper texture, scanner shadow simulation |
| Multilingual support | Unicode-aware font loading with script-specific glyph metrics |
| Anti-plagiarism evasion | Per-character stochastic transform + OCR interference layer |
| Offline-capable | Service Worker caching of fonts + engine; core tool works without network |

---

## 🔧 Core Feature Matrix

### Writing Engine
- **9 handwriting fonts** including natural-decay fonts (Cedarville, Bad Script) and formal scripts (Mr Dafoe)
- **Stochastic variation seed system** — reproducible random character-level transforms per document
- **Left/Right hand slant simulation** via per-glyph affine transform matrices
- **Ink pressure modulation** — stroke weight variation using Perlin noise sampling
- **Baseline wobble** — sinusoidal Y-offset per word, modulated by a pseudo-random walk

### Page & Layout
- **5 paper modes**: Ruled, Blank, Graph, Four-Line, CBSE-standard
- **Margin presets**: Standard and CBSE-compliant (with left punch-hole margin + header zone)
- **Dynamic pagination**: Overflow detection with automatic page spawning
- **Image embedding**: Drag-resize image insertion mid-document with text reflow

### Export Pipeline
- **3 quality tiers**: WhatsApp (compressed JPEG), Print-Ready (medium DPI), Ultra HD (max DPI)
- **PDF multi-page bundling** with optional high-compression mode
- **PNG per-page export**
- **Anti-Copy pattern overlay** with configurable interference line density

### Smart Formatting
- **Smart Q&A mode**: Auto-detects `Q:` / `Ans:` prefixes and applies color-coded ink simulation
- **Auto-headings**: ALL CAPS lines rendered in bold black ink
- **Auto-correct**: Real-time English spell correction pipeline
- **Date/Page number headers**: Auto-inserted per-page with font-matched rendering

### Project Persistence
- **`.wbh` project files**: Serialized JSON containing document state, settings, images (base64), and variation seed — fully portable and reopenable

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER (Browser)                        │
│                                                                          │
│  ┌────────────────────┐   ┌──────────────────┐   ┌─────────────────┐   │
│  │  Editor UI (TS)    │   │  Rendering Engine │   │  Export Engine  │   │
│  │  - React-like VDOM │──▶│  (Canvas API)     │──▶│  (jsPDF + JPEG) │   │
│  │  - ContentEditable │   │  - TextLayout     │   │  - Compression  │   │
│  │  - Live word count │   │  - GlyphPainter   │   │  - Multi-page   │   │
│  └────────────────────┘   │  - NoiseEngine    │   │  - Anti-copy    │   │
│                            │  - TextureLayer   │   └─────────────────┘   │
│  ┌────────────────────┐   └──────────────────┘                          │
│  │  Settings Panel    │                                                  │
│  │  - Font picker     │   ┌──────────────────┐   ┌─────────────────┐   │
│  │  - Page style      │   │  WebFont Loader  │   │  State Manager  │   │
│  │  - Margin ctrl     │──▶│  (Google Fonts   │   │  (.wbh project) │   │
│  │  - Realism ctrl    │   │   + local cache) │   │  - LocalStorage │   │
│  └────────────────────┘   └──────────────────┘   └─────────────────┘   │
│                                                                          │
│  Service Worker ──── Font Cache ──── Offline Engine Cache               │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │ HTTPS (Django REST / SEO / Auth)
┌───────────────────────────────▼──────────────────────────────────────────┐
│                          SERVER LAYER (Django)                            │
│                                                                           │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │  Django Views  │  │  REST Framework  │  │  Template Engine       │  │
│  │  (SSR pages)   │  │  (API endpoints) │  │  (Jinja2 + SEO meta)   │  │
│  └────────────────┘  └──────────────────┘  └────────────────────────┘  │
│                                                                           │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │  Tool Registry │  │  Content Engine  │  │  Analytics & Logging   │  │
│  │  (30+ tools)   │  │  (AI-assist gen) │  │  (Custom event store)  │  │
│  └────────────────┘  └──────────────────┘  └────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       Data Layer                                    │ │
│  │   PostgreSQL (user data)  │  Redis (session/cache)  │  CDN (assets) │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

### Architecture Philosophy

WriteByHand.in uses a **"thick client, thin server"** pattern:

- **~95% of computation runs in the browser** — text layout, canvas rendering, PDF generation, noise simulation — all happens client-side. This enables zero-cost horizontal scaling and eliminates server-side rendering bottlenecks.
- **The Django backend** serves as: (1) an SSR layer for SEO-optimized HTML delivery, (2) a tool registry for 30+ utility pages, (3) a potential persistence/auth API layer, and (4) a static asset + CDN orchestrator.
- **TypeScript** owns the entire interactive rendering pipeline with strict typing across the canvas engine, state manager, font loader, and export pipeline.

---

## 🛠 Tech Stack Deep Dive

### Backend — Django (Python 3.11+)

| Component | Technology | Purpose |
|---|---|---|
| Web Framework | Django 4.2 | Routing, ORM, admin, middleware |
| API Layer | Django REST Framework | RESTful endpoints for tool configs, content generation |
| Template Engine | Django Templates + Jinja2 | SSR pages with structured SEO metadata |
| Database | PostgreSQL 15 | User sessions, analytics, saved projects |
| Cache / Sessions | Redis 7 | Session store, hot-path caching |
| Task Queue | Celery + Redis | Async jobs (email, heavy PDF ops) |
| Auth | Django Allauth | OAuth (Google) + email-based auth |
| Deployment | Gunicorn + Nginx | WSGI server with reverse proxy |



## ✍️ Handwriting Simulation Engine

This is the crown jewel of WriteByHand.in — a multi-stage stochastic rendering pipeline that produces handwriting which passes casual human inspection.

### Stage 1: Text Tokenization & Layout

```
Raw Input Text
     │
     ▼
┌─────────────────────────────────────┐
│         TextLayoutEngine            │
│                                     │
│  1. Unicode normalization (NFC)     │
│  2. Script detection per-word       │
│     (Latin vs Devanagari vs mixed)  │
│  3. Word-level tokenization         │
│  4. Line-break computation          │
│     (font metrics + available width)│
│  5. Smart Q&A token tagging         │
│  6. ALL-CAPS heading detection      │
└──────────────────┬──────────────────┘
                   │ Token stream with layout coords
                   ▼
```

### Stage 2: Per-Glyph Transform Generation

Each character gets a unique transform computed from the **variation seed** + position index, ensuring:
- **Reproducibility**: same seed → same document every time
- **Uniqueness**: different seeds → different "handwriting instances"

```typescript
interface GlyphTransform {
  dx: number;          // X offset (horizontal jitter, ±1.5px)
  dy: number;          // Y offset (baseline wobble, ±2px)
  rotation: number;    // Micro-rotation (±1.5°)
  scaleX: number;      // Width compression (0.95–1.05)
  scaleY: number;      // Height variation (0.96–1.04)
  inkWeight: number;   // Stroke weight multiplier (0.85–1.15)
}

// Computed via seeded LCG (Linear Congruential Generator):
// transform_i = f(seed, charIndex, wordIndex, lineIndex)
```

### Stage 3: Ink Pressure Simulation

Ink pressure variation mimics the natural increase/decrease of pen pressure across a stroke:

```
Word boundary → pressure reset to baseline
  │
  ├── First letter: 0.9× weight (pen just touching paper)
  ├── Middle letters: 1.0–1.1× weight (full contact)
  └── Last letter: 0.85–0.95× weight (pen lifting)

Perlin noise superimposed across the entire line for
macro-level pressure variation (simulates writer fatigue/
natural movement patterns).
```

### Stage 4: Slant Matrix Application

```
Left-hand mode:  matrix.rotate(-6° to -12°) per glyph
Right-hand mode: matrix.rotate(+4° to +8°) per glyph

Slant varies slightly per word using:
  slant_word = base_slant + noise(wordIndex) × 1.5°
```

### Stage 5: Baseline Wobble

Each line's baseline follows a composite wave:
```
baseline_y(x) = line_y
              + A₁ × sin(ω₁x + φ₁)    // long wavelength drift
              + A₂ × sin(ω₂x + φ₂)    // medium frequency ripple
              + random_walk(x)          // true stochastic walk

Where A₁ ≈ 1.5px, A₂ ≈ 0.5px, random_walk step ≈ ±0.3px
```

### Stage 6: Ink Bleed Simulation

Post-render compositing applies a blur kernel to simulate ink soaking into paper fiber:

```
Ink Bleed Amount → controls blur radius (0–3px Gaussian)
Applied via: ctx.filter = `blur(${bleedRadius}px)`
Then composited with:  ctx.globalCompositeOperation = 'multiply'
```

### Stage 7: Realism Overlay — Wobble & Size

Final per-character size variation:
```typescript
charWidth  *= 1 + noise(seed, i, 0) × 0.04 × realismLevel
charHeight *= 1 + noise(seed, i, 1) × 0.03 × realismLevel
```

---

## 🎨 Theme & Paper Style System

### Paper Rendering Architecture

Each page is a **layered canvas composite** with these stacked layers (bottom to top):

```
Layer 0: Base fill (white or transparent)
Layer 1: Paper texture (PNG overlay, multiply blend)
Layer 2: Page rule lines (ruled/graph/four-line patterns)
Layer 3: Margin lines (left red margin, top blue header)
Layer 4: Scanner shadow (radial gradient vignette)
Layer 5: Handwritten text glyphs
Layer 6: Embedded images
Layer 7: Anti-copy interference pattern (if enabled)
```

### Paper Modes

| Mode | Line Pattern | Use Case |
|---|---|---|
| **Ruled** | Horizontal lines, 30px spacing | Standard notebook, essays, letters |
| **Blank** | No lines | Art, free-form, certificates |
| **Graph** | 15px × 15px grid | Maths, technical diagrams |
| **Four-Line** | 4-line Montessori pattern | Primary handwriting practice |
| **CBSE** | Ruled + wider left margin + header box | Indian school assignment format |

### Scanner Effect

A post-processing radial shadow gradient simulates a flatbed scanner:
```typescript
const gradient = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
gradient.addColorStop(0, 'rgba(0,0,0,0)');
gradient.addColorStop(0.7, 'rgba(0,0,0,0.02)');
gradient.addColorStop(1, 'rgba(0,0,0,0.12)');
ctx.fillStyle = gradient;
ctx.globalCompositeOperation = 'multiply';
```

### Paper Texture System

Paper textures are pre-baked PNG assets (tileable, 512×512) convolved over the canvas using `multiply` blend mode. Three texture intensities are selectable: None / Medium / Heavy.

---

## 🌏 Multi-Language Pipeline

### Supported Scripts

| Script | Languages | Font Support | Special Handling |
|---|---|---|---|
| Latin | English, Cursive | All 9 fonts | Auto-correct, ligature hints |
| Devanagari | Hindi, Marathi, Sanskrit | Kalam, Dekko | Half-form detection, matra alignment |
| Gujarati | Gujarati | Kalam (extended) | Unicode range: U+0A80–U+0AFF |

### Script Detection Algorithm

```typescript
function detectScript(char: string): ScriptType {
  const code = char.codePointAt(0)!;
  if (code >= 0x0900 && code <= 0x097F) return 'devanagari';
  if (code >= 0x0A80 && code <= 0x0AFF) return 'gujarati';
  if (code >= 0x0041 && code <= 0x007A) return 'latin';
  return 'unknown';
}
```

Mixed-script lines are rendered in segments: each contiguous run of the same script uses its optimal font and glyph metrics.

### Devanagari-Specific Rendering

Devanagari glyph rendering requires special treatment:

1. **Virama handling** (`्`, U+094D): suppresses top-bar (matra) on preceding consonant
2. **Conjunct consonants**: pre-shaped by the font shaper; canvas uses `fillText` with proper Unicode
3. **Vowel matras**: rendered as combining characters; positioned relative to base consonant
4. **Nukta support**: dot-below diacritic for loanword phonemes

The browser's own Unicode/OpenType shaper handles the heavy lifting; WriteByHand wraps this with its perturbation layer applied **after** shaping but **before** blitting to canvas.

---

## 🖼️ Canvas Rendering Architecture

### Multi-Canvas Strategy

Each page is an independent `<canvas>` element. The rendering pipeline uses **offscreen canvas** for preview (lower DPI) and switches to **full-resolution canvas** on export.

```typescript
const PREVIEW_DPI = 96;
const EXPORT_DPI_MAP = {
  'whatsapp': 150,
  'print': 200,
  'ultra_hd': 300,
};
```

### Render Pipeline (per page)

```
1. clearRect() — wipe canvas
2. drawPaperBackground() — fill color
3. drawTexture() — paper PNG, multiply blend
4. drawRuleLines() — based on paper mode
5. drawMargins() — header/left margin lines
6. drawImages() — user-uploaded images
7. [Per token loop]
   a. computeGlyphTransform(seed, tokenIndex)
   b. ctx.save()
   c. applyTransformMatrix(transform)
   d. ctx.font = buildFontString(font, size, weight)
   e. ctx.fillStyle = inkColor
   f. ctx.fillText(char, x, y)
   g. ctx.restore()
8. applyScannerEffect() — vignette gradient
9. applyAntiCopy() — if enabled, draw interference lines
```

### Performance Mode

When "Performance Mode" is ON, the **preview canvas** renders at 0.5× DPI with simplified wobble (skip Perlin noise, use LUT-based approximation). Export always uses full quality regardless of this setting.

---

## 📄 PDF Export Pipeline

### Architecture

```
[Canvas Array]  (one per page)
      │
      ▼
┌─────────────────────────────┐
│  PDFExporter.ts             │
│                             │
│  1. Determine output DPI    │
│  2. For each canvas:        │
│     a. toDataURL('jpeg',    │
│        qualityFactor)       │
│     b. jsPDF.addImage()     │
│     c. if not last page:    │
│        jsPDF.addPage()      │
│  3. Apply compression tier  │
│  4. jsPDF.save('file.pdf')  │
└─────────────────────────────┘
```

### Compression Tiers

| Tier | JPEG Quality | Approx DPI | Typical Size |
|---|---|---|---|
| WhatsApp/Email | 0.65 | 150 | ~0.3–0.8 MB |
| Print Ready | 0.82 | 200 | ~1–3 MB |
| Ultra HD | 0.95 | 300 | ~4–10 MB |

### High Compression Mode

When "High Compression" is toggled, quality is reduced by an additional 0.15 factor and image dimensions are downsampled before encoding.


##  Setup & Local Development

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/writebyhand.git
cd writebyhand

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials, secret key, etc.

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial tool data
python manage.py loaddata tools/fixtures/tools.json

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
# Install Node dependencies
npm install

# Build TypeScript (watch mode)
npm run dev

# Production build
npm run build

# Type check
npm run typecheck
```

### Full Stack (Docker)

```bash
docker-compose up --build
# App: http://localhost:8000
# Redis: localhost:6379
# Postgres: localhost:5432
```

---

## 🔐 Environment Variables

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=writebyhand.in,www.writebyhand.in

# Database
DATABASE_URL=postgres://user:password@localhost:5432/writebyhand

# Redis
REDIS_URL=redis://localhost:6379/0

# CDN
CDN_BASE_URL=https://cdn.writebyhand.in
STATIC_ROOT=/var/www/writebyhand/static/

# Email (for auth)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-key

# Analytics (optional)
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 🌍 Deployment

### Production Stack

```
Internet
   │
   ▼
Cloudflare (CDN + DDoS protection + SSL termination)
   │
   ▼
Nginx (reverse proxy, static files, gzip)
   │
   ├──► Gunicorn (4 workers, Django WSGI)
   │         │
   │         ├──► PostgreSQL (primary)
   │         └──► Redis (cache + sessions)
   │
   └──► Static Files → CDN origin bucket
```

### Deployment Commands

```bash
# Collect static files
python manage.py collectstatic --no-input

# Build frontend assets
npm run build

# Run database migrations
python manage.py migrate

# Restart Gunicorn
sudo systemctl restart gunicorn

# Reload Nginx
sudo nginx -s reload
```

---

## 🔁 CI / CD Pipeline

GitHub Actions pipeline is now configured end-to-end.

Workflow file:
- .github/workflows/ci-cd.yml

### CI steps
- Install dependencies
- Run lint checks (`ruff` critical rules)
- Validate deploy configuration
- Run Python unit tests
- Run Django smoke check
- Build Docker image in CI

### CD step
- On push to `master` or `main`, deployment is triggered on Render using deploy hook (if configured)

### Required GitHub Secret for CD
- `RENDER_DEPLOY_HOOK_URL`

### Local CI command

```bash
./tests/ci_pipeline.sh
```

---

## 🐳 Containerization

Containerization is included for consistent local and CI environments.

- Docker image definition: Dockerfile
- Local multi-service setup: docker-compose.yml
- Build context cleanup: .dockerignore

Run locally with Docker:

```bash
docker compose up --build
```

This starts:
- Backend at `http://localhost:8000`
- PostgreSQL at `localhost:5432`
- Redis at `localhost:6379`

---

## 🧪 Testing Strategy

Current strategy is layered:

1. **Config and structure tests**
  - Environment and project shape checks in `tests/test_*.py`
2. **Pipeline tests**
  - `tests/ci_pipeline.sh` runs deploy checks, unit tests, smoke checks
3. **Endpoint flow scripts**
  - Shell-based flow checks in `tests/*.sh` for key API paths

Planned improvement areas:
- Add mocked service tests (e.g., external APIs, payment webhooks)
- Add focused edge-case tests for document/PDF flows
- Add coverage reporting and thresholds in CI

---

## 🤝 Contributing

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. **TypeScript**: ensure `npm run typecheck` passes with zero errors
4. **Python**: ensure `flake8` and `black` checks pass
5. Add tests for any new engine behaviour
6. Open a **Pull Request** with a detailed description

### Code Style

- Python: `black` + `isort` + `flake8`
- TypeScript: `eslint` (strict) + `prettier`
- Commits: Conventional Commits format (`feat:`, `fix:`, `perf:`, `docs:`)

---

## 📜 License

© WriteByHand.in. All rights reserved.

---

<p align="center">
  Built with ❤️ in India · Making student life easier, one handwritten page at a time
</p>
