# adfdzly.github.io

Personal site of **Adrie Fadzly**, software engineer and founder of AESKA Lab Solution.
Static HTML, CSS and JavaScript with no build step, served by GitHub Pages.

Live: https://adfdzly.github.io

## Structure

```
index.html                 # home: loader, name + portrait hero, statement, work index, numbers, about, contact
work/index.html            # work index
work/wedd/                 # case study: Couple / Vendor / System switch
work/aeskafilm/            # case study: Scan / Capture / Reveal film strip
work/pricepulse/           # case study: chart inspector + evaluation
assets/css/site.css        # tokens, top bar, cursor, work rows + hover preview, footer, case study pages
assets/css/home.css        # home only: loader, hero, statement, marquee, numbers, about, contact
assets/js/site.js          # motion switch, clock, cursor + work preview, copy, tabs, strip, inspector
assets/js/motion.js        # Lenis smooth scroll + GSAP ScrollTrigger (headline rise, row slide, footer mark)
assets/js/home.js          # home only: loader count, hero scroll, scroll-read statement
assets/favicon.svg
images/hero.webp           # hero portrait (from images/Profile.jpg)
images/portrait.webp       # about portrait (cropped from images/Me.jpg)
images/pricepulse/         # screenshots from the public PricePulse demo (synthetic data)
images/og/                 # 1200x630 share images, one per page
```

## Design notes

- Editorial index style: huge condensed display type, small mono labels in the corners,
  one signal colour.
- Palette: near-black `#0C0C0B`, graphite `#151513`, bone `#ECE7DF`, stone `#8E8A83`,
  signal red-orange `#FF4A1C`; case covers keep oxblood `#4A1418` and champagne `#C4AA8B`.
- Type: Archivo (variable width; display set at `font-stretch: 62%`), Instrument Serif italic
  (accent words), IBM Plex Mono (labels).
- Home: a 0–100% loader once per browser session, then the name rises over a black-and-white
  portrait. Scrolling pins the hero while the photo grows to full screen and the name parts.
- Work rows: hovering a project shows a preview card that follows the cursor (desktop only);
  the cursor turns into a "View case" label over projects.
- Motion: the Motion switch (top bar and footer) is saved in `localStorage`; the OS reduced-motion
  setting turns it off by default. With motion off there is no loader, cursor or scroll effects.

## Develop locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

Paths are root-absolute (`/assets/...`), so serve from the repo root.
