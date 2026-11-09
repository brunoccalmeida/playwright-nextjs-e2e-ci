import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { knownIssue } from '../known-issues'

const seededPosts = [
  { title: 'Digital Horizons: A Glimpse into Tomorrow', path: '/posts/digital-horizons' },
  { title: 'Global Gaze: Beyond the Headlines', path: '/posts/global-gaze' },
  {
    title: 'Dollar and Sense: The Financial Forecast',
    path: '/posts/dollar-and-sense-the-financial-forecast',
  },
]

test.describe('homepage', () => {
  test.fail('has the site name once in the title', knownIssue('KI-1'), async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Payload Website Template')
  })

  test('renders the CMS sections in order', async ({ page }) => {
    const response = await page.goto('/')

    expect(response?.status()).toBe(200)
    // An array means "these, in this order, among all headings": the post
    // cards between sections may change without breaking the page structure.
    await expect(page.getByRole('heading')).toContainText([
      'Payload Website Template',
      'Core features',
      'Admin Dashboard',
      'Preview',
      'Page Builder',
      'SEO',
      'Dark Mode',
      'Recent posts',
      'This is a call to action',
    ])
  })

  test('lists the seeded posts as cards', async ({ page }) => {
    await page.goto('/')

    for (const { title, path } of seededPosts) {
      await expect(page.getByRole('link', { name: title })).toHaveAttribute('href', path)
    }
  })

  test('every internal link answers 200', async ({ page, request }) => {
    await page.goto('/')
    const links = page.getByRole('link')
    await expect(links.first()).toBeVisible()

    const { origin } = new URL(page.url())
    const hrefs = await links.evaluateAll((anchors: HTMLAnchorElement[]) =>
      anchors.map((anchor) => anchor.href),
    )
    const internalPaths = [
      ...new Set(
        hrefs
          .map((href) => new URL(href))
          .filter((url) => url.origin === origin)
          .map((url) => url.pathname),
      ),
    ]

    // Without this, an empty or partial list would pass: nothing to check.
    expect(internalPaths).toEqual(
      expect.arrayContaining([
        '/',
        '/posts',
        '/contact',
        '/search',
        '/admin',
        ...seededPosts.map(({ path }) => path),
      ]),
    )

    const results = await Promise.all(
      internalPaths.map(async (path) => ({
        path,
        status: (await request.get(path)).status(),
      })),
    )
    expect(results.filter(({ status }) => status !== 200)).toEqual([])
  })
})

test.describe('unknown URL', () => {
  // A new URL on every run: the first render is the one that can go wrong, and
  // a repeated URL would be answered from the cache of the previous run.
  const unknownPaths = {
    'single segment': `/missing-${randomUUID()}`,
    'unknown post': `/posts/missing-${randomUUID()}`,
  }

  for (const [kind, path] of Object.entries(unknownPaths)) {
    test(`shows the custom 404 page with status 404 (${kind})`, async ({ page }) => {
      const response = await page.goto(path)

      expect(response?.status()).toBe(404)
      await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Go home' })).toBeVisible()
      // The site layout proves it is the custom page, not the framework default
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
    })
  }

  test.fail(
    'shows the custom 404 page with status 404 (nested segments)',
    knownIssue('KI-2'),
    async ({ page }) => {
      const response = await page.goto(`/missing-${randomUUID()}/nested`)

      expect(response?.status()).toBe(404)
      await expect(page.getByRole('link', { name: 'Go home' })).toBeVisible()
    },
  )

  test('the 404 page leads back home', async ({ page }) => {
    await page.goto(`/missing-${randomUUID()}`)

    await page.getByRole('link', { name: 'Go home' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Payload Website Template')
  })
})
