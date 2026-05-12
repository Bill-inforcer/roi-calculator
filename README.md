# inforcer Partner ROI Calculator

An interactive calculator that translates an MSP's operational numbers into annual EBITDA uplift and equity value created — designed to be co-edited live in a QBR.

Every input is the partner's own number, not a vendor average.

## What it computes

Four uplift drivers flow through a side-by-side P&L comparison:

1. **PEPM/ARPU uplift** — new revenue from charging for enhanced M365 security
2. **Stack rationalisation** — savings from retired security tools
3. **Engineer time freed** — automation of manual baseline / policy / reporting work
4. **Churn reduction** — retained revenue from a stickier security service

Headline outputs: annual EBITDA uplift, equity value created at the partner's EV/EBITDA multiple, projected EBITDA margin, and a benchmark sentence comparing the partner to the [Service Leadership Index](https://www.service-leadership.com/) (global MSP average 11.1%, best-in-class 19%+).

## How to use

Open `index.html` in any modern browser. All calculations run client-side — no data leaves the browser.

The calculator has two tabs:

- **1. Inputs** — replace the default numbers with the partner's own; the model recalculates on every keystroke.
- **2. Results** — KPIs, P&L impact, benchmark, and 3-year cumulative equity value.

Buttons:

- **Reset all inputs** — clears every field to a blank slate.
- **Export inputs (CSV)** — downloads the partner's entered values as a CSV (one row per field).
- **View results →** — jumps to the Results tab.
- **← Edit inputs** — jumps back to the Inputs tab.
- **Copy summary** — copies the headline numbers to the clipboard.
- **Download as PDF** — opens the browser's print dialog with a clean leave-behind layout. Choose "Save as PDF" as the destination.
- **Show / hide PSM talking points** — toggles internal-only anchors keyed off the live numbers. Hide before sharing the URL with a partner.

## Branding

Brand colours are defined as CSS variables at the top of `styles.css`:

```css
--inforcer-blue: #0A1F3D;        /* deep navy — header background */
--inforcer-blue-light: #178BDB;  /* official inforcer brand blue (from logo) */
```

The header logo lives at `inforcer-logo.png` — the white-and-blue variant designed for dark backgrounds. To swap it out, replace the file or change the `src` attribute in `index.html`.

## Built with

Vanilla HTML, CSS, and JavaScript. No build step, no dependencies, no tracking.

---

Pilot v0.3 — inforcer Partner Success. (Tabs, Export CSV, Download PDF, brand banner added.)
Benchmarks: Service Leadership Index 2025; TruMethods; IT Nation Evolve.
