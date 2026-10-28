// Builds the "Timeline" chart from the Experience, Society Positions and Education entries.
// Each entry declares its dates as data attributes, e.g.
//   data-start="2024-03" data-end="2025-06"   (or data-end="present")
// and this script also writes the readable range into the entry's .meta.
// Each entry's section picks its chart group (Work Experience, Education or Society Positions). Each bar is labelled with the job title and organisation from its heading
// ("Title · Organisation"); data-label replaces the title.
// Bars are coloured by section, or by data-series (see the --series colours in style.css).
// An entry whose .meta already has text keeps it, so its bar can cover just part of it.
// Everything is worked out from today's date when the page loads: ongoing bars run to the
// Today line and roles get the "current" marker while they're running.
(() => {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const toMonth = (s) => {
    const [y, m] = s.split("-").map(Number);
    return y * 12 + (m - 1);
  };
  const fmt = (i) => `${MONTHS[i % 12]} ${Math.floor(i / 12)}`;
  const duration = (months) => {
    const y = Math.floor(months / 12);
    const m = months % 12;
    const parts = [];
    if (y) parts.push(`${y} yr${y > 1 ? "s" : ""}`);
    if (m || !y) parts.push(`${m || 1} mo${m > 1 ? "s" : ""}`);
    return parts.join(" ");
  };

  const today = new Date();
  const thisMonth = today.getFullYear() * 12 + today.getMonth();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const now = thisMonth + (today.getDate() - 1) / daysInMonth;

  // "Title · Organisation" -> parts; with data-label, the whole heading becomes the organisation.
  const splitHeading = (text, label) => {
    const [title, org = ""] = text.split(" · ").map((t) => t.trim());
    return label ? { label, org: text.trim() } : { label: title, org };
  };

  const KINDS = { experience: "work", society: "society", projects: "project", education: "education" };

  const items = [...document.querySelectorAll(".entry[data-start]")].map((el, i) => {
    const kind = KINDS[el.closest("section").id];
    const start = toMonth(el.dataset.start);
    const ongoing = !el.dataset.end || el.dataset.end === "present";
    const last = ongoing ? thisMonth : toMonth(el.dataset.end);
    const h3 = el.querySelector("h3");
    const range = `${fmt(start)} — ${ongoing ? "Present" : fmt(last)}`;

    if (!el.id) el.id = `${kind}-${i + 1}`;
    el.classList.toggle("current", start <= thisMonth && (ongoing || last >= thisMonth));
    const meta = el.querySelector(".meta");
    if (meta && !meta.textContent.trim()) meta.textContent = range;

    return {
      el,
      kind,
      series: el.dataset.series || kind,
      start,
      end: ongoing ? now : last + 1,
      ...splitHeading(h3.textContent, el.dataset.label),
      title: h3.textContent.trim(),
      when: `${range} · ${duration(last - start + 1)}`,
    };
  });

  const charted = items.filter((d) => d.kind !== "project");
  const section = document.getElementById("timeline");
  if (!charted.length) {
    section.hidden = true;
    return;
  }

  // Domain spans whole calendar years, from the earliest start to the latest end.
  const firstYear = Math.floor(Math.min(...charted.map((d) => d.start)) / 12);
  const lastYear = Math.floor((Math.max(...charted.map((d) => d.end)) - 0.001) / 12);
  const domainStart = firstYear * 12;
  const span = (lastYear + 1) * 12 - domainStart;
  const pct = (m) => `${((m - domainStart) / span) * 100}%`;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  const chart = section.querySelector(".gantt");

  // Background layer: year boundaries and the "today" line.
  const grid = el("div", "gantt-grid");
  grid.setAttribute("aria-hidden", "true");
  for (let y = firstYear + 1; y <= lastYear; y++) {
    const line = el("span", "gantt-year-line");
    line.style.left = pct(y * 12);
    grid.append(line);
  }
  const nowLine = el("span", "gantt-now");
  nowLine.style.left = pct(Math.min(now, domainStart + span));
  grid.append(nowLine);
  const nowLabel = el("span", "gantt-now-label", "Today");
  nowLabel.style.left = nowLine.style.left;
  grid.append(nowLabel);
  chart.append(grid);

  const tip = el("div", "gantt-tip");
  tip.setAttribute("role", "tooltip");
  tip.id = "gantt-tip";
  const tipWhen = el("strong");
  const tipTitle = el("span");
  tip.append(el("i"), tipWhen, tipTitle);

  const showTip = (d, bar, clientX) => {
    tip.dataset.series = d.series;
    tipWhen.textContent = d.when;
    tipTitle.textContent = d.title;
    tip.classList.add("visible");
    const box = chart.getBoundingClientRect();
    const b = bar.getBoundingClientRect();
    const x = (clientX ?? b.left + b.width / 2) - box.left;
    const half = tip.offsetWidth / 2;
    tip.style.left = `${Math.max(half, Math.min(box.width - half, x))}px`;
    tip.style.top = `${b.top - box.top}px`;
  };
  const hideTip = () => tip.classList.remove("visible");

  // Three groups, each headed by its name, with one row per role.
  // Projects keep their dates in the list but stay off the chart.
  const GROUPS = [
    ["work", "Work Experience"],
    ["education", "Education"],
    ["society", "Society Positions"],
  ];

  const jumpTo = (d) => {
    d.el.scrollIntoView({ behavior: "smooth", block: "center" });
    d.el.classList.remove("flash");
    void d.el.offsetWidth;
    d.el.classList.add("flash");
  };

  const rows = [];
  let n = 0;
  GROUPS.map(([id, name]) => [name, charted.filter((d) => d.kind === id)])
    .filter(([, group]) => group.length)
    .forEach(([name, group]) => {
      chart.append(el("div", "gantt-group", name));
      group
        .sort((a, b) => a.start - b.start)
        .forEach((d) => {
          const row = el("div", "gantt-row");
          const bar = el("button", `gantt-bar ${d.series}`);
          bar.type = "button";
          bar.style.left = pct(d.start);
          bar.style.width = pct(domainStart + d.end - d.start);
          bar.style.animationDelay = `${0.35 + n++ * 0.05}s`;
          bar.setAttribute("aria-label", `${d.title}, ${d.when}`);
          bar.setAttribute("aria-describedby", tip.id);
          bar.addEventListener("pointermove", (e) => showTip(d, bar, e.clientX));
          bar.addEventListener("pointerleave", hideTip);
          bar.addEventListener("focus", () => showTip(d, bar));
          bar.addEventListener("blur", hideTip);
          bar.addEventListener("click", () => jumpTo(d));

          const label = el("span", "gantt-label", d.label);
          label.setAttribute("aria-hidden", "true");
          const org = d.org ? el("span", "org", ` · ${d.org}`) : null;
          if (org) label.append(org);
          label.addEventListener("click", () => jumpTo(d));

          row.append(bar, label);
          chart.append(row);
          rows.push({ d, row, label, org });
        });
    });

  // Put each label on whichever side of its bar has more room (falling back to the other); drop the organisation if
  // that's what it takes to fit, and only as a last resort move the label above the bar.
  const GAP = 6;
  const placeLabels = () =>
    rows.forEach(({ d, row, label, org }) => {
      const w = row.clientWidth;
      const from = ((d.start - domainStart) / span) * w;
      const to = ((d.end - domainStart) / span) * w;
      row.classList.remove("stacked");
      for (const withOrg of org ? [true, false] : [false]) {
        if (org) org.hidden = !withOrg;
        const lw = label.offsetWidth;
        const after = to + GAP + lw <= w && (w - to >= from || from - GAP - lw < 0);
        if (after) return void (label.style.left = `${to + GAP}px`);
        if (from - GAP - lw >= 0) return void (label.style.left = `${from - GAP - lw}px`);
      }
      row.classList.add("stacked");
      if (org) {
        org.hidden = false;
        org.hidden = label.offsetWidth > w;
      }
      label.style.left = `${Math.max(0, Math.min(from, w - label.offsetWidth))}px`;
    });
  new ResizeObserver(placeLabels).observe(chart);

  // Year labels sit centred within each year; thin them out on long histories.
  const axis = el("div", "gantt-axis");
  axis.setAttribute("aria-hidden", "true");
  const step = lastYear - firstYear >= 7 ? 2 : 1;
  for (let y = firstYear; y <= lastYear; y += step) {
    const label = el("span", "", String(y));
    label.style.left = pct(y * 12 + 6);
    axis.append(label);
  }
  chart.append(axis, tip);
})();
