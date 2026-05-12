// ============================================================
// Inforcer Partner ROI Calculator — live calculations  (v0.3)
// ============================================================

// ---- 1. Helpers: number formatters ----------------------------

const fmtCurrency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

function fmtPercent(value) {
  if (!isFinite(value)) return '—';
  return (value * 100).toFixed(1) + '%';
}

function fmtDelta(value) {
  const sign = value > 0 ? '+' : '';
  return sign + fmtCurrency.format(value);
}

// ---- 2. Read / write helpers ----------------------------------

function readNum(id) {
  const v = parseFloat(document.getElementById(id).value);
  return isFinite(v) ? v : 0;
}

function write(id, text, tone) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.remove('positive', 'negative');
  if (tone) el.classList.add(tone);
}

// ---- Benchmark constants (Service Leadership Index) ----------
const BENCH_AVG = 0.111;
const BENCH_BIC = 0.19;

// ---- 3. The big one: run the whole model ----------------------

function recalculate() {

  // --- 3a. Read every input ---
  const seats        = readNum('seats');
  const pepm         = readNum('pepm');
  const cogsPct      = readNum('cogsPct') / 100;
  const opexPct      = readNum('opexPct') / 100;
  const inforcerCost = readNum('inforcerCost');
  const pepmUplift   = readNum('pepmUplift');
  const attach       = readNum('attach') / 100;
  const toolSave     = readNum('toolSave');
  const hrsSaved     = readNum('hrsSaved');
  const hrRate       = readNum('hrRate');
  const churnRed     = readNum('churnRed') / 100;
  const multiple     = readNum('multiple');

  // --- 3b. Current-state P&L (annual) ---
  const revenue       = seats * pepm * 12;
  const cogsCurrent   = revenue * cogsPct;
  const opex          = revenue * opexPct;
  const gpCurrent     = revenue - cogsCurrent;
  const ebitdaCurrent = gpCurrent - opex;
  const marginCurrent = revenue > 0 ? ebitdaCurrent / revenue : 0;

  // --- 3c. The four uplift drivers ---
  const upliftSeats   = seats * attach;
  const newRevenue    = upliftSeats * pepmUplift * 12;
  const inforcerCogs  = upliftSeats * inforcerCost * 12;
  const stackSaving   = toolSave * seats * 12;
  const timeSaving    = hrsSaved * hrRate * 12;
  const retainedRev   = churnRed * revenue;

  // --- 3d. With-Inforcer P&L ---
  const revenueNew    = revenue + newRevenue + retainedRev;
  const cogsNew       = cogsCurrent + inforcerCogs - stackSaving - timeSaving;
  const gpNew         = revenueNew - cogsNew;
  const ebitdaNew     = gpNew - opex;
  const marginNew     = revenueNew > 0 ? ebitdaNew / revenueNew : 0;

  // --- 3e. Bottom-line ---
  const ebitdaUplift  = ebitdaNew - ebitdaCurrent;
  const equityValue   = ebitdaUplift * multiple;
  const equity3yr     = ebitdaUplift * 3 * multiple;

  // --- 3f. KPI tiles ---
  write('out-ebitda-uplift',  fmtCurrency.format(ebitdaUplift));
  write('out-equity-value',   fmtCurrency.format(equityValue));
  write('out-margin-current', fmtPercent(marginCurrent));
  write('out-margin-new',     fmtPercent(marginNew));

  // --- 3g. P&L table ---
  const revDelta = revenueNew - revenue;
  write('out-rev-c', fmtCurrency.format(revenue));
  write('out-rev-n', fmtCurrency.format(revenueNew));
  write('out-rev-d', fmtDelta(revDelta), revDelta >= 0 ? 'positive' : 'negative');

  const cogsDelta = cogsNew - cogsCurrent;
  write('out-cogs-c', fmtCurrency.format(cogsCurrent));
  write('out-cogs-n', fmtCurrency.format(cogsNew));
  write('out-cogs-d', fmtDelta(cogsDelta), cogsDelta <= 0 ? 'positive' : 'negative');

  const gpDelta = gpNew - gpCurrent;
  write('out-gp-c', fmtCurrency.format(gpCurrent));
  write('out-gp-n', fmtCurrency.format(gpNew));
  write('out-gp-d', fmtDelta(gpDelta), gpDelta >= 0 ? 'positive' : 'negative');

  write('out-opex-c', fmtCurrency.format(opex));
  write('out-opex-n', fmtCurrency.format(opex));
  write('out-opex-d', fmtDelta(0));

  write('out-ebitda-c', fmtCurrency.format(ebitdaCurrent));
  write('out-ebitda-n', fmtCurrency.format(ebitdaNew));
  write('out-ebitda-d', fmtDelta(ebitdaUplift), ebitdaUplift >= 0 ? 'positive' : 'negative');

  write('out-equity-3yr', fmtCurrency.format(equity3yr));

  updateBenchmark(marginCurrent, marginNew);
  updateAnchors({
    marginCurrent, marginNew, ebitdaUplift, equityValue, equity3yr, multiple,
    driver1: newRevenue - inforcerCogs,
    driver2: stackSaving,
    driver3: timeSaving,
    driver4: retainedRev,
  });
}

