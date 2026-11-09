// Sentinel: the numbers in README.md and README.pt-BR.md must match the suite.
//
// Both READMEs promise that every claim matches its evidence, but they are
// written by hand, in two languages. A test or known issue added on its own
// makes them wrong, with no signal from types, lint or the suite.
//
// Only what the repository can answer is checked here, and without the
// network: GitHub or GitLab being down must not fail an unrelated pull
// request. What stays manual is listed in .claude/rules/readme.md.
import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { JSONReport, JSONReportSpec, JSONReportSuite } from '@playwright/test/reporter'
import { parse } from 'dotenv'

import { knownIssueAnchor, knownIssueTitles, type KnownIssueId } from '../tests/known-issues'

interface Facts {
  tests: number
  knownIssues: number
  bugTests: number
}

interface Readme {
  file: string
  claims: { fact: keyof Facts; pattern: RegExp }[]
  areaTableHeader: string
  // Only the English table repeats the headings; the other one translates them
  bugTitlesMatchHeadings: boolean
  impactLabels: Record<string, string>
}

const READMES: Readme[] = [
  {
    file: 'README.md',
    claims: [
      { fact: 'tests', pattern: /^\| Tests on `main` +\| (\d+),/m },
      { fact: 'tests', pattern: /\*\*About "(\d+) green":/ },
      { fact: 'knownIssues', pattern: /^\| Bugs found in the app +\| (\d+),/m },
      { fact: 'bugTests', pattern: /\*\*About "\d+ green":\*\* the (\d+) bug tests/ },
    ],
    areaTableHeader: '| Area ',
    bugTitlesMatchHeadings: true,
    impactLabels: { low: 'Low', moderate: 'Moderate' },
  },
  {
    file: 'README.pt-BR.md',
    claims: [
      { fact: 'tests', pattern: /^\| Testes na `main` +\| (\d+),/m },
      { fact: 'tests', pattern: /\*\*Sobre os "(\d+) verdes":/ },
      { fact: 'knownIssues', pattern: /^\| Bugs encontrados no app +\| (\d+),/m },
      { fact: 'bugTests', pattern: /\*\*Sobre os "\d+ verdes":\*\* os (\d+) testes de bug/ },
    ],
    areaTableHeader: '| Área ',
    bugTitlesMatchHeadings: false,
    impactLabels: { low: 'Baixo', moderate: 'Moderado' },
  },
]

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (file: string): string => readFileSync(join(root, file), 'utf8')

const specsOf = (suite: JSONReportSuite): JSONReportSpec[] => [
  ...suite.specs,
  ...(suite.suites ?? []).flatMap(specsOf),
]

interface ListedTest {
  file: string
  isBugTest: boolean
}

