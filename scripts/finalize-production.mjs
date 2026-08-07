import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const siteUrl = new URL(process.env.VITE_SITE_URL).href
const allowLocalhost = process.argv.includes('--allow-localhost')
const files = ['dist/robots.txt', 'dist/sitemap.xml']

for (const file of files) {
  const source = await readFile(file, 'utf8')
  const output = source.replaceAll('%VITE_SITE_URL%', siteUrl)
  if (output.includes('%VITE_SITE_URL%')) {
    throw new Error(`Unresolved production URL token in ${file}`)
  }
  await writeFile(file, output)
}

const html = await readFile('dist/index.html', 'utf8')
const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
if (!jsonLdMatch) throw new Error('JSON-LD block was not found in dist/index.html')

const jsonLdHash = createHash('sha256').update(jsonLdMatch[1]).digest('base64')
const headers = (await readFile('dist/_headers', 'utf8')).replace('%JSON_LD_HASH%', jsonLdHash)
await writeFile('dist/_headers', headers)

for (const file of ['dist/index.html', 'dist/_headers', ...files]) {
  const output = await readFile(file, 'utf8')
  const hasDisallowedExample = !allowLocalhost && output.includes('example.com')
  if (output.includes('%VITE_SITE_URL%') || output.includes('%JSON_LD_HASH%') || hasDisallowedExample) {
    throw new Error(`Deployment placeholder remains in ${file}`)
  }
}

console.log('Production metadata finalized with no placeholder URLs.')
