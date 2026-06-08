# adfdzly.github.io

Personal portfolio of **Muhammad Adrie Fadzly** — a terminal/hacker-themed, single-page
site built from scratch with **vanilla HTML, CSS and JavaScript** (no framework, no build
step). Deploys directly via GitHub Pages.

🔗 Live: https://adfdzly.github.io

## Features
- Terminal-style UI with boot sequence, typed commands, and a blinking caret
- Animated matrix-rain canvas background (perf-capped, pauses when tab is hidden)
- Scroll-triggered reveals, tilt/glow hover on cards, scroll-spy nav
- Dark / light theme toggle (saved to `localStorage`)
- Fully responsive + `prefers-reduced-motion` fallbacks (all motion disabled, content intact)

## Structure
```
index.html              # the whole page
assets/css/style.css    # terminal theme + animations (CSS variables for theming)
assets/js/app.js         # boot, typing, reveals, theme, canvas, contact form
assets/css/fontawesome-all.min.css + assets/webfonts/   # icons
images/Me.jpg, UITM.jpg                            # photos
```

## Two manual steps

1. **Resume download.** Drop your CV into the repo as:
   ```
   assets/Resume-Adrie-Fadzly.pdf
   ```
   The "Download CV" button already points here.

2. **Contact form (optional).** Out of the box the form opens the visitor's email client
   (`mailto:`). For real inbox delivery, create a free form at
   [formspree.io](https://formspree.io), then paste its endpoint into the top of
   `assets/js/app.js`:
   ```js
   var FORMSPREE_ENDPOINT = "https://formspree.io/f/your_id";
   ```

## Develop locally
Any static server works, e.g.:
```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy
Push to the `main` branch of `adfdzly/adfdzly.github.io`. GitHub Pages serves the root
`index.html` automatically (the `.nojekyll` file disables Jekyll processing).
