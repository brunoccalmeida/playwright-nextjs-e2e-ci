import { z } from 'zod'

const secret = z
  .string({ error: 'is required' })
  .min(32, { error: 'must have at least 32 characters' })

const envSchema = z.object({
  DATABASE_URL: z
    .string({ error: 'is required' })
    .regex(/^postgres(ql)?:\/\//, { error: 'must be a postgres:// or postgresql:// URL' }),
  PAYLOAD_SECRET: secret,
  NEXT_PUBLIC_SERVER_URL: z
    .url({ error: 'must be an absolute URL' })
    .refine((url) => !url.endsWith('/'), { error: 'must not end with a slash' }),
  CRON_SECRET: secret,
  PREVIEW_SECRET: secret,
})

// Apart from envSchema: only the test run needs them, not the app or db scripts
const testEnvSchema = z.object({
  E2E_ADMIN_EMAIL: z.email({ error: 'must be an email address' }),
  E2E_ADMIN_PASSWORD: z.string({ error: 'is required' }).min(1, { error: 'is required' }),
})

export type Env = z.infer<typeof envSchema>
export type TestEnv = z.infer<typeof testEnvSchema>

/**
 * Fails fast on a bad environment. The report names the variables and never
 * their values, because it ends up in terminals and CI logs.
 */
function parse<Schema extends z.ZodType>(
  schema: Schema,
  source: NodeJS.ProcessEnv,
): z.infer<Schema> {
  const result = schema.safeParse(source)
  if (result.success) return result.data

  const problems = result.error.issues.map(
    (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
  )
  throw new Error(
    `Invalid environment. Check your .env against .env.example:\n${problems.join('\n')}`,
  )
}

export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return parse(envSchema, source)
}

export function parseTestEnv(source: NodeJS.ProcessEnv = process.env): TestEnv {
  return parse(testEnvSchema, source)
}
