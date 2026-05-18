# Firelock 198X Army Builder

This application is a simple web application to calculate army lists for the tabletop game Firelock 198X. This application is powered by React in Vite with HMR and some ESLint rules. 

The application is current for Firelock 198X Edition 0.9.6.

## Firelock 198X

Firelock 198X can be found [on itch.io](https://drekfortmdc.itch.io/firelock-198x-09-public) or on [neoCities](https://drekfortmdc.neocities.org/)

## PDF source books (repo root)

Official FM PDFs live next to this README (`FM 1-8X …`, `FM 100-*-8X …`). They are the source of truth for points and designations when auditing `src/data/*Library.js`.

Regenerate plain-text copies for searching (requires [Poppler](https://poppler.freedesktop.org/), `pdftotext` on your `PATH`):

```bash
bash scripts/extract-pdf-text.sh
rg 'Grognard|Tanner|pts' reference/pdf-text/
```