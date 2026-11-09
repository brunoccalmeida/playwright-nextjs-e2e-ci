import { expect, test } from '@playwright/test'

test.describe('homepage on a phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('uses the 375x812 viewport', ({ page }) => {
    expect(page.viewportSize()).toEqual({ width: 375, height: 812 })
  })

  test('has no horizontal scroll', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      )
      .toBe(0)
  })

  test('keeps the whole header navigation on screen', async ({ page }) => {
    const header = page.getByRole('banner')

    for (const name of ['Posts', 'Contact', 'Search']) {
      const link = header.getByRole('link', { name, exact: true })
      await expect(link).toBeVisible()
      // Not toBeInViewport: with isMobile the browser widens the viewport to
      // fit overflowing content, so a link pushed off screen still counts as
      // inside it. clientWidth stays at the width of the phone.
      await expect
        .poll(() =>
          link.evaluate(
            (element) =>
              element.getBoundingClientRect().right - document.documentElement.clientWidth,
          ),
        )
        .toBeLessThanOrEqual(0)
    }
  })
})
