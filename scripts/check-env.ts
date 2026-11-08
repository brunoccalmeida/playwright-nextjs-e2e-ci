// Run through `payload run`, which loads the .env files the same way Next.js does.
import { parseEnv } from './env'

parseEnv()
console.log('Environment OK')
