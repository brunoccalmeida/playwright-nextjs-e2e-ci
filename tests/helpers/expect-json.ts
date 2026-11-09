import type { APIResponse } from '@playwright/test'
import { z } from 'zod'

/**
 * Asserts the status, that the body is JSON, and that it matches the contract;
 * returns the body typed by the schema.
 *
 * Plain errors, not `expect(value, message)`: Playwright turns that message
 * into the step title of a passing assertion too, so response bodies, login
 * tokens included, would land in the published HTML report. Here the body is
 * only read into the message when the check fails.
 */
export async function expectJson<Schema extends z.ZodType>(
  response: APIResponse,
  status: number,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const text = await response.text()
  const context = `${response.url()}\nBody: ${text}`

  if (response.status() !== status) {
    throw new Error(
      `Expected HTTP ${String(status)}, received ${String(response.status())}: ${context}`,
    )
  }

  const contentType = response.headers()['content-type'] ?? '(none)'
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected a JSON Content-Type, received "${contentType}": ${context}`)
  }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Body is not valid JSON: ${context}`)
  }

  const result = schema.safeParse(json)
  if (!result.success) {
    throw new Error(
      `Body does not match the contract:\n${z.prettifyError(result.error)}\n${context}`,
    )
  }
  return result.data
}
