# Speed up menu builds and loading without changing the design

Local review branch: `perf/local-menu-speed`, based on `main` at `334ff5d`.

Historical menus were downloaded one at a time, and the service worker started background requests even for cached, content-hashed application assets. This branch downloads menus through a shared six-request pool and serves cached immutable assets directly. Menu filtering preserves unchanged objects so memoized cards can skip rendering; week selection no longer needs a second render before starting its request.

| Measurement | Baseline | Candidate |
| --- | ---: | ---: |
| Data generation, 96-menu fixture with 40 ms API latency | 4,228 ms | 732 ms |
| Same fixture, all JSON bytes | 304,991 | 136,174 |
| 49 real archived menus, JSON bytes | 1,158,774 | 493,572 |
| Same archived menus, individually gzipped bytes | 87,724 | 79,326 |
| Redundant warm-cache JS/CSS/font requests in worker test | 3 | 0 |

The data-generation benchmark is synthetic and measures request scheduling, not production page-load time. It checks identical parsed menu contents and manifest week entries. Compaction removes whitespace; fonts, CSS, content, and assets are preserved. The combined production JavaScript changed from 831,889 to 832,418 bytes, so these gains come from less network and rendering work rather than a smaller JavaScript bundle.

Current, future, incomplete, and unversioned weeks are fetched again during retries. Historical reuse requires unchanged revision metadata and explicit date bounds before the current week. A regression test covers a partially uploaded current week alongside a future week. Manifest freshness, manual reset, Jain fallback, and mutable icon refresh remain intact. Requests have a 30-second deadline, and cache writes remain alive for the service worker to finish.

Validation includes 33 regression tests, project lint, formatting, typecheck, and a full production build against the live API. The build fetched 30 normal and 24 Jain weeks. Existing lint warnings remain; there are no lint errors. The browser check also verified a cached menu reload offline and a successful refresh after reconnecting.

The two emitted CSS files have identical SHA-256 hashes before and after. Browser comparisons use the same archived data, a fixed IST clock, light and dark themes, and widths of 390 and 1440 pixels. They cover the home page, history, daily week page, both full-week routes, contributing, and wrapped. Interaction comparisons cover day selection, every dietary filter, refresh, navigation, compact/detailed modes, and theme switching.

All 28 page pairs have identical text and measured geometry, with no browser errors. After allowing the browser compositor to settle, 27 pairs are pixel-identical and one differs by a single pixel. All 22 interaction-state pairs have identical screenshots and text. The initial screenshot harness captured some mobile carousel positions before scrolling had settled; no application styling was changed to resolve that timing artifact.

Reproduce the data benchmark and checks locally:

```sh
git show 334ff5d:scripts/build-menu-data.mjs > /tmp/fc-menu-baseline-builder.mjs
bun scripts/benchmark-menu-data.mjs /tmp/fc-menu-baseline-builder.mjs
bun run test
bun run lint
bun run format:check
bun run build
```

On this machine, Next's font downloads required `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` for both baseline and candidate builds. No application font configuration was changed.

Local browser logs, screenshots, and comparison scripts are in `/tmp/fc-menu-perf-evidence` and `/tmp/fc-menu-perf-tools`. Nothing was pushed, submitted to GitHub, or deployed.
