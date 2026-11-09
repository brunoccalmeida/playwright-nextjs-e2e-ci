import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

async function expectFocusWalk(page: Page, key: 'Shift+Tab' | 'Tab', stops: Locator[]) {
  for (const stop of stops) {
    await page.keyboard.press(key)
    await expect(stop).toBeFocused()
  }
}

test.describe('keyboard navigation', () => {
  test('tab order follows the reading order, both ways', async ({ page }) => {
    await page.goto('/contact')
    const header = page.getByRole('banner')
    const footer = page.getByRole('contentinfo')
    const stops = [
      header.getByRole('link', { name: 'Payload Logo' }),
      header.getByRole('link', { name: 'Posts', exact: true }),
      header.getByRole('link', { name: 'Contact', exact: true }),
      header.getByRole('link', { name: 'Search', exact: true }),
      page.getByRole('textbox', { name: 'Full Name' }),
      page.getByRole('textbox', { name: 'Email' }),
      page.getByRole('spinbutton', { name: 'Phone' }),
      page.getByRole('textbox', { name: 'Message' }),
      page.getByRole('button', { name: 'Submit' }),
      footer.getByRole('link', { name: 'Payload Logo' }),
      footer.getByRole('combobox', { name: 'Select a theme' }),
      footer.getByRole('link', { name: 'Admin', exact: true }),
      footer.getByRole('link', { name: 'Source Code', exact: true }),
      footer.getByRole('link', { name: 'Payload', exact: true }),
    ]

    await expectFocusWalk(page, 'Tab', stops)
    // Getting back out proves that no stop is a keyboard trap (WCAG 2.1.2)
    await expectFocusWalk(page, 'Shift+Tab', stops.slice(0, -1).reverse())
  })

  test('Enter follows the focused link', async ({ page }) => {
    await page.goto('/search')
    const posts = page.getByRole('banner').getByRole('link', { name: 'Posts', exact: true })

    await expectFocusWalk(page, 'Tab', [page.getByRole('banner').getByRole('link').first(), posts])
    await page.keyboard.press('Enter')

    // The content, not only the URL: the URL changes before the page renders
    await expect(page.getByRole('heading', { name: 'Posts', exact: true })).toBeVisible()
    await expect(page).toHaveURL('/posts')
  })
})

// The only composite widget in the frontend: it has no tabs and no dialog.
// Follows the WAI-ARIA select-only combobox pattern, with one difference that
// the pattern allows: Radix moves DOM focus to the option instead of using
// aria-activedescendant.
test.describe('theme selector', () => {
  let combobox: Locator

  test.beforeEach(async ({ page }) => {
    await page.goto('/search')
    // includeHidden: while open, Radix sets aria-hidden on everything else,
    // the combobox included, and getByRole would stop finding it (KI-4)
    combobox = page.getByRole('combobox', { name: 'Select a theme', includeHidden: true })
    // Before hydration it shows a placeholder and ignores the keyboard
    await expect(combobox).toHaveText('Auto')
    await combobox.focus()
  })

  test('starts collapsed and exposes its popup when opened', async ({ page }) => {
    await expect(combobox).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('ArrowDown')

    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible()
    await expect(combobox).toHaveAttribute('aria-expanded', 'true')
    await expect(listbox).toHaveAttribute(
      'id',
      (await combobox.getAttribute('aria-controls')) ?? '',
    )
    await expect(listbox.getByRole('option')).toHaveText(['Auto', 'Light', 'Dark'])
    await expect(listbox.getByRole('option', { name: 'Auto' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  test('arrow keys and Enter choose an option and return focus', async ({ page }) => {
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('option', { name: 'Auto' })).toBeFocused()

    // One key at a time: Radix moves the focus in a timeout, and a second key
    // pressed before it lands starts again from the old option
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('option', { name: 'Light' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('option', { name: 'Dark' })).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(combobox).toHaveText('Dark')
    await expect(combobox).toBeFocused()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  // What keeps KI-4 from reaching keyboard users: the focusable content under
  // aria-hidden cannot be reached while the popup is open
  test('Tab does not leave the open popup', async ({ page }) => {
    await page.keyboard.press('ArrowDown')
    const auto = page.getByRole('option', { name: 'Auto' })
    await expect(auto).toBeFocused()

    await page.keyboard.press('Tab')

    await expect(page.getByRole('listbox')).toBeVisible()
    await expect(auto).toBeFocused()
  })

  test('Escape closes without changing the value and returns focus', async ({ page }) => {
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('option', { name: 'Auto' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('option', { name: 'Light' })).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(combobox).toHaveText('Auto')
    await expect(combobox).toBeFocused()
  })
})
