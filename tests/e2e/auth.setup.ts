import { expect, test as setup } from '@playwright/test'

import { parseTestEnv } from '../../scripts/env'
import { ADMIN_STATE } from '../helpers/auth-state'
import { fillSecret } from '../helpers/fill-secret'

setup('log in to the admin panel', async ({ page }) => {
  const { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } = parseTestEnv()

  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(E2E_ADMIN_EMAIL)
  await fillSecret(page.getByLabel('Password'), E2E_ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()

  // The URL changes first: the session is only proven by the destination
  await expect(page.getByRole('heading', { name: 'Collections' })).toBeVisible()

  await page.context().storageState({ path: ADMIN_STATE })
})
