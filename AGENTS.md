# Repository Guide

## Verify changes

- Use Node from `.nvmrc` and `npm ci`; `package-lock.json` is authoritative. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run seo:check`, then `npm run build`.
- Wish mechanics live in `src/wishMath.ts` and are covered by `src/wishMath.test.ts`. Keep banner math out of React components so it remains testable.

## Product constraints

- This is an unofficial fan tool. Do not add official logos, character art, copied game UI, account login/import, or language implying affiliation with HoYoverse.
- The character-event model uses 0.6% base 5★, 90 hard pity, 50/50 plus post-loss guarantee, and 10-wish 4★ hard pity. The soft-pity curve after wish 73 is explicitly an approximation; do not present it as verified server behavior.
- Browser persistence uses the versioned `astral-wish-lab:v1` localStorage key. Data must remain local unless the product architecture is deliberately changed.

## Deployment and SEO

- Production deploys require `VITE_SITE_URL=https://host.example/ npm run build:production`; the script rejects non-HTTPS origins and unresolved metadata tokens.
- Keep useful explanatory text in the rendered page; the simulator must not become a thin animation-only landing page.
- `public/` files are copied to `dist/` by Vite. Build output is generated and should not be edited directly.
- The app assumes origin-root hosting because its assets use root-absolute URLs. Set equivalent security headers if the host does not support `public/_headers`.

## UI conventions

- The visual language is an original celestial observatory/editorial instrument panel, not a recreation of the game client.
- Preserve keyboard focus states, semantic labels, mobile layouts, and `prefers-reduced-motion` handling when changing interactions.
