import AxeBuilder from '@axe-core/playwright'
import { test as base } from '@playwright/test'

type AxeFixtures = {
  /** Scans the page as it is now and returns one line of evidence per violation. */
  scan: (narrow?: (axe: AxeBuilder) => AxeBuilder) => Promise<string[]>
}

// The current WCAG version, levels A and AA. wcag22aa is not in the list of the
// Playwright docs example, which stops at 2.1.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

export const test = base.extend<AxeFixtures>({
  scan: async ({ page }, use, testInfo) => {
    await use(async (narrow = (axe) => axe) => {
      const results = await narrow(new AxeBuilder({ page }).withTags(WCAG_TAGS)).analyze()
      // The full result, with the HTML and how to fix it, goes to the report;
      // the assertion gets short and stable text, as the Playwright docs advise
      await testInfo.attach('axe-results', {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      })
      return results.violations.flatMap(({ id, nodes }) =>
        nodes.map(({ target }) => `${id}: ${target.join(' ')}`),
      )
    })
  },
})

export { expect } from '@playwright/test'
