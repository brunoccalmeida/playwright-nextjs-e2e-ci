import { expect, test } from '@playwright/test'

import { knownIssue } from '../known-issues'

test.describe('contact form', () => {
  test.fail(
    'a malformed email gets a message about its format',
    knownIssue('KI-8'),
    async ({ page }) => {
      await page.goto('/contact')
      await page.getByRole('textbox', { name: 'Full Name' }).fill('Test User')
      await page.getByRole('textbox', { name: 'Email' }).fill('not-an-email')
      await page.getByRole('textbox', { name: 'Message' }).fill('Hello')
      await page.getByRole('button', { name: 'Submit' }).click()

      // Waits for the message itself: asserting that the generic one is hidden
      // would pass in the instant before validation renders anything
      await expect(page.getByText(/valid.*e-?mail|e-?mail.*(valid|format|address)/i)).toBeVisible()
    },
  )
})
