// Sentinel for the rules the AI agents (Claude Code, GitHub Copilot) load.
//
// Always-loaded rules are paid in every request and a long file lowers
// adherence to each rule, so together they stay under the official target of
// 200 lines. Each tool reads path-scoped rules from its own directory and
// frontmatter; the copies must stay identical, or one agent silently follows
// outdated rules.
import { readdirSync, readFileSync } from 'node:fs'
import { parse } from 'yaml'

const MAX_ALWAYS_LOADED_LINES = 200
const ALWAYS_LOADED = ['CLAUDE.md', '.github/copilot-instructions.md']
const CLAUDE_RULES = '.claude/rules/'
const COPILOT_RULES = '.github/instructions/'
const COPILOT_SUFFIX = '.instructions.md'

const root = new URL('../', import.meta.url)
const read = (path: string): string =>
  readFileSync(new URL(path, root), 'utf8').replace(/\r\n/g, '\n')
const list = (dir: string, suffix: string): string[] =>
  readdirSync(new URL(dir, root))
    .filter((name) => name.endsWith(suffix))
    .map((name) => name.slice(0, -suffix.length))
    .sort()

function splitFrontmatter(path: string): { data: Record<string, unknown>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(read(path))
  if (!match) throw new Error(`${path}: no YAML frontmatter`)
  return { data: parse(match[1] ?? '') as Record<string, unknown>, body: match[2] ?? '' }
}

const errors: string[] = []

const lines = ALWAYS_LOADED.reduce((sum, path) => sum + read(path).split('\n').length - 1, 0)
if (lines >= MAX_ALWAYS_LOADED_LINES) {
  errors.push(
    `Always-loaded rules have ${String(lines)} lines (target: under ${String(MAX_ALWAYS_LOADED_LINES)}); move rules for part of the code to path-scoped files.`,
  )
}

const claude = list(CLAUDE_RULES, '.md')
const copilot = list(COPILOT_RULES, COPILOT_SUFFIX)
if (claude.length === 0) errors.push(`No path-scoped rules in ${CLAUDE_RULES}.`)
if (JSON.stringify(claude) !== JSON.stringify(copilot)) {
  errors.push(`Rule sets differ. Claude: ${claude.join(', ')}; Copilot: ${copilot.join(', ')}.`)
}

for (const name of claude.filter((rule) => copilot.includes(rule))) {
  const claudeRule = splitFrontmatter(`${CLAUDE_RULES}${name}.md`)
  const copilotRule = splitFrontmatter(`${COPILOT_RULES}${name}${COPILOT_SUFFIX}`)
  if (claudeRule.body !== copilotRule.body) {
    errors.push(`Rule "${name}": the body differs between Claude and Copilot.`)
  }
  const copilotPaths = String(copilotRule.data['applyTo'])
    .split(',')
    .map((glob) => glob.trim())
  if (JSON.stringify(claudeRule.data['paths']) !== JSON.stringify(copilotPaths)) {
    errors.push(`Rule "${name}": the paths differ between Claude and Copilot.`)
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exitCode = 1
}
