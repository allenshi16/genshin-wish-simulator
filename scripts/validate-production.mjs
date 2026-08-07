const rawUrl = process.env.VITE_SITE_URL

if (!rawUrl) {
  console.error('VITE_SITE_URL is required for a production build, for example https://wish.example.com/')
  process.exit(1)
}

let siteUrl
try {
  siteUrl = new URL(rawUrl)
} catch {
  console.error('VITE_SITE_URL must be a valid absolute URL.')
  process.exit(1)
}

if (siteUrl.protocol !== 'https:' || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
  console.error('VITE_SITE_URL must be an HTTPS origin ending in / with no path, query, or hash.')
  process.exit(1)
}

console.log(`Production origin verified: ${siteUrl.href}`)
