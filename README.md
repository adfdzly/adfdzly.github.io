# adfdzly.github.io

Personal site of **Adrie Fadzly**, software engineer and founder of AESKA Lab Solution.
Static HTML, CSS and JavaScript with no build step, served by GitHub Pages.

Live: https://adfdzly.github.io

## Structure

```
index.html                 # home: 3D desk scene behind hero, what I do, work, career, stack, also built, contact
work/index.html            # work index
work/wedd/                 # case study: Couple / Vendor / System switch
work/aeskafilm/            # case study: Scan / Capture / Reveal film strip
work/pricepulse/           # case study: chart inspector + evaluation
assets/css/site.css        # tokens, pill nav, cursor, work rows + hover preview, footer, case study pages
assets/css/home.css        # home only: scene layer, loader, sections, cards, timeline
assets/js/scene.js         # home 3D scene (Three.js r160): desk, monitor screens, camera shots, tech balls
assets/js/me.js            # the stylised 3D Adrie (from images/Profile.jpg): types, spins round, waves, blinks
assets/js/site.js          # motion switch, clock, cursor + work preview, copy, tabs, strip, inspector
assets/js/motion.js        # Lenis smooth scroll + GSAP ScrollTrigger (headline rise, row slide, footer mark)
assets/favicon.svg
images/portrait.webp       # about portrait (cropped from images/Me.jpg)
images/pricepulse/         # screenshots from the public PricePulse demo (synthetic data)
images/og/                 # 1200x630 share images, one per page
```

## Design notes

- Look: near-black `#050505`, Geist with a few Instrument Serif italic words per heading, Geist Mono
  pill labels, fine-bordered glass panels, a floating pill nav, and one soft violet glow `#B9A8FF`.
  Same family as aeskalab.com.
- Home is one Three.js scene behind the page. Each section with `data-shot` is a camera keyframe;
  scrolling blends between them. The monitor redraws per section (terminal, code, Wedd, AeskaFilm,
  the PricePulse dashboard, git log, stack, SM Agent, an email). In the stack section the tech balls
  drop onto the platform and react to the pointer.
- The character is built from primitives and coloured from `images/Profile.jpg`. He types at the desk,
  turns round to wave in the hero and contact shots, follows the camera with his head, and blinks.
- Without WebGL the page shows a gradient fallback and the stack as text chips.
- Motion: the Motion switch (top bar and footer) is saved in `localStorage`; the OS reduced-motion
  setting turns it off by default. With motion off the scene still renders, but as still frames.

## Develop locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

Paths are root-absolute (`/assets/...`), so serve from the repo root.
