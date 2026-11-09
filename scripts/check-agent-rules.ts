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
const SKILLS = '.claude/skills/'
// Limits of the Agent Skills format, which both tools read.
const SKILL_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_SKILL_NAME = 64
const MAX_SKILL_DESCRIPTION = 1024
const MAX_SKILL_LINES = 500

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

// Skills are shared with Copilot from this one directory, so there is no copy
// to compare. What can still go wrong does so silently: an invalid name makes
// the skill not load, and a version written into a skill goes stale on the next
// upgrade, when the point of the skill is to find the docs for the pinned one.
const manifest = JSON.parse(read('package.json')) as {
  packageManager: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}
const pinnedVersions = [
  manifest.packageManager.split('@')[1],
  manifest.dependencies['payload'],
  manifest.dependencies['next'],
  manifest.devDependencies['@playwright/test'],
].filter((version): version is string => version !== undefined)

for (const entry of readdirSync(new URL(SKILLS, root), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const path = `${SKILLS}${entry.name}/SKILL.md`
  const skill = splitFrontmatter(path)
  const name = skill.data['name']
  const description = skill.data['description']
  if (name !== entry.name || !SKILL_NAME.test(entry.name) || entry.name.length > MAX_SKILL_NAME) {
    errors.push(`${path}: name must equal the directory and be lowercase words joined by hyphens.`)
  }
  if (
    typeof description !== 'string' ||
    description.length === 0 ||
    description.length > MAX_SKILL_DESCRIPTION
  ) {
    errors.push(`${path}: description must have 1 to ${String(MAX_SKILL_DESCRIPTION)} characters.`)
  }
  if (skill.body.split('\n').length > MAX_SKILL_LINES) {
    errors.push(`${path}: keep the skill under ${String(MAX_SKILL_LINES)} lines.`)
  }
  const text = `${String(description)}\n${skill.body}`
  for (const version of pinnedVersions.filter((pinned) => text.includes(pinned))) {
    errors.push(`${path}: mentions the pinned version ${version}; read it from package.json.`)
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exitCode = 1
}
