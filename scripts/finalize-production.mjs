import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const siteUrl = new URL(process.env.VITE_SITE_URL).href
const allowLocalhost = process.argv.includes('--allow-localhost')
const adsenseClient = (process.env.VITE_ADSENSE_CLIENT ?? '').trim()
const files = ['dist/robots.txt', 'dist/sitemap.xml', 'dist/privacy/index.html']
const adsenseMetaPattern = /<meta\s+name="adsense-client"\s+content="%VITE_ADSENSE_CLIENT%"\s*\/?>\s*/gi
const unresolvedTokenPattern = /%(?:VITE_[A-Z0-9_]+|JSON_LD_HASH)%/g

function replaceProductionTokens(source, file) {
  let output = source.replaceAll('%VITE_SITE_URL%', siteUrl)

  if (adsenseClient) {
    output = output.replaceAll('%VITE_ADSENSE_CLIENT%', adsenseClient)
  } else {
    output = output.replace(adsenseMetaPattern, '')
  }

  const leftover = output.match(unresolvedTokenPattern)
  if (leftover) {
    throw new Error(`Unresolved production token(s) in ${file}: ${[...new Set(leftover)].join(', ')}`)
  }

  return output
}

async function collectDistTextFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const found = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      found.push(...await collectDistTextFiles(full))
      continue
    }
    if (entry.name === '_headers' || /\.(html|txt|xml)$/.test(entry.name)) {
      found.push(full)
    }
  }
  return found
}

for (const file of [...files, 'dist/index.html']) {
  const source = await readFile(file, 'utf8')
  await writeFile(file, replaceProductionTokens(source, file))
}

const html = await readFile('dist/index.html', 'utf8')
const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
if (!jsonLdMatch) throw new Error('JSON-LD block was not found in dist/index.html')

const jsonLdHash = createHash('sha256').update(jsonLdMatch[1]).digest('base64')
const headers = (await readFile('dist/_headers', 'utf8')).replace('%JSON_LD_HASH%', jsonLdHash)
await writeFile('dist/_headers', headers)

for (const file of await collectDistTextFiles('dist')) {
  const output = await readFile(file, 'utf8')
  const leftover = output.match(unresolvedTokenPattern)
  const hasDisallowedExample = !allowLocalhost && output.includes('example.com')
  if (leftover || hasDisallowedExample) {
    const reason = leftover ? `unresolved token(s) ${[...new Set(leftover)].join(', ')}` : 'example.com host'
    throw new Error(`Deployment placeholder remains in ${file}: ${reason}`)
  }
}

console.log('Production metadata finalized with no placeholder URLs.')
