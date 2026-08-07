import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const html = await readFile('index.html', 'utf8')
const appSource = await readFile('src/App.tsx', 'utf8')

function capture(pattern, label) {
  const match = html.match(pattern)
  if (!match) throw new Error(`${label} is missing from index.html`)
  return match[1].trim()
}

const title = capture(/<title>(.*?)<\/title>/s, 'Title')
const description = capture(/<meta name="description" content="(.*?)"/s, 'Meta description')
const appFile = ts.createSourceFile('App.tsx', appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const visibleParts = []

function visit(node) {
  if (ts.isJsxText(node)) visibleParts.push(node.text)
  if (ts.isStringLiteral(node) && node.parent && ts.isJsxExpression(node.parent)) visibleParts.push(node.text)
  ts.forEachChild(node, visit)
}

visit(appFile)
const visibleText = visibleParts.join(' ').replace(/\s+/g, ' ').toLowerCase()
const h1Text = appSource.match(/<h1>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase() ?? ''

const checks = [
  [title.length >= 30 && title.length <= 65, `Title length is ${title.length}; expected 30–65 characters.`],
  [description.length >= 110 && description.length <= 170, `Meta description length is ${description.length}; expected 110–170 characters.`],
  [title.toLowerCase().includes('genshin wish simulator'), 'Title must describe the Genshin Wish Simulator.'],
  [h1Text.includes('genshin wish simulator'), 'The visible H1 must describe the Genshin Wish Simulator.'],
  [visibleText.includes('genshin pity calculator'), 'Visible copy must explain the Genshin pity calculator.'],
  [visibleText.includes('weapon banner'), 'Visible copy must state the weapon banner scope.'],
  [html.includes('application/ld+json'), 'Software application structured data is missing.'],
  [html.includes('rel="canonical"'), 'Canonical URL is missing.'],
]

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message)
if (failures.length) {
  console.error(`SEO checks failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

const wordCount = visibleText.match(/[a-z0-9/]+/g)?.length ?? 0
const corePhraseCount = visibleText.split('genshin wish simulator').length - 1
console.log(`SEO checks passed: ${wordCount} visible source words; core phrase appears ${corePhraseCount} time(s); title ${title.length} chars; description ${description.length} chars.`)