// ---- 5. Benchmark sentence builder -----------------------------

function updateBenchmark(marginCurrent, marginNew) {
  const pp = (v) => (v * 100).toFixed(1) + ' pp';
  const pct = (v) => (v * 100).toFixed(1) + '%';

  let where;
  if (marginCurrent < 0) {
    where = `On these numbers the partner is currently loss-making (EBITDA margin ${pct(marginCurrent)}). The global MSP average is ${pct(BENCH_AVG)} and best-in-class is ${pct(BENCH_BIC)}+.`;
  } else if (marginCurrent < BENCH_AVG) {
    where = `The partner sits at ${pct(marginCurrent)} EBITDA margin — ${pp(BENCH_AVG - marginCurrent)} below the global MSP average of ${pct(BENCH_AVG)} (Service Leadership Q4 2024).`;
  } else if (marginCurrent < BENCH_BIC) {
    where = `The partner sits at ${pct(marginCurrent)} EBITDA margin — ${pp(marginCurrent - BENCH_AVG)} above the global average of ${pct(BENCH_AVG)}, and ${pp(BENCH_BIC - marginCurrent)} short of best-in-class (${pct(BENCH_BIC)}+).`;
  } else {
    where = `The partner is already at ${pct(marginCurrent)} EBITDA margin — at or above the Service Leadership best-in-class benchmark of ${pct(BENCH_BIC)}+.`;
  }

  let outcome;
  const lift = marginNew - marginCurrent;
  if (marginNew >= BENCH_BIC && marginCurrent < BENCH_BIC) {
    outcome = ` With Inforcer, projected margin lifts to ${pct(marginNew)} (+${pp(lift)}) — putting them past best-in-class.`;
  } else if (marginNew >= BENCH_AVG && marginCurrent < BENCH_AVG) {
    outcome = ` With Inforcer, projected margin lifts to ${pct(marginNew)} (+${pp(lift)}) — bringing them above the global average.`;
  } else if (lift > 0) {
    outcome = ` With Inforcer, projected margin lifts to ${pct(marginNew)} (+${pp(lift)}).`;
  } else {
    outcome = ` With the current driver assumptions, projected margin holds at ${pct(marginNew)}.`;
  }

  document.getElementById('out-benchmark').textContent = where + outcome;
}

// ---- 6. PSM talking points builder -----------------------------

function updateAnchors(v) {
  const pp = (x) => (x * 100).toFixed(1) + ' pp';
  const pct = (x) => (x * 100).toFixed(1) + '%';
  const $ = (x) => fmtCurrency.format(x);

  const gapToAvg = v.marginCurrent - BENCH_AVG;
  const lift = v.marginNew - v.marginCurrent;

  const anchors = [
    `Global MSP average EBITDA is ${pct(BENCH_AVG)}; best-in-class run ${pct(BENCH_BIC)}+ for five years straight (Service Leadership Index). 18% of MSPs are losing money.`,
    gapToAvg >= 0
      ? `On your numbers, you sit at ${pct(v.marginCurrent)} — that's ${pp(gapToAvg)} above the global average. Top-quartile territory.`
      : `On your numbers, you sit at ${pct(v.marginCurrent)} — that's ${pp(-gapToAvg)} below the global average. Plenty of margin to recover.`,
    `Inforcer lifts your projected EBITDA margin to ${pct(v.marginNew)} — a ${pp(lift)} improvement in Year 1.`,
    `At your ${v.multiple.toFixed(1)}x EV/EBITDA multiple, that's ${$(v.equityValue)} in equity value created in Year 1.`,
    `Four levers behind that number — PEPM uplift (${$(v.driver1)}), stack rationalisation (${$(v.driver2)}), engineer time freed (${$(v.driver3)}), churn reduction (${$(v.driver4)}). Push back on any of them.`,
    `Over a typical 3-year hold (flat assumption), cumulative equity value created: ${$(v.equity3yr)}.`,
  ];

  anchors.forEach((text, i) => {
    document.getElementById(`anchor-${i + 1}`).textContent = text;
  });
}

// ---- 7. Reset, Copy, Print helpers ----------------------------

function resetInputs() {
  document.querySelectorAll('input').forEach((input) => {
    input.value = '';
  });
  recalculate();
}

async function copySummary() {
  const get = (id) => document.getElementById(id).textContent;

  const lines = [
    'Inforcer Partner ROI — Snapshot',
    '────────────────────────────────',
    `Annual EBITDA uplift:   ${get('out-ebitda-uplift')}`,
    `Equity value (1-yr):    ${get('out-equity-value')}`,
    `EBITDA margin:          ${get('out-margin-current')} → ${get('out-margin-new')}`,
    `3-yr cumulative value:  ${get('out-equity-3yr')}`,
    '',
    get('out-benchmark'),
  ];
  const text = lines.join('\n');

  const btn = document.getElementById('copy-summary');
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied to clipboard';
    btn.classList.add('copied');
  } catch (err) {
    btn.textContent = 'Copy failed — try again';
  }
  setTimeout(() => {
    btn.textContent = 'Copy summary';
    btn.classList.remove('copied');
  }, 2000);
}

