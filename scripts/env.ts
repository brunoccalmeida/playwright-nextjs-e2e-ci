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

export type Env = z.infer<typeof envSchema>

/**
 * Fails fast on a bad environment. The report names the variables and never
 * their values, because it ends up in terminals and CI logs.
 */
export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source)
  if (result.success) return result.data

  const problems = result.error.issues.map(
    (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
  )
  throw new Error(
    `Invalid environment. Check your .env against .env.example:\n${problems.join('\n')}`,
  )
}
