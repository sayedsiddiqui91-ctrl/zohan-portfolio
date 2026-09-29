# Abdullah Al Abrar · portfolio

A cinematic, scroll-driven portfolio for **Abdullah Al Abrar (Zohan)**, architect and 3D visualizer in Dhaka.

As you scroll, his MetaHuman film plays under your hand: the camera pulls back from a
close-up to a full-length portrait while three lines of story pass him, and his name sits
**behind** him (every frame is cut out of the studio backdrop). The Work section then rises
over the stage like a curtain: his render film growing to full width, selected projects,
about and experience, a CV you can download, and contact.

Plain HTML, CSS and JS. GSAP + ScrollTrigger and Lenis (smooth wheel scrolling) load from
jsDelivr; Archivo from Google Fonts. No build step.

## Run it locally

```bash
python tools/devserver.py 5173
```

Then open http://localhost:5173. Any static server pointed at `site/` works too.
`?nolenis` switches to native scrolling and skips the intro (used for automated screenshots).

## Publish

Pushing to `main` deploys `site/` through GitHub Pages
(`.github/workflows/pages.yml`). One-time setup: **Settings → Pages → Source: GitHub Actions**.
`site/` can also be dropped onto Netlify, Vercel or Cloudflare Pages as-is.

## Edit content

- **Projects, bio, experience, contact:** `site/js/content.js`. Projects come from his
  Behance; `featured: true` puts one in the large cards, the rest go in the "More projects"
  index. Images live in `site/assets/work/p/` as `<name>-<n>.webp` (2000px, lightbox) and
  `<name>-<n>-s.webp` (1100px, cards and previews).
- **CV:** replace `site/assets/cv/Abdullah-Al-Abrar-CV.pdf` (and `cv-page.jpg` for the preview).
- **Film:** `site/assets/work/building-render.mp4`.

## The hero film

| Folder | Frames | Use |
|---|---|---|
| `site/assets/seq-hd/` | 96 at 1920×1080, AI-upscaled (Real-ESRGAN x4plus) | default |
| `site/assets/seq/` | 192 at 1280×720 | fallback when the visitor has Save-Data on |

Each folder holds transparent WebP frames, a `backdrop.jpg` plate and `meta.json` (his
bounding box per frame, which keeps him in view on phones). The page cross-fades
between neighbouring frames, so the motion stays continuous at any scroll speed.

To rebuild from a new clip:

```bash
ffmpeg -i clip.mp4 frames/f%04d.png              # extract frames
python tools/upscale_crop.py <workdir> meta.json   # optional: AI-upscale his region
python tools/cutout.py frames site/assets/seq-hd   # cut him out, write meta + backdrop
python tools/crop_frames.py site/assets/seq-hd      # crop each frame to his outline (less GPU memory)
```

## Layout

| Path | What |
|---|---|
| `site/` | The website |
| `tools/` | Dev server, frame cut-out and upscale scripts |
| `.github/workflows/` | GitHub Pages deploy |
