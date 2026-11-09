import type { TestDetails } from '@playwright/test'

export const KNOWN_ISSUES =
  'https://github.com/brunoccalmeida/playwright-nextjs-e2e-ci/blob/main/docs/KNOWN_ISSUES.md'

/**
 * The headings of docs/KNOWN_ISSUES.md, verbatim: the link anchors come from
 * them. scripts/check-known-issues.ts (in pnpm check) keeps both in sync.
 */
export const knownIssueTitles = {
  'KI-1': 'Homepage title repeats the site name',
  'KI-2': 'Unmatched nested URLs show the default Next.js 404 page',
  'KI-3': 'Code block line numbers have insufficient contrast',
  'KI-4': 'Open theme selector leaves focusable content inside aria-hidden regions',
  'KI-5': 'Pages are blank when JavaScript is unavailable',
  'KI-6': 'A newly published post is missing from the posts listing',
} as const

export type KnownIssueId = keyof typeof knownIssueTitles

/** GitHub's heading anchor: lowercase, punctuation dropped, spaces to hyphens. */
function anchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N} -]/gu, '')
    .replace(/ /g, '-')
}

/**
 * Details for a test.fail() that proves a documented app bug. In the HTML
 * report the expected failure shows a red error with only a bare "fail"
 * annotation, which reads as a broken test. This adds a plain sentence saying
 * why it fails, the link to the bug's entry, and the `@known-issue` tag, so
 * the report can be filtered to these tests.
 */
export function knownIssue(id: KnownIssueId): TestDetails {
  // join, not a template literal: while the map is empty (no known issues
  // yet) the key type is `never`, which the lint rule rejects
  const heading = [id, knownIssueTitles[id]].join(': ')
  return {
    tag: '@known-issue',
    annotation: [
      {
        type: 'Known issue',
        description: `${heading}. This test asserts the correct behaviour, so it is expected to fail until the app is fixed; the error below is the evidence of the bug.`,
      },
      { type: 'issue', description: `${KNOWN_ISSUES}#${anchor(heading)}` },
    ],
  }
}
