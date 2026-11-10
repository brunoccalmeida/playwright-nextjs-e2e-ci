// Seeds through the Local API, before the build, so static pages are generated
// with content. Run it with NODE_ENV=production: in any other mode the Postgres
// adapter pushes the schema on connect, mixing push and migrations in one database.
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'
import type { CollectionSlug, Payload, PayloadRequest, SanitizedConfig } from 'payload'

import { seed } from '@/endpoints/seed'

import { parseEnv } from './env'

// The revalidation hooks call next/cache, which only works inside a Next.js
// request, and the template's seed disables them on just some of its writes.
// beforeChange runs ahead of those afterChange hooks, and it is one of the hook
// lists Payload initializes on both collections and globals at runtime.
function disableRevalidate<T>({ data, req }: { data: T; req: PayloadRequest }): T {
  req.context.disableRevalidate = true
  return data
}

function withoutRevalidation(base: SanitizedConfig): SanitizedConfig {
  const withHook = <
    T extends SanitizedConfig['collections'][number] | SanitizedConfig['globals'][number],
  >(
    entity: T,
  ): T => ({
    ...entity,
    hooks: {
      ...entity.hooks,
      beforeChange: [disableRevalidate, ...entity.hooks.beforeChange],
    },
  })

  return {
    ...base,
    collections: base.collections.map(withHook),
    globals: base.globals.map(withHook),
  }
}

// The collections the template's seed clears. That list is private to it.
const clearedBySeed: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'search',
]

// The template's seed clears these in parallel, and on a populated database
// Postgres can abort it with a deadlock (40P01): `delete from media` sets
// posts.hero_image to null while `delete from posts` removes the same rows.
// Clearing them one at a time leaves no competing transactions, and the
// template's own deletes then find empty tables.
async function clearOneAtATime(payload: Payload, req: PayloadRequest): Promise<void> {
  for (const collection of clearedBySeed) {
    await payload.db.deleteMany({ collection, req, where: {} })
  }
}

parseEnv()

// The seed clears the media records but not their files, and Payload renames an
// upload whose name is taken, so filenames would change on every run.
await rm(resolve('public/media'), { recursive: true, force: true })

const payload = await getPayload({ config: withoutRevalidation(await config) })
const req = await createLocalReq({}, payload)
await clearOneAtATime(payload, req)
await seed({ payload, req })

payload.logger.info('Seed finished')
await payload.destroy()
