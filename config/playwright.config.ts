import 'dotenv/config'

import { defineConfig, devices } from '@playwright/test'

import { parseEnv, parseTestEnv } from '../scripts/env'
import { ADMIN_STATE } from '../tests/helpers/auth-state'

const { NEXT_PUBLIC_SERVER_URL: baseURL } = parseEnv()
// Here and not only in the setup: a missing credential must stop the run
// before the build is served, not fail it from inside a test
parseTestEnv()

const desktop = { ...devices['Desktop Chrome'], channel: 'chromium' }

const MOBILE_SPECS = /\.mobile\.spec\.ts$/
const REDUCED_MOTION_SPECS = /\.reduced-motion\.spec\.ts$/
const ADMIN_SPECS = /\.admin\.spec\.ts$/

// The template's playwright.config.ts stays as generated. Paths here are
// relative to this file, so they point back to the repository root.
export default defineConfig({
  testDir: '../tests/e2e',
  outputDir: '../test-results',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Locally the key must be absent to get the default: exactOptionalPropertyTypes
  ...(process.env.CI ? { workers: 1 } : {}),
  // line: the failures must be readable in the CI log, not only in the report
  reporter: [['line'], ['html', { open: 'never', outputFolder: '../playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /\.setup\.ts$/,
      use: desktop,
    },
    {
      name: 'api',
      testDir: '../tests/api',
      // No storageState: `request` is an anonymous visitor here, and a test
      // that needs a session asks for it through the adminRequest fixture
      dependencies: ['setup'],
    },
    {
      name: 'admin',
      testMatch: ADMIN_SPECS,
      use: { ...desktop, storageState: ADMIN_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'chromium',
      testIgnore: [MOBILE_SPECS, REDUCED_MOTION_SPECS, ADMIN_SPECS],
      use: desktop,
    },
    {
      name: 'mobile',
      testMatch: MOBILE_SPECS,
      // After the spread: the device defines its own viewport
      use: {
        ...devices['Pixel 7'],
        channel: 'chromium',
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'reduced-motion',
      testMatch: REDUCED_MOTION_SPECS,
      use: { ...desktop, reducedMotion: 'reduce' },
    },
  ],
  // The production build, never `pnpm dev`: dev marks the migrated database as
  // dev, and it hid a failure that only the build shows (see the session log).
  webServer: {
    command: 'pnpm start',
    cwd: '..',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
})
