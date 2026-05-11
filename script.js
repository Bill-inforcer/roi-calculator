// ============================================================
// Inforcer Partner ROI Calculator — live calculations
// ============================================================

// ---- 1. Helpers: number formatters ----------------------------

// Format a number as currency, e.g. 209700 → "$209,700"
const fmtCurrency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

// Format a fraction as a percent, e.g. 0.225 → "22.5%"
function fmtPercent(value) {
  if (!isFinite(value)) return '—';
  return (value * 100).toFixed(1) + '%';
}

// Format a delta with a leading "+" for positives, e.g. 209700 → "+$209,700"
function fmtDelta(value) {
  const sign = value > 0 ? '+' : '';
  return sign + fmtCurrency.format(value);
}

// ---- 2. Read / write helpers ----------------------------------

// Read a numeric input by id. Returns 0 if the box is empty or invalid.
function readNum(id) {
  const v = parseFloat(document.getElementById(id).value);
  return isFinite(v) ? v : 0;
}

// Write text into an output element by id, optionally tagging it positive/negative.
function write(id, text, tone) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.remove('positive', 'negative');
  if (tone) el.classList.add(tone);
}

// ---- Benchmark constants (Service Leadership Index) ----------
const BENCH_AVG = 0.111;   // Global MSP average — Q4 2024
const BENCH_BIC = 0.19;    // Best-in-class — 5-yr running

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
  const newRevenue    = upliftSeats * pepmUplift * 12;   // Driver 1 — revenue
  const inforcerCogs  = upliftSeats * inforcerCost * 12; // Driver 1 — new cost
  const stackSaving   = toolSave * seats * 12;           // Driver 2 — tools retired
  const timeSaving    = hrsSaved * hrRate * 12;          // Driver 3 — engineer hours freed
  const retainedRev   = churnRed * revenue;              // Driver 4 — churn reduction

  // --- 3d. With-Inforcer P&L (Opex held flat on purpose) ---
  const revenueNew    = revenue + newRevenue + retainedRev;
  const cogsNew       = cogsCurrent + inforcerCogs - stackSaving - timeSaving;
  const gpNew         = revenueNew - cogsNew;
  const ebitdaNew     = gpNew - opex;
  const marginNew     = revenueNew > 0 ? ebitdaNew / revenueNew : 0;

  // --- 3e. Bottom-line ---
  const ebitdaUplift  = ebitdaNew - ebitdaCurrent;
  const equityValue   = ebitdaUplift * multiple;
  const equity3yr     = ebitdaUplift * 3 * multiple;

  // --- 3f. Write KPI tiles ---
  write('out-ebitda-uplift',  fmtCurrency.format(ebitdaUplift));
  write('out-equity-value',   fmtCurrency.format(equityValue));
  write('out-margin-current', fmtPercent(marginCurrent));
  write('out-margin-new',     fmtPercent(marginNew));

  // --- 3g. Write P&L table ---
  // Revenue row
  const revDelta = revenueNew - revenue;
  write('out-rev-c', fmtCurrency.format(revenue));
  write('out-rev-n', fmtCurrency.format(revenueNew));
  write('out-rev-d', fmtDelta(revDelta), revDelta >= 0 ? 'positive' : 'negative');

  // COGS row — lower is better, so the colour flips
  const cogsDelta = cogsNew - cogsCurrent;
  write('out-cogs-c', fmtCurrency.format(cogsCurrent));
  write('out-cogs-n', fmtCurrency.format(cogsNew));
  write('out-cogs-d', fmtDelta(cogsDelta), cogsDelta <= 0 ? 'positive' : 'negative');

  // Gross profit row
  const gpDelta = gpNew - gpCurrent;
  write('out-gp-c', fmtCurrency.format(gpCurrent));
  write('out-gp-n', fmtCurrency.format(gpNew));
  write('out-gp-d', fmtDelta(gpDelta), gpDelta >= 0 ? 'positive' : 'negative');

  // Opex row (held flat)
  write('out-opex-c', fmtCurrency.format(opex));
  write('out-opex-n', fmtCurrency.format(opex));
  write('out-opex-d', fmtDelta(0));

  // EBITDA row
  write('out-ebitda-c', fmtCurrency.format(ebitdaCurrent));
  write('out-ebitda-n', fmtCurrency.format(ebitdaNew));
  write('out-ebitda-d', fmtDelta(ebitdaUplift), ebitdaUplift >= 0 ? 'positive' : 'negative');

  // --- 3h. 3-year cumulative equity value ---
  write('out-equity-3yr', fmtCurrency.format(equity3yr));

  // --- 3i. Dynamic benchmark sentence ---
  updateBenchmark(marginCurrent, marginNew);

  // --- 3j. Dynamic PSM talking points ---
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

// ---- 4. Wire it up ---------------------------------------------

// Run once when the page is ready, then re-run on every keystroke.
document.addEventListener('DOMContentLoaded', () => {
  recalculate();

  // Re-run the model on every keystroke in any input box.
  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', recalculate);
  });

  // Show/hide the PSM talking points panel.
  const toggleBtn = document.getElementById('toggle-anchors');
  const anchorsList = document.getElementById('anchors-list');
  toggleBtn.addEventListener('click', () => {
    const isHidden = anchorsList.classList.toggle('hidden');
    toggleBtn.textContent = isHidden
      ? 'Show PSM talking points'
      : 'Hide PSM talking points';
    toggleBtn.setAttribute('aria-expanded', String(!isHidden));
  });
});