function setPrintDate() {
  const today = new Date();
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  document.getElementById('print-date').textContent =
    today.toLocaleDateString('en-AU', opts);
}

// ---- 8. Tab switching -----------------------------------------
// Two buttons, two panels. The function below sets ONE panel
// active and hides the other. It also flips aria-selected and
// the .active visual class on the tab buttons — accessibility
// tools (screen readers, keyboard navigation) need both.
function showPanel(which) {
  const tabs   = { inputs: 'tab-inputs',   results: 'tab-results'   };
  const panels = { inputs: 'panel-inputs', panel:   'panel-results' };

  const tabInputs   = document.getElementById('tab-inputs');
  const tabResults  = document.getElementById('tab-results');
  const panelInputs = document.getElementById('panel-inputs');
  const panelResults= document.getElementById('panel-results');

  const isResults = which === 'results';

  tabInputs.classList.toggle('active', !isResults);
  tabResults.classList.toggle('active', isResults);
  tabInputs.setAttribute('aria-selected', String(!isResults));
  tabResults.setAttribute('aria-selected', String(isResults));

  panelInputs.classList.toggle('hidden', isResults);
  panelResults.classList.toggle('hidden', !isResults);

  // Scroll to the top of the page when switching — so the user
  // never lands halfway down the form they just left.
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- 9. Export inputs as CSV ----------------------------------
// CSV (Comma-Separated Values) is the simplest spreadsheet format.
// Every input on the page has a {id, label, value} we want to save.
// We build a list of those, join with commas + newlines, then ask
// the browser to download it.
//
// The download trick: create an invisible <a> tag whose href is a
// Blob URL (an in-memory file), give it a `download` attribute,
// and click() it programmatically. The browser treats it like the
// user clicked a download link.
function exportInputsCSV() {
  const rows = [['Field', 'Value']];

  // For each input on the page, find its label text and grab its value.
  document.querySelectorAll('.inputs input').forEach((input) => {
    const label = document.querySelector(`label[for="${input.id}"]`);
    const labelText = label ? label.textContent.trim() : input.id;
    rows.push([labelText, input.value]);
  });

  // CSV escape: wrap any field that contains a comma or quote in
  // double quotes, and double up any internal quotes.
  const csv = rows.map((row) =>
    row.map((cell) => {
      const s = String(cell);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',')
  ).join('\n');

  // Build a filename like "inforcer-roi-inputs-2026-05-12.csv"
  const today = new Date().toISOString().slice(0, 10);
  const filename = `inforcer-roi-inputs-${today}.csv`;

  // Wrap the string in a Blob, create a temporary URL, attach to a
  // hidden <a>, click it, then clean up.
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Brief visual confirmation on the button.
  const btn = document.getElementById('export-inputs');
  btn.textContent = 'Downloaded';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = 'Export inputs (CSV)';
    btn.classList.remove('copied');
  }, 2000);
}

// ---- 10. Download as PDF --------------------------------------
// We don't generate a PDF ourselves — we let the browser do it.
// window.print() opens the OS print dialog where the user picks
// "Save as PDF" as the destination. Our @media print stylesheet
// makes sure the layout looks tidy on paper.
function downloadPDF() {
  // Make sure the Results panel is visible before printing. If the
  // user has the Inputs tab active, the print stylesheet has a
  // safety net (#panel-results.hidden { display: block !important }),
  // but switching explicitly is cleaner.
  showPanel('results');
  // Give the browser a tick to repaint, then open the dialog.
  setTimeout(() => window.print(), 100);
}

// ---- 11. Wire it up -------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  recalculate();
  setPrintDate();

  // Re-run the model on every keystroke in any input box.
  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', recalculate);
  });

  // PSM talking points show/hide.
  const toggleBtn = document.getElementById('toggle-anchors');
  const anchorsList = document.getElementById('anchors-list');
  toggleBtn.addEventListener('click', () => {
    const isHidden = anchorsList.classList.toggle('hidden');
    toggleBtn.textContent = isHidden
      ? 'Show PSM talking points'
      : 'Hide PSM talking points';
    toggleBtn.setAttribute('aria-expanded', String(!isHidden));
  });

  // Reset, Copy, Export, Download.
  document.getElementById('reset-inputs').addEventListener('click', resetInputs);
  document.getElementById('copy-summary').addEventListener('click', copySummary);
  document.getElementById('export-inputs').addEventListener('click', exportInputsCSV);
  document.getElementById('download-pdf').addEventListener('click', downloadPDF);

  // Tab strip + the two "jump" buttons.
  document.getElementById('tab-inputs').addEventListener('click', () => showPanel('inputs'));
  document.getElementById('tab-results').addEventListener('click', () => showPanel('results'));
  document.getElementById('go-results').addEventListener('click', () => showPanel('results'));
  document.getElementById('back-inputs').addEventListener('click', () => showPanel('inputs'));
});
