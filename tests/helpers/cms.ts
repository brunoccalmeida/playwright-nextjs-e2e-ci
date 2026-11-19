import { randomUUID } from 'node:crypto'

import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test'
import type { z } from 'zod'

import { ADMIN_STATE } from './auth-state'
import {
  formSchema,
  formSubmissionSchema,
  mutationSchema,
  pageSchema,
  postSchema,
} from './cms-contract'
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

export function formData() {
  const title = `Form ${uniqueSlug('form')}`
  return { title, confirmationMessage: richText(`Thanks from ${title}`) }
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
  createForm: (overrides?: Data) => Promise<z.infer<typeof formSchema>>
  /** Sends a submission to a form, as its contact form does. */
  submitForm: (formId: number) => Promise<z.infer<typeof formSubmissionSchema>>
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

  createForm: async ({ adminRequest }, use) => {
    const forms = tracked(adminRequest, 'forms', formSchema)
    await use((overrides = {}) => forms.create({ ...formData(), ...overrides }))
    await forms.cleanup()
  },

  // Depends on createForm only for the teardown order: a fixture is torn down
  // before the ones it depends on, and a form with submissions cannot be
  // deleted (docs/KNOWN_ISSUES.md, KI-9). Playwright reads the dependency from
  // the parameter's destructuring, so the name has to be there, unused.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- only orders the teardown
  submitForm: async ({ adminRequest, createForm }, use) => {
    const submissions = tracked(adminRequest, 'form-submissions', formSubmissionSchema)
    await use((formId) =>
      submissions.create({
        form: formId,
        submissionData: [{ field: 'email', value: 'a@example.com' }],
      }),
    )
    await submissions.cleanup()
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
