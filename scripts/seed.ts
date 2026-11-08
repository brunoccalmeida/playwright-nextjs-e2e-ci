// Seeds through the Local API, before the build, so static pages are generated
// with content. Run it with NODE_ENV=production: in any other mode the Postgres
// adapter pushes the schema on connect, mixing push and migrations in one database.
import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'
import type { PayloadRequest, SanitizedConfig } from 'payload'

import { seed } from '@/endpoints/seed'

import { parseEnv } from './env'

// The revalidation hooks call next/cache, which only works inside a Next.js
// request, and the template's seed disables them on just some of its writes.
function disableRevalidate({ req }: { req: PayloadRequest }): void {
  req.context.disableRevalidate = true
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
      beforeOperation: [disableRevalidate, ...entity.hooks.beforeOperation],
    },
  })

  return {
    ...base,
    collections: base.collections.map(withHook),
    globals: base.globals.map(withHook),
  }
}

parseEnv()

const payload = await getPayload({ config: withoutRevalidation(await config) })
const req = await createLocalReq({}, payload)
await seed({ payload, req })

payload.logger.info('Seed finished')
await payload.destroy()
