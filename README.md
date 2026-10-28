<img src="assets/icon.svg" width="64" height="64" alt="">

# portfolio

Created in [T3 Code](https://t3.codes).

A minimal static portfolio — plain HTML and CSS, no build step.

- Open `index.html` in a browser to view it locally.
- Edit the entries in `index.html` under **Experience**, **Society Positions**, **Projects** and **Education**; copy an existing `<li class="entry">` or `<article class="entry">` block to add more.
- Give each entry `data-start="YYYY-MM"` and `data-end="YYYY-MM"` (or `data-end="present"`). `timeline.js` builds the **Timeline** chart from these and fills in each entry's date range.
- The chart groups roles into **Work Experience**, **Education** and **Society Positions**, one row per role. Each bar is labelled with the title and organisation from its heading (`Title · Organisation`), placed beside the bar wherever it fits. Each entry's section decides its group. Projects are listed but not charted.
- Optional: `data-label` replaces a bar's title; `data-series` picks its bar colour (`work`, `society`, `rhul`, `furze` in `style.css`). An entry whose date text is already filled in keeps it.
- Colors and spacing live in `style.css` (light/dark follow the system setting).
- Deploys as-is to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).
