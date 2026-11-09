import { randomUUID } from 'node:crypto'

import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test'
import type { z } from 'zod'

import { ADMIN_STATE } from './auth-state'
import { mutationSchema, pageSchema, postSchema } from './cms-contract'
import { expectJson } from './expect-json'

type Data = Record<string, unknown>

/** The smallest Lexical document that renders a paragraph with this text. */
export function richText(text: string) {
  const node = { format: '', indent: 0, version: 1, direction: null }
  return {
    root: {
      ...node,
      type: 'root',
      children: [
        {
          ...node,
          type: 'paragraph',
          textFormat: 0,
          children: [
            { type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 },
          ],
        },
      ],
    },
  }
}

function uniqueSlug(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`
}

export function pageData() {
  const slug = uniqueSlug('page')
  return {
    title: `Page ${slug}`,
    slug,
    _status: 'published',
    hero: { type: 'lowImpact', richText: richText(`Hero of ${slug}`) },
    layout: [{ blockType: 'content', columns: [{ size: 'full' }] }],
  }
}

export function postData() {
  const slug = uniqueSlug('post')
  return { title: `Post ${slug}`, slug, _status: 'published', content: richText(`Body of ${slug}`) }
}

/** Creates documents as admin and deletes every one of them afterwards. */
function tracked<Doc extends { id: number }>(
  admin: APIRequestContext,
  collection: string,
  schema: z.ZodType<Doc>,
) {
  const ids: number[] = []
  return {
    create: async (data: Data): Promise<Doc> => {
      // Without it Payload validates the required fields as if publishing
      const params: Record<string, string> = data._status === 'draft' ? { draft: 'true' } : {}
      const response = await admin.post(`/api/${collection}`, { data, params })
      const { doc } = await expectJson(response, 201, mutationSchema(schema))
      ids.push(doc.id)
      return doc
    },
    cleanup: async (): Promise<void> => {
      for (const id of ids) {
        const response = await admin.delete(`/api/${collection}/${String(id)}`)
        // 404: the test itself deleted it. Anything else leaves data behind
        expect([200, 404]).toContain(response.status())
      }
    },
  }
}

interface CmsFixtures {
  /** API session of the seeded admin; the built-in `request` stays anonymous. */
  adminRequest: APIRequestContext
  createPage: (overrides?: Data) => Promise<z.infer<typeof pageSchema>>
  createPost: (overrides?: Data) => Promise<z.infer<typeof postSchema>>
  /** A browser with no session: what the public sees, without the admin bar. */
  visitorPage: Page
}

export const test = base.extend<CmsFixtures>({
  adminRequest: async ({ playwright, baseURL }, use) => {
    const context = await playwright.request.newContext({
      ...(baseURL ? { baseURL } : {}),
      storageState: ADMIN_STATE,
    })
    await use(context)
    await context.dispose()
  },

  createPage: async ({ adminRequest }, use) => {
    const pages = tracked(adminRequest, 'pages', pageSchema)
    await use((overrides = {}) => pages.create({ ...pageData(), ...overrides }))
    await pages.cleanup()
  },

  createPost: async ({ adminRequest }, use) => {
    const posts = tracked(adminRequest, 'posts', postSchema)
    await use((overrides = {}) => posts.create({ ...postData(), ...overrides }))
    await posts.cleanup()
  },

  visitorPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      ...(baseURL ? { baseURL } : {}),
      // Explicit: the context would otherwise inherit the project's session
      storageState: { cookies: [], origins: [] },
    })
    await use(await context.newPage())
    await context.close()
  },
})

export { expect }
