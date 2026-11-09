// Sentinel: the Playwright image pinned in the CI files must match the
// @playwright/test version in package.json.
//
// The image ships the browsers of one Playwright release. Dependabot bumps the
// package but not the image, so a bump fails the e2e job with "Executable
// doesn't exist", which does not say what to change. This reports it in the
// check job, with the exact line to paste.
//
// The registry is contacted only on a mismatch: a passing run needs no network,
// so an outage cannot fail an unrelated PR.
import { readFileSync } from 'node:fs'

const repository = 'mcr.microsoft.com/playwright'
const ciFiles = ['.github/workflows/ci.yml', '.gitlab-ci.yml']
const anyReference = /mcr\.microsoft\.com\/playwright[^\s'"]*/g
const pinnedReference =
  /^mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-([a-z]+)@sha256:[0-9a-f]{64}$/

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

// A multi-platform tag resolves to an index, and the digest of that index is
// what the CI files pin. Without these types MCR answers 404.
async function digestOf(tag: string): Promise<string> {
  const response = await fetch(`https://mcr.microsoft.com/v2/playwright/manifests/${tag}`, {
    method: 'HEAD',
    headers: {
      Accept:
        'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json',
    },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`HTTP ${String(response.status)}`)
  const digest = response.headers.get('docker-content-digest')
  if (digest === null) throw new Error('no Docker-Content-Digest header')
  return digest
}

const manifest = JSON.parse(read('package.json')) as { devDependencies: Record<string, string> }
const version = manifest.devDependencies['@playwright/test'] ?? ''
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`package.json: @playwright/test must be an exact version, found "${version}".`)
}

const images = ciFiles.map((file) => {
  const references = read(file).match(anyReference) ?? []
  const [reference] = references
  if (references.length !== 1 || reference === undefined) {
    fail(`${file}: expected exactly one ${repository} image, found ${String(references.length)}.`)
  }
  const [, imageVersion, distro] = pinnedReference.exec(reference) ?? []
  if (imageVersion === undefined || distro === undefined) {
    fail(`${file}: "${reference}" must be pinned as ${repository}:vX.Y.Z-<distro>@sha256:<digest>.`)
  }
  return { file, reference, imageVersion, distro }
})

const inSync =
  images.every(({ imageVersion }) => imageVersion === version) &&
  new Set(images.map(({ reference }) => reference)).size === 1

if (!inSync) {
  const tag = `v${version}-${images[0]?.distro ?? ''}`
  const current = images.map(({ file, reference }) => `  ${file}: ${reference}`).join('\n')
  const header = `The Playwright image in CI does not match @playwright/test ${version}.\n${current}\n`
  try {
    fail(`${header}Use this image in both files:\n  ${repository}:${tag}@${await digestOf(tag)}`)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    fail(
      `${header}Use the tag ${tag}, but its digest could not be read (${reason}).\n` +
        `The registry may be down, or the image not published yet. Change the tag and the digest together; to get the digest:\n` +
        `  docker buildx imagetools inspect ${repository}:${tag}`,
    )
  }
}
