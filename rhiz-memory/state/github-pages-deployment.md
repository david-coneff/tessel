# GitHub Pages Deployment — Known Issues and Fixes

## Context
Tessel VS Studio is deployed as a static file via GitHub Pages from the `main` branch.
The primary artifact is `studio/tessel-vs.html` — a fully self-contained singlefile build
(all CSS/JS inlined by vite-plugin-singlefile). URL:
`https://david-coneff.github.io/tessel/studio/tessel-vs.html`

---

## Issue 1: 404 on first visit after enabling Pages

**Symptom:** Visiting the github.io URL returns 404 immediately after enabling Pages.

**Cause:** GitHub Pages hasn't run its first build yet. The "Your site is live" banner
in Settings → Pages lags behind or may not appear until after first successful build.

**Fix:** Wait 2–5 minutes, or push a trivial commit to trigger a build. Check
Settings → Pages for the live banner, or Actions tab for the build job status.

---

## Issue 2: Jekyll build fails despite `.nojekyll` file

**Symptom:** Build fails in Actions tab ("pages build and deployment") even after
adding a `.nojekyll` file to the repo root.

**Cause:** `.nojekyll` does NOT prevent GitHub's `jekyll-build-pages` GitHub Action
from running Jekyll when using "Deploy from a branch." Jekyll still processes all
markdown files through Liquid templating.

**Fix:** Add a `_config.yml` at the repo root that excludes files containing
Liquid-incompatible syntax (curly brace patterns like `{{VAR=default}}` or
TypeScript-style type annotations like `{{ title: string, ... }}`):

```yaml
exclude:
  - spec/
  - tools/
  - node_modules/
  - "*.cjs"
  - "*.js"
  - ROADMAP.md
  - MODULARIZATION_PLAN.md
```

---

## Issue 3: Jekyll Liquid syntax errors in markdown files

**Symptom:** Build log shows errors like:
- `Liquid syntax error: Unexpected character = in "{{VAR=default}}"`
- `Liquid syntax error: Variable '{{ title: string, ... }' was not properly terminated`

**Cause:** Jekyll processes `.md` files through Liquid before rendering. Any `{{...}}`
pattern in markdown is interpreted as a Liquid variable. TypeScript type annotations
and template variable documentation in markdown will trigger this.

**Affected files in this repo:**
- `spec/CANONICAL-FILENAMES.md` — TypeScript-style type annotations (fatal)
- `ROADMAP.md` — `{{VAR=default}}` template notation (warnings → fatal if strict)

**Fix:** Add the containing directories/files to `exclude:` in `_config.yml` (see above).
Alternatively, wrap the offending content in `{% raw %}...{% endraw %}` Liquid tags,
but exclusion is simpler and avoids touching spec/design docs.

---

## PWA Deployment Notes

The PWA build (`npm run build:pwa`) outputs to `studio/tessel-pwa/dist/` which is
gitignored. For GitHub Pages PWA deployment, options are:
1. Remove dist from `.gitignore`, build locally, commit dist to a `gh-pages` branch
2. Add a GitHub Actions workflow to build and deploy on push to `main`

For now, the plain `studio/tessel-vs.html` singlefile build is the deployed artifact.
PWA deployment is Phase 9 (optional side-target) in ROADMAP.md.
