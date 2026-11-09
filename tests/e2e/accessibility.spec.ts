import { randomUUID } from 'node:crypto'

import type { Page } from '@playwright/test'

import { expect, test } from '../helpers/axe'
import { knownIssue } from '../known-issues'

const pages = [
  { name: 'homepage', path: '/', heading: 'Payload Website Template' },
  { name: 'posts list', path: '/posts', heading: 'Posts' },
  { name: 'contact', path: '/contact', heading: 'Example contact form:' },
  { name: 'search', path: '/search', heading: 'Search' },
  { name: '404', path: `/${randomUUID()}`, heading: '404' },
]

const post = {
  path: '/posts/digital-horizons',
  heading: 'Digital Horizons: A Glimpse into Tomorrow',
}

// CSS because axe takes selectors, and nothing accessible identifies a line
// number. It excludes only these spans, which hold a number and nothing else;
// disableRules('color-contrast') would blind the scan to the whole page.
const CODE_LINE_NUMBERS = '.token-line > .select-none'

/** allSettled: a transition replaced by another rejects its `finished`. */
async function animationsFinished(page: Page) {
  await page.evaluate(async () => {
    await Promise.allSettled(document.getAnimations().map(({ finished }) => finished))
  })
}

/**
 * axe reads the page once, so the page must be in its final state first. The
 * theme selector hydrates from a placeholder to its value and fades its color
 * to white: scanning during that fade reported a contrast of 4.42 for a color
 * that ends at 21.
 */
async function openSettled(page: Page, path: string, heading: string) {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Select a theme' })).toHaveText('Auto')
  await animationsFinished(page)
}

async function openThemeSelector(page: Page) {
  await openSettled(page, '/search', 'Search')
  await page.getByRole('combobox', { name: 'Select a theme' }).click()
  await expect(page.getByRole('listbox')).toBeVisible()
  await animationsFinished(page)
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`accessibility in the ${colorScheme} theme`, () => {
    test.use({ colorScheme })

    for (const { name, path, heading } of pages) {
      test(`${name} has no detectable WCAG A or AA violations`, async ({ page, scan }) => {
        await openSettled(page, path, heading)

        expect(await scan()).toEqual([])
      })
    }

    test('post has no detectable WCAG A or AA violations besides KI-3', async ({ page, scan }) => {
      await openSettled(page, post.path, post.heading)
      // Keeps the exclusion honest: it must still point at something real
      await expect(page.locator(CODE_LINE_NUMBERS).first()).toBeVisible()

      expect(await scan((axe) => axe.exclude(CODE_LINE_NUMBERS))).toEqual([])
    })

    test('open theme selector has no detectable WCAG A or AA violations besides KI-4', async ({
      page,
      scan,
    }) => {
      await openThemeSelector(page)

      expect(await scan((axe) => axe.disableRules(['aria-hidden-focus']))).toEqual([])
    })
  })
}

test.describe('known accessibility issues', () => {
  test.fail(
    'code block line numbers have enough contrast',
    knownIssue('KI-3'),
    async ({ page, scan }) => {
      await openSettled(page, post.path, post.heading)

      expect(await scan((axe) => axe.include(CODE_LINE_NUMBERS))).toEqual([])
    },
  )

  test.fail(
    'open theme selector keeps focusable content out of aria-hidden regions',
    knownIssue('KI-4'),
    async ({ page, scan }) => {
      await openThemeSelector(page)

      expect(await scan((axe) => axe.withRules(['aria-hidden-focus']))).toEqual([])
    },
  )

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    // axe skips what is invisible, so a scan would pass on this blank page
    test.fail('the page is visible', knownIssue('KI-5'), async ({ page }) => {
      await page.goto('/')

      await expect(page.locator('html')).toHaveCSS('opacity', '1')
    })
  })
})
