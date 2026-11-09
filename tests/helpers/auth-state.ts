import { resolve } from 'node:path'

/**
 * Where the setup project saves the admin session. Absolute, because the config
 * and the fixtures run from different directories. It holds a session cookie,
 * so its folder is in .gitignore.
 */
export const ADMIN_STATE = resolve(import.meta.dirname, '../../playwright/.auth/admin.json')
