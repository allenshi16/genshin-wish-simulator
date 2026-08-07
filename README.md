# Astral Wish Lab

An original, unofficial fan-made wish simulator, pity calculator, primogem planner, and local pull statistics tool. It does not use official artwork, connect to a game account, or claim exact unpublished soft-pity behavior.

## Commands

```bash
nvm use
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run seo:check
npm run build
```

## Production build

Set the public HTTPS origin with a trailing slash, then run the guarded production build:

```bash
VITE_SITE_URL=https://wish.example.com/ npm run build:production
```

Deploy the generated `dist/` directory at the origin root. `_headers` supplies security and cache headers on hosts that support the Netlify/Cloudflare Pages format; configure equivalent headers when using another provider.

`npm run build` uses `http://localhost:4173/` metadata for local verification and preview builds. CI uses Node from `.nvmrc` and installs exclusively from `package-lock.json` with `npm ci`.

## Hosting contract

- Build command: `VITE_SITE_URL=https://your-domain.example/ npm run build:production`
- Publish directory: `dist`
- Runtime: Node from `.nvmrc`, npm `10.9.0`
- Hosting path: origin root (`/`), not a repository subdirectory
- Required environment variable: `VITE_SITE_URL`, an HTTPS origin ending in `/`

After deployment, confirm the canonical URL, Open Graph image, `robots.txt`, `sitemap.xml`, and security response headers use the real host. Submit `/sitemap.xml` in Google Search Console when the domain is ready.
