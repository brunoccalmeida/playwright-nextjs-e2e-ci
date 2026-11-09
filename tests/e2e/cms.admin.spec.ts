import { randomUUID } from 'node:crypto'

import { expect, richText, test } from '../helpers/cms'
import { knownIssue } from '../known-issues'

test.describe('CMS journey, from the admin panel to the frontend', () => {
  test('an edit published in the admin reaches visitors', async ({
    page,
    visitorPage,
    adminRequest,
    createPage,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const before = `Before the edit ${suffix}`
    const after = `After the edit ${suffix}`
    const { id, slug } = await createPage({
      hero: { type: 'lowImpact', richText: richText(before) },
    })

    // Visited first so the page is cached: the edit has to invalidate it,
    // which a page rendered for the first time after the edit would not prove
    await visitorPage.goto(`/${slug}`)
    await expect(visitorPage.getByText(before)).toBeVisible()

    await page.goto(`/admin/collections/pages/${String(id)}`)
    await page.getByRole('textbox').filter({ hasText: before }).click()
    await page.keyboard.press('ControlOrMeta+A')
    // Real key presses: Lexical discards text injected with insertText
    await page.keyboard.type(after)
    await expect(page.getByRole('textbox').filter({ hasText: after })).toBeVisible()
    // The editor shows the text before the form holds it, and publishing sends
    // the form. The autosaved draft comes from that same form state.
    await expect
      .poll(async () => {
        const draft = await adminRequest.get(`/api/pages/${String(id)}`, {
          params: { draft: 'true' },
        })
        return draft.text()
      })
      .toContain(after)
    await page.getByRole('button', { name: 'Publish changes' }).click()
    await expect(page.getByText('Updated successfully')).toBeVisible()

    await visitorPage.reload()
    await expect(visitorPage.getByText(after)).toBeVisible()
    await expect(visitorPage.getByText(before)).toBeHidden()
  })

  test.fail(
    'a published post appears in the posts listing',
    knownIssue('KI-6'),
    async ({ visitorPage, createPost }) => {
      const post = await createPost({ _status: 'published' })

      // Proves the post is live, so only the listing can be out of date
      await visitorPage.goto(`/posts/${post.slug}`)
      await expect(visitorPage.getByRole('heading', { name: post.title })).toBeVisible()

      await visitorPage.goto('/posts')
      await expect(visitorPage.getByRole('link', { name: post.title })).toBeVisible()
    },
  )
})