function listTests(): ListedTest[] {
  const dir = mkdtempSync(join(tmpdir(), 'readme-numbers-'))
  const output = join(dir, 'list.json')
  try {
    // Through test:e2e, so the listing cannot drift from how the suite runs.
    // The config validates the environment, and neither the CI check job nor
    // a clean clone has a .env. These values win over a stale local one
    // because dotenv does not override what is already set.
    execSync('pnpm run --silent test:e2e --list --reporter=json', {
      cwd: root,
      // stdout: --list prints every test there; errors come through stderr
      stdio: ['ignore', 'ignore', 'inherit'],
      env: {
        ...process.env,
        ...parse(read('.env.example')),
        // A file: with --list, stdout also carries the listing
        PLAYWRIGHT_JSON_OUTPUT_FILE: output,
      },
    })
    const report = JSON.parse(readFileSync(output, 'utf8')) as JSONReport
    if (report.errors.length > 0) {
      throw new Error(report.errors.map((error) => error.message).join('\n'))
    }
    return report.suites.flatMap(specsOf).flatMap((spec) => {
      const absolute = resolve(report.config.rootDir, spec.file)
      const file = relative(root, absolute).split(sep).join('/')
      return spec.tests.map((test) => ({
        file,
        // In --list nothing ran, so the marker is the only sign of test.fail()
        isBugTest: test.annotations.some((annotation) => annotation.type === 'fail'),
      }))
    })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function tableRows(markdown: string, header: string): string[][] {
  const lines = markdown.split(/\r?\n/)
  const start = lines.findIndex((line) => line.startsWith(header))
  if (start === -1) return []
  // +2 skips the header and the delimiter row
  const end = lines.findIndex((line, index) => index > start + 1 && !line.startsWith('|'))
  return lines.slice(start + 2, end === -1 ? undefined : end).map((line) =>
    line
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim()),
  )
}

function checkClaims(readme: Readme, markdown: string, facts: Facts): string[] {
  return readme.claims.flatMap(({ fact, pattern }) => {
    const found = pattern.exec(markdown)?.[1]
    if (found === undefined) return [`no longer finds the ${fact} claim: ${String(pattern)}`]
    return Number(found) === facts[fact]
      ? []
      : [`says ${found} ${fact}, the repository has ${String(facts[fact])}`]
  })
}

function checkAreaTable(readme: Readme, markdown: string, tests: ListedTest[]): string[] {
  const errors: string[] = []
  const rowsOfFile = new Map<string, string[]>()

  for (const [area = '', count = '', where = ''] of tableRows(markdown, readme.areaTableHeader)) {
    const links = [...where.matchAll(/\]\(([^)]+)\)/g)].map(([, href = '']) => href)
    const inRow = tests.filter((test) =>
      links.some((link) => test.file === link || test.file.startsWith(`${link}/`)),
    )
    for (const { file } of inRow) {
      rowsOfFile.set(file, [...new Set([...(rowsOfFile.get(file) ?? []), area])])
    }
    if (Number(count) !== inRow.length) {
      errors.push(`area "${area}" says ${count} tests, its files have ${String(inRow.length)}`)
    }
  }

  for (const { file } of tests) {
    const rows = rowsOfFile.get(file) ?? []
    if (rows.length !== 1)
      errors.push(`${file} must be in exactly one area, found: ${JSON.stringify(rows)}`)
  }
  return [...new Set(errors)]
}

function readImpacts(): Map<string, string> {
  const impacts = new Map<string, string>()
  // By section: a global search would take the next entry's impact when one is missing
  for (const section of read('docs/KNOWN_ISSUES.md').split(/^(?=## KI-)/m)) {
    const id = /^## (KI-\d+):/.exec(section)?.[1]
    const impact = /^- \*\*Impact:\*\* (\w+)/m.exec(section)?.[1]
    if (id !== undefined) impacts.set(id, impact ?? '')
  }
  return impacts
}

function checkBugsTable(readme: Readme, markdown: string, impacts: Map<string, string>): string[] {
  const rows = tableRows(markdown, '| Id ')
  const ids = Object.keys(knownIssueTitles) as KnownIssueId[]
  const expected = ids.map((id) => `[${id}](docs/KNOWN_ISSUES.md#${knownIssueAnchor(id)})`)
  const actual = rows.map(([link = '']) => link)

  const errors = [
    ...expected.filter((link) => !actual.includes(link)).map((link) => `bugs table lacks ${link}`),
    ...actual
      .filter((link) => !expected.includes(link))
      .map((link) => `bugs table has an unknown ${link}`),
  ]
  ids.forEach((id, index) => {
    const [, title, impact] = rows[index] ?? []
    if (readme.bugTitlesMatchHeadings && title !== knownIssueTitles[id]) {
      errors.push(`bugs table, ${id}: title differs from the heading in docs/KNOWN_ISSUES.md`)
    }
    const level = impacts.get(id) ?? ''
    const label = readme.impactLabels[level]
    if (label === undefined) {
      errors.push(`bugs table, ${id}: no label for the impact "${level}" in docs/KNOWN_ISSUES.md`)
    } else if (impact !== label) {
      errors.push(`bugs table, ${id}: impact should be ${label}, as docs/KNOWN_ISSUES.md says`)
    }
  })
  return errors
}

const tests = listTests()
const impacts = readImpacts()
const facts: Facts = {
  tests: tests.length,
  knownIssues: Object.keys(knownIssueTitles).length,
  bugTests: tests.filter((test) => test.isBugTest).length,
}

for (const readme of READMES) {
  const markdown = read(readme.file)
  const errors = [
    ...checkClaims(readme, markdown, facts),
    ...checkAreaTable(readme, markdown, tests),
    ...checkBugsTable(readme, markdown, impacts),
  ]
  if (errors.length > 0) {
    console.error(`${readme.file} disagrees with the repository:\n- ${errors.join('\n- ')}`)
    process.exitCode = 1
  }
}

if (process.exitCode === 1) {
  console.error('Update both READMEs. What stays manual: .claude/rules/readme.md')
}
