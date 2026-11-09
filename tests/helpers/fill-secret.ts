import { expect, type Locator } from '@playwright/test'

/**
 * Fills a field without the value in the step title.
 *
 * `locator.fill(value)` is reported as `Fill "<value>"` in the HTML report, so
 * a password typed that way would be public once the report is published. This
 * sends the same input event from page JavaScript, and the report shows only
 * `Evaluate`. The prototype's setter, not `input.value = ...`, because React
 * overrides the setter of a controlled input and would ignore the value.
 *
 * Remaining risk: this only protects step titles. A test that fails while the
 * secret is in the field still prints it, in the call log and in the page
 * snapshot of the error context, and a trace records the evaluate argument and
 * the login request. Do not rely on it for a credential that is not disposable.
 */
export async function fillSecret(field: Locator, value: string): Promise<void> {
  // The checks fill would make before typing: visible, enabled, editable
  await expect(field).toBeEditable()
  await field.evaluate((input, secret) => {
    if (!(input instanceof HTMLInputElement)) {
      throw new Error(`fillSecret expects an <input>, got <${input.tagName.toLowerCase()}>`)
    }
    input.focus()
    Reflect.set(HTMLInputElement.prototype, 'value', secret, input)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}
