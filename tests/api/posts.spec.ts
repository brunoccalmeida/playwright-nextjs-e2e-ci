import { expect, postData, test } from '../helpers/cms'
import { errorSchema, paginatedSchema, postSchema } from '../helpers/cms-contract'
import { expectJson } from '../helpers/expect-json'

// Writes here stay in draft: a published post would show up in the listings
// that the homepage tests read, and the seed is the only shared data.
test.describe('REST API /api/posts', () => {
  test('lists published posts with the pagination contract', async ({ request }) => {
    const response = await request.get('/api/posts', { params: { limit: 1 } })

    const body = await expectJson(response, 200, paginatedSchema(postSchema))
    expect(body.docs).toHaveLength(1)
    expect(body).toMatchObject({ limit: 1, page: 1, hasPrevPage: false, hasNextPage: true })
  })

  test('finds a seeded post by slug, with its author reduced to public fields', async ({
    request,
  }) => {
    const response = await request.get('/api/posts', {
      params: { 'where[slug][equals]': 'digital-horizons' },
    })

    const body = await expectJson(response, 200, paginatedSchema(postSchema))
    expect(body.totalDocs).toBe(1)
    // postSchema accepts only ids in authors and only id and name here
    expect(body.docs[0]?.populatedAuthors).toHaveLength(1)
  })

  test('hides a draft post from anonymous visitors', async ({ request, createPost }) => {
    const draft = await createPost({ _status: 'draft' })

    const byId = await request.get(`/api/posts/${String(draft.id)}`)
    await expectJson(byId, 404, errorSchema)

    const list = await request.get('/api/posts', {
      params: { 'where[slug][equals]': draft.slug },
    })
    const body = await expectJson(list, 200, paginatedSchema(postSchema))
    expect(body.totalDocs).toBe(0)
  })

  test('shows a draft post to an authenticated user', async ({ adminRequest, createPost }) => {
    const draft = await createPost({ _status: 'draft' })

    const response = await adminRequest.get(`/api/posts/${String(draft.id)}`)

    const body = await expectJson(response, 200, postSchema)
    expect(body._status).toBe('draft')
  })

  test('refuses anonymous writes', async ({ request, createPost }) => {
    const draft = await createPost({ _status: 'draft' })

    const created = await request.post('/api/posts', { data: postData() })
    await expectJson(created, 403, errorSchema)

    const updated = await request.patch(`/api/posts/${String(draft.id)}`, {
      data: { title: 'Changed by a visitor' },
    })
    await expectJson(updated, 403, errorSchema)

    const deleted = await request.delete(`/api/posts/${String(draft.id)}`)
    await expectJson(deleted, 403, errorSchema)
  })
})
