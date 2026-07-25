## Contributing

Thanks for your interest in improving the Food Court Menus project! The app now uses an external API for data, so contributions focus on code improvements, UI enhancements, and feature development.

### Code of Conduct
Be kind and respectful. Assume positive intent. Keep discussions constructive and focused on solving problems.

---

## Quick Start (Dev)

Prereqs: Node 18+ and Bun.

```bash
bun install
bun run dev
```
Open http://localhost:3000.

Build, lint & typecheck:
```bash
bun run build
bun run lint
bun run typecheck
```

### TypeScript 7

This project typechecks with **TypeScript 7** — the native Go compiler, roughly
6x faster than 5.x (~0.15s vs ~0.9s on this codebase).

Two things about the setup are deliberately unusual, so please read before
changing them.

**1. The dependency is an alias.**

```json
"@typescript/native-preview": "npm:typescript@^7.0.2"
```

That installs `typescript@7.0.2` (GA) under the name `@typescript/native-preview`.
Next.js only accepts a native compiler if that exact package name resolves, and
the real `@typescript/native-preview` package is a stale `7.0.0-dev` build — so
the alias is how we get GA rather than a dev snapshot. There is no `typescript`
package installed at all; that is required, because Next uses the standard
package whenever it is present.

**2. `bun run typecheck` is the type-safety gate, not Next.**

TypeScript 7 ships no programmatic JS API until 7.1, and Next needs that API to
type-check during a build. So Next detects the native compiler and skips type
checking, logging:

> Detected `@typescript/native-preview` as TypeScript compiler. Some Next.js
> TypeScript features (like type checking during build) require the standard
> `typescript` package.

Which means `next build` alone will happily build code that does not typecheck.
The `&& bun run typecheck` on the end of the `build` script is what catches
that. **Do not remove it**, and keep it *after* `next build` so the generated
`.next/types` route definitions are included in the check.

Deployments are covered because both Vercel and Cloudflare run `bun run build`.

**Editors** fall back to their bundled TypeScript, since 7 ships no language
server yet.

#### Reverting this once 7.1 lands

When TypeScript 7.1 ships the programmatic API and Next.js supports it, all of
this collapses into a normal dependency:

1. Replace the alias with a plain `"typescript": "^7.1.x"` devDependency.
2. Point `typecheck` at `node_modules/typescript/bin/tsc --noEmit`.
3. Drop `&& bun run typecheck` from `build` — Next will type-check natively again.
4. Delete this section and the `//typescript` note in `package.json`.

---

## Project Conventions

Tech stack: Next.js (App Router), TypeScript, Tailwind v4, lucide-react.

- **TypeScript**: strict mode; avoid `any`. Prefer explicit types on exported APIs.
- **React**: client components only when interaction is needed. Keep hooks dependency arrays correct.
- **Styling**: Tailwind classes; keep UI minimalist and consistent.
- **API Integration**: Data is fetched from external Food Court API. Handle loading states and errors gracefully.
- **UX**: prioritize "upcoming meal first" logic and responsiveness.

---

## Submitting Changes

1) Fork and create a feature branch.
2) Make your changes and ensure:
   - `bun run lint` passes
   - `bun run typecheck` passes
   - `bun run build` succeeds
3) Open a PR with a concise description and screenshots if UI changes.
4) If you used AI to vibecode your contribution, please include the prompt(s) in the PR description.

Thank you for contributing!


