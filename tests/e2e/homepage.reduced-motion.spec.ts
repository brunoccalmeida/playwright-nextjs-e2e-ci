import { expect, test } from '@playwright/test'

declare global {
  interface Window {
    startedMotion: string[]
  }
}

test.describe('homepage with reduced motion', () => {
  test('the browser reports the preference', async ({ page }) => {
    await page.goto('/')

    // Without this, a misconfigured project would pass the test below for free
    const prefersReduced = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    )

    expect(prefersReduced).toBe(true)
  })

  test('shows the content without starting any animation', async ({ page }) => {
    // Recorded from the first paint: a short fade is over before any later
    // look at document.getAnimations(), and would go unnoticed.
    await page.addInitScript(() => {
      window.startedMotion = []
      window.addEventListener(
        'animationstart',
        (event) => {
          window.startedMotion.push(
            `${event.animationName} on ${(event.target as Element).tagName}`,
          )
        },
        true,
      )
      // Color changes are not motion for WCAG 2.3.3, and the header links do
      // run one when the hero sets the header theme. Opacity stays in: a fade
      // delays the content that this test requires to be visible.
      window.addEventListener(
        'transitionrun',
        (event) => {
          if (!/color|fill|stroke/.test(event.propertyName)) {
            window.startedMotion.push(
              `${event.propertyName} on ${(event.target as Element).tagName}`,
            )
          }
        },
        true,
      )
    })

    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'All posts' }).first()).toBeVisible()
    expect(await page.evaluate(() => window.startedMotion)).toEqual([])
  })
})
