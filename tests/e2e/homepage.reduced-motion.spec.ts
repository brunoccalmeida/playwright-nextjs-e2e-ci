import { expect, test } from '@playwright/test'

test.describe('homepage with reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('the browser reports the preference', async ({ page }) => {
    // Without this, a misconfigured project would pass the test below for free
    const prefersReduced = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    )

    expect(prefersReduced).toBe(true)
  })

  test('shows the content with no animation running', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'All posts' }).first()).toBeVisible()

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.getAnimations().filter((animation) => animation.playState === 'running')
              .length,
        ),
      )
      .toBe(0)
  })
})
