import { z } from 'zod'

// The contract comes from measured responses: the REST docs do not define these
// bodies. Objects are open on purpose, so a new field is not a broken contract.
// `id` is a number on Postgres, although src/payload-types.ts declares a string.
const id = z.number().int().positive()
const timestamp = z.iso.datetime()
const status = z.enum(['draft', 'published'])

const documentFields = {
  id,
  title: z.string().min(1),
  slug: z.string().min(1),
  _status: status,
  publishedAt: timestamp.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
}

export const pageSchema = z.object({
  ...documentFields,
  hero: z.object({ type: z.enum(['none', 'highImpact', 'mediumImpact', 'lowImpact']) }),
  layout: z.array(z.object({ id: z.string(), blockType: z.string() })),
})

export const postSchema = z.object({
  ...documentFields,
  content: z.object({ root: z.object({ children: z.array(z.unknown()) }) }),
  // Ids only: the Users collection is not public, so a populated author here
  // would expose the account, email included
  authors: z.array(id),
  // Strict: these are public, so an extra field such as an email is a leak
  populatedAuthors: z.array(z.strictObject({ id, name: z.string() })),
})

export function paginatedSchema<Doc extends z.ZodType>(doc: Doc) {
  return z.object({
    docs: z.array(doc),
    totalDocs: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pagingCounter: z.number().int().positive(),
    hasPrevPage: z.boolean(),
    hasNextPage: z.boolean(),
    prevPage: z.number().int().positive().nullable(),
    nextPage: z.number().int().positive().nullable(),
  })
}

export function mutationSchema<Doc extends z.ZodType>(doc: Doc) {
  return z.object({ doc, message: z.string().min(1) })
}

export const errorSchema = z.object({
  errors: z.array(z.object({ message: z.string().min(1) })).min(1),
})

export const validationErrorSchema = z.object({
  errors: z.tuple([
    z.object({
      name: z.literal('ValidationError'),
      message: z.string().min(1),
      data: z.object({
        collection: z.string(),
        errors: z.array(z.object({ path: z.string(), message: z.string().min(1) })).min(1),
      }),
    }),
  ]),
})
