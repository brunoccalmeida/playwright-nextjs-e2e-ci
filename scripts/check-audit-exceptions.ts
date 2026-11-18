// Sentinel: every advisory the audit ignores is time-boxed and tracked.
//
// pnpm's audit.ignore is a bare list of GHSA IDs: it has no reason, no owner
// and no expiry, so an exception added for a vulnerability with no published
// fix stays forever, even after the fix ships. Each entry here must carry, on
// its own line, the comment "# expires YYYY-MM-DD, #<issue>". An expired entry
// fails, so the risk is reviewed again: renew the date after checking the
// advisory and the issue, or remove the entry. The date can be at most
// MAX_DAYS ahead, so a renewal cannot postpone the review indefinitely.
//
// Runs offline: the issue number is checked for format only, so an outage of
// the GitHub API cannot fail an unrelated PR.
import { readFileSync } from 'node:fs'
import { isScalar, isSeq, parseDocument } from 'yaml'

const FILE = 'pnpm-workspace.yaml'
const MAX_DAYS = 30
const GHSA = /^GHSA(-[0-9a-z]{4}){3}$/
const COMMENT = /^ ?expires (\d{4}-\d{2}-\d{2}), #(\d+)$/
const DAY_MS = 86_400_000

const source = readFileSync(new URL(`../${FILE}`, import.meta.url), 'utf8')
const doc = parseDocument(source)
const errors: string[] = doc.errors.map((error) => `${FILE}: ${error.message}`)

// The pre-11.16 name keeps working in pnpm 11, so a list under it would skip
// this check. https://github.com/pnpm/pnpm.io/blob/main/versioned_docs/version-11.x/cli/audit.md
if (doc.has('auditConfig')) {
  errors.push(
    `${FILE}: use audit.ignore, not the deprecated auditConfig, so exceptions stay checked.`,
  )
}

const today = Date.parse(new Date().toISOString().slice(0, 10))
const list = doc.getIn(['audit', 'ignore'], true)
const entries = list === undefined ? [] : isSeq(list) ? list.items : null
if (entries === null) errors.push(`${FILE}: audit.ignore must be a list of GHSA IDs.`)

const seen = new Set<string>()
for (const item of entries ?? []) {
  const id = isScalar(item) ? String(item.value) : String(item)
  const where = `${FILE}: audit.ignore ${id}`
  if (!GHSA.test(id)) {
    errors.push(`${where}: not a GitHub advisory ID (GHSA-xxxx-xxxx-xxxx).`)
    continue
  }
  if (seen.has(id)) errors.push(`${where}: listed twice.`)
  seen.add(id)

  const [, date = '', issue] = COMMENT.exec(isScalar(item) ? (item.comment ?? '') : '') ?? []
  const expires = Date.parse(date)
  if (issue === undefined) {
    errors.push(`${where}: add "# expires YYYY-MM-DD, #<issue>" on the same line.`)
  } else if (Number.isNaN(expires) || new Date(expires).toISOString().slice(0, 10) !== date) {
    errors.push(`${where}: "${date}" is not a valid date.`)
  } else if (expires < today) {
    errors.push(
      `${where}: expired on ${date}. Review the advisory and #${issue}; renew the date or remove the entry.`,
    )
  } else if (expires - today > MAX_DAYS * DAY_MS) {
    errors.push(`${where}: expires more than ${String(MAX_DAYS)} days ahead (${date}).`)
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}
