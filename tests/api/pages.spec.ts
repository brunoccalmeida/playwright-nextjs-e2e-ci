import { expect, pageData, test } from '../helpers/cms'
import {
  errorSchema,
  mutationSchema,
  pageSchema,
  paginatedSchema,
  validationErrorSchema,
} from '../helpers/cms-contract'
import { expectJson } from '../helpers/expect-json'

// The largest id Postgres accepts for this column, so it never exists
const UNKNOWN_ID = 2147483647

test.describe('REST API /api/pages', () => {
  test.describe('reading', () => {
    test('lists published pages with the pagination contract', async ({ request }) => {
      const response = await request.get('/api/pages', { params: { limit: 1 } })

      const body = await expectJson(response, 200, paginatedSchema(pageSchema))
      expect(body.docs).toHaveLength(1)
      expect(body).toMatchObject({ limit: 1, page: 1, hasPrevPage: false, hasNextPage: true })
    })

    test('finds a published page by slug without logging in', async ({ request, createPage }) => {
      const page = await createPage()

      const response = await request.get('/api/pages', {
        params: { 'where[slug][equals]': page.slug },
      })

      const body = await expectJson(response, 200, paginatedSchema(pageSchema))
      expect(body.totalDocs).toBe(1)
      expect(body.docs[0]?.id).toBe(page.id)
    })

    test('reads a published page by id without logging in', async ({ request, createPage }) => {
      const page = await createPage()

      const response = await request.get(`/api/pages/${String(page.id)}`)

      const body = await expectJson(response, 200, pageSchema)
      expect(body.slug).toBe(page.slug)
    })

    test('answers 404 with the error contract for an unknown id', async ({ request }) => {
      const response = await request.get(`/api/pages/${String(UNKNOWN_ID)}`)

      const body = await expectJson(response, 404, errorSchema)
      expect(body.errors[0]?.message).toBe('Not Found')
    })
  })

  test.describe('drafts', () => {
    test('hides a draft from anonymous visitors', async ({ request, createPage }) => {
      const draft = await createPage({ _status: 'draft' })

      const byId = await request.get(`/api/pages/${String(draft.id)}`)
      await expectJson(byId, 404, errorSchema)

      const list = await request.get('/api/pages', {
        params: { 'where[slug][equals]': draft.slug },
      })
      const body = await expectJson(list, 200, paginatedSchema(pageSchema))
      expect(body.totalDocs).toBe(0)
    })

    test('shows a draft to an authenticated user', async ({ adminRequest, createPage }) => {
      const draft = await createPage({ _status: 'draft' })

      const response = await adminRequest.get(`/api/pages/${String(draft.id)}`)

      const body = await expectJson(response, 200, pageSchema)
      expect(body._status).toBe('draft')
    })
  })

  test.describe('anonymous writes', () => {
    test('refuses to create a page', async ({ request }) => {
      const data = pageData()

      const response = await request.post('/api/pages', { data })

      await expectJson(response, 403, errorSchema)
      const list = await request.get('/api/pages', {
        params: { 'where[slug][equals]': data.slug },
      })
      const body = await expectJson(list, 200, paginatedSchema(pageSchema))
      expect(body.totalDocs).toBe(0)
    })

    test('refuses to update a page', async ({ request, createPage }) => {
      const page = await createPage()

      const response = await request.patch(`/api/pages/${String(page.id)}`, {
        data: { title: 'Changed by a visitor' },
      })

      await expectJson(response, 403, errorSchema)
      const stored = await request.get(`/api/pages/${String(page.id)}`)
      const body = await expectJson(stored, 200, pageSchema)
      expect(body.title).toBe(page.title)
    })

    test('refuses to delete a page', async ({ request, createPage }) => {
      const page = await createPage()

      const response = await request.delete(`/api/pages/${String(page.id)}`)

      await expectJson(response, 403, errorSchema)
      const stored = await request.get(`/api/pages/${String(page.id)}`)
      await expectJson(stored, 200, pageSchema)
    })
  })

  test.describe('authenticated writes', () => {
    test('creates a page and returns it in the mutation envelope', async ({ adminRequest }) => {
      const data = pageData()

      const response = await adminRequest.post('/api/pages', { data })

      const body = await expectJson(response, 201, mutationSchema(pageSchema))
      try {
        expect(body.doc).toMatchObject({ title: data.title, slug: data.slug, _status: 'published' })
      } finally {
        // Not createPage: the request itself is what this test exercises
        await adminRequest.delete(`/api/pages/${String(body.doc.id)}`)
      }
    })

    test('rejects a page without its required fields, naming them', async ({ adminRequest }) => {
      const response = await adminRequest.post('/api/pages', { data: { _status: 'published' } })

      const body = await expectJson(response, 400, validationErrorSchema)
      const paths = body.errors[0].data.errors.map((error) => error.path)
      expect(paths.sort()).toEqual(['layout', 'slug', 'title'])
    })

    test('updates a page and persists the change', async ({
      request,
      adminRequest,
      createPage,
    }) => {
      const page = await createPage()
      const title = `${page.title} updated`

      const response = await adminRequest.patch(`/api/pages/${String(page.id)}`, {
        data: { title },
      })

      const body = await expectJson(response, 200, mutationSchema(pageSchema))
      expect(body.doc.title).toBe(title)
      const stored = await request.get(`/api/pages/${String(page.id)}`)
      expect((await expectJson(stored, 200, pageSchema)).title).toBe(title)
    })

    test('deletes a page', async ({ request, adminRequest, createPage }) => {
      const page = await createPage()

      const response = await adminRequest.delete(`/api/pages/${String(page.id)}`)

      const body = await expectJson(response, 200, mutationSchema(pageSchema))
      expect(body.doc.id).toBe(page.id)
      const stored = await request.get(`/api/pages/${String(page.id)}`)
      await expectJson(stored, 404, errorSchema)
    })
  })
})
