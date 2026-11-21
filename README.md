# adfdzly.github.io

Personal site of **Adrie Fadzly**, software engineer and founder of AESKA Lab Solution.
Static HTML, CSS and JavaScript with no build step, served by GitHub Pages.

Live: https://adfdzly.github.io

## Structure

```
index.html                 # home: opening object, Wedd / AeskaFilm / PricePulse chapters, about, contact
work/index.html            # work index
work/wedd/                 # case study: Couple / Vendor / System switch
work/aeskafilm/            # case study: Scan / Capture / Reveal film strip
work/pricepulse/           # case study: chart inspector + evaluation
assets/css/site.css        # tokens, layout, the object, covers, motion
assets/js/site.js          # motion control, scroll split, tilt, reveals, tabs, strip, inspector, copy
assets/favicon.svg
images/portrait.webp       # about portrait (cropped from images/Me.jpg)
images/pricepulse/         # screenshots from the public PricePulse demo (synthetic data)
images/og/                 # 1200x630 share images, one per page
```

## Design notes

- Palette: carbon `#090A0B`, graphite `#14171A`, soft silver `#E9EAEC`, steel `#A5ABB3`,
  ice blue `#A9C7F5`, paper ivory `#F0EBE2`, warm ink `#23211F`, champagne `#C4AA8B`.
- Type: Geist (name, nav, body), Instrument Serif italic (accent lines), IBM Plex Mono (labels).
  Instrument Serif stands in for PP Editorial New; swap the `--serif` token if you license it.
- The hero object is layered SVG (brushed titanium, smoked glass, dark ceramic). It plays its
  light sweep once per browser session, splits apart over the first half-viewport of scroll,
  and tilts slightly with the pointer on desktop.
- Motion: the Motion switch (nav and footer) is saved in `localStorage`; the OS reduced-motion
  setting turns it off by default. With motion off the page shows a still composition.

## Develop locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

Paths are root-absolute (`/assets/...`), so serve from the repo root.
