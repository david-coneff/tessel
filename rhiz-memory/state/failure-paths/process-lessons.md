# Failure Paths: Process and Cross-Cutting Lessons

**Feature area**: CI workflow targeting, commit verification discipline,
Node.js version management, confirmed vs hypothetical tracking.  
**Related state doc**: [tauri-pwa-multiplatform-deployment.md](../tauri-pwa-multiplatform-deployment.md) §9–10  
**Index**: [lessons-learned-synthesis.md](../lessons-learned-synthesis.md)

These failures are not tied to a single feature. They are procedural failures
that burned diagnostic time by making real bugs harder to see.

---

## F-PROC-01 — CI Workflow Fix Committed to Feature Branch Instead of Main

**Feature scope**: `.github/workflows/tauri-build.yml`. The workflow's `on:` block
triggers on tag pushes and `workflow_dispatch`. Both execute against `main` by default.

**Root cause**: Multiple CI fixes (PNG signature check, icon generation step) were
committed to branch `claude/focused-johnson-qbhnmb`. Subsequent CI runs were
triggered from `main`, which did not include the fix. Each run repeated the same
failure, making it appear the fix had not worked.

**Rule**: Before committing a CI workflow fix, read the `on:` section:
```yaml
on:
  push:
    tags: ['v*']     # runs on the tagged commit — ensure tag is on main
  workflow_dispatch:  # runs on HEAD of selected branch (default: main)
```
The fix must land on `main` before triggering the next run. Either commit directly
to main or merge the feature branch first.

**Confirmation status**: **Confirmed** as a process failure. The wasted runs are
documented in the CI history.

**Extracted lesson**: Always read the `on:` section of a workflow file before
committing a fix. If the workflow runs on `main`, the fix must be on `main`.
Do not trigger a new CI run before verifying the fix commit is on the branch
the workflow will execute.

---

## F-PROC-02 — Diagnosing "Fix Didn't Work" Before Verifying the Fix Was Deployed

**Feature scope**: Any CI or deployment fix. General diagnostic discipline.

**Root cause**: On multiple occasions, a CI run failed with the same error after
a fix was committed. The temptation was to immediately diagnose a new root cause.
In several cases, the root cause was simply that the fix had not reached the branch
the CI was running against (see F-PROC-01), or that the Pages CDN had not yet
propagated (see F-PWA-01).

**Rule**: Before diagnosing "the fix didn't work," verify:
1. The fix commit is on the branch the CI/deployment is executing.
2. Sufficient propagation time has passed (GitHub Actions: ~30s; Pages CDN: 60–120s).
3. The browser cache has been cleared (incognito window for PWA).

**Confirmation status**: **Confirmed** as a recurring process failure.

**Extracted lesson**: The first question when a fix appears not to work is always
"did the fix actually run?" — not "what else could be wrong?" Verify deployment
before diagnosing. Checking takes 30 seconds; a false diagnosis takes much longer.

---

## F-PROC-03 — Node.js 18 Deprecation Warning in GitHub Actions

**Feature scope**: `.github/workflows/tauri-build.yml` — the `actions/setup-node`
and related action steps that run on Node 18.

**Root cause**: GitHub deprecated Node.js 18 as the runtime for GitHub Actions
hosted runners. Workflows using `node-version: '18'` began emitting deprecation
warnings in CI logs:
```
Node.js 18 actions are deprecated. Please update your actions to use Node.js 20.
```
These warnings do not cause failures but pollute CI logs and will eventually
become errors.

**Fix**: Update `actions/setup-node` and any pinned runner node versions to 20+:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
```

**Confirmation status**: **Confirmed** as a present warning. Actual failure date
not yet reached.

**Extracted lesson**: Node.js deprecation warnings in CI logs are advance notice
of future breakage. Address them at the time they appear, not when they become
failures. Check `actions/` version pins when setting up a new workflow; use `@v4`
or later for `actions/setup-node` and `actions/checkout`.

---

## F-PROC-04 — Hypothetical Fix Treated as Confirmed Without User Verification

**Feature scope**: rhiz-memory governance — the confirmed/hypothetical status
distinction defined in rhiz-State §6.7.

**Root cause**: Fixes are committed and merged to main without the user testing
the specific behavior in the target environment (Tauri on Windows, PWA after
clearing site data). There is a temptation to mark fixes as "confirmed" once
they compile and the logic appears correct.

A fix is only confirmed when the user has explicitly observed the corrected
behavior. Code review and logic analysis can establish a fix is correct; only
user observation can confirm the behavior changed.

**Active hypothetical fixes as of 2026-06-21**:

| ID | Feature | Fix | What to verify |
|----|---------|-----|----------------|
| B | Linux .deb PNG signature | `180d798` | Ubuntu CI run passes |
| C | Satellite panel hidden on pop-out | `fceb246` | Click ⧉ in Windows Tauri; panel disappears |
| D | Satellite frame closes on ↩/✕ | `6b1b2f0` | Frame closes, not just blanks |
| E | PWA theme fallback | `790771e` | Clear site data, reload; dark theme applies |

**Confirmation status**: **Confirmed** as a governance failure mode.

**Extracted lesson**: When writing rhiz-memory, mark any fix the user has not
explicitly verified as **Hypothetical**. Update to **Confirmed** only when the
user reports the behavior is correct. Never promote a fix to confirmed on the
basis of code review alone. Keep the open-hypotheticals table in
`lessons-learned-synthesis.md` current.
