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

Build & lint:
```bash
bun run build
bun run lint
```

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
   - `bun run build` succeeds
3) Open a PR with a concise description and screenshots if UI changes.
4) If you used AI to vibecode your contribution, please include the prompt(s) in the PR description.

Thank you for contributing!


