<!-- LTeX: language=en-US -->

# Known issues in the application under test

Defects in the application under test (the official Payload `website` template) found by this test suite.

**How they are tracked:** each issue has a test marked `test.fail()` that asserts the **correct** behavior and links here. While the defect exists, the test "fails as expected" and the run stays green; once the defect is fixed, the test starts failing and signals that the marker must be removed. The suite keeps documenting the defect and detects its fix, without hiding it behind a skipped test.

Issues are numbered in the order they were found.

## KI-1: Homepage title repeats the site name

- **Observed:** the `<title>` of `/` is `Payload Website Template | Payload Website Template`.
- **Expected:** the site name appears once.
- **Cause:** `src/utilities/generateMeta.ts` appends the site name to `meta.title`, and the seeded homepage already uses the site name as its `meta.title`.
- **Impact:** low. The title is what browser tabs and search results show.
- **Test:** `has the site name once in the title`, in `tests/e2e/homepage.spec.ts`.

## KI-2: Unmatched nested URLs show the default Next.js 404 page

- **Observed:** a URL with two or more unknown segments, such as `/missing/nested`, answers 404 with the framework's default page: no site header, no footer and no way back home.
- **Expected:** the custom 404 page, which a single unknown segment such as `/missing` does show.
- **Cause:** the custom page is `src/app/(frontend)/not-found.tsx`, which only renders when `notFound()` is thrown inside that route group. A single segment reaches `[slug]/page.tsx`, which throws it; a nested URL matches no route at all. Next.js handles unmatched URLs with a root `app/not-found` or `app/global-not-found`, and this app has neither, because its two route groups each define their own root layout. See the [Next.js docs](https://nextjs.org/docs/app/api-reference/file-conventions/not-found).
- **Impact:** moderate. A visitor on a mistyped or outdated deep link leaves the site's navigation behind.
- **Test:** `shows the custom 404 page with status 404 (nested segments)`, in `tests/e2e/homepage.spec.ts`.
