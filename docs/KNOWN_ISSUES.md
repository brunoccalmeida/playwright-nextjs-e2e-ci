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

## KI-3: Code block line numbers have insufficient contrast

- **Observed:** line numbers in code blocks render as `#404040` on `#000000`, a contrast of 2.02:1, in both themes. axe reports lines 10 and up; it treats single-character text as inconclusive, but lines 1 to 9 have the same colors.
- **Expected:** at least 4.5:1 ([WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)).
- **Cause:** the `text-white/25` class in `src/blocks/Code/Component.client.tsx`.
- **Impact:** low. The code itself is readable; the numbers are a reading aid and cannot be selected.
- **Test:** `code block line numbers have enough contrast`, in `tests/e2e/accessibility.spec.ts`.

## KI-4: Open theme selector leaves focusable content inside aria-hidden regions

- **Observed:** while the theme selector is open, the header, the main content and the footer have `aria-hidden="true"` and still contain focusable links, buttons and fields. axe reports `aria-hidden-focus`.
- **Expected:** content hidden from assistive technology is not focusable ([WCAG 4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)).
- **Cause:** the Radix Select used by `src/components/ui/select.tsx` hides everything outside its popup while it is open, without taking that content out of the tab order.
- **Impact:** low. Tab does not leave the open popup, so keyboard users cannot reach the hidden content; a test covers that. The combobox itself is also hidden while open, so its `aria-expanded="true"` is not exposed.
- **Test:** `open theme selector keeps focusable content out of aria-hidden regions`, in `tests/e2e/accessibility.spec.ts`.

## KI-5: Pages are blank when JavaScript is unavailable

- **Observed:** with JavaScript disabled, or if its bundles fail to load, every frontend page stays at `opacity: 0`. The content is in the HTML, but nothing is visible.
- **Expected:** server-rendered content stays readable without JavaScript.
- **Cause:** `src/app/(frontend)/globals.css` sets `html { opacity: 0 }` until `data-theme` is set, and only JavaScript sets it (`InitTheme`, then `ThemeProvider`). The rule prevents a flash of the wrong theme, at the cost of depending on JavaScript.
- **Impact:** moderate. Few visitors browse without JavaScript, but for them, and on a failed bundle load, the whole site is blank.
- **Test:** `the page is visible`, in `tests/e2e/accessibility.spec.ts`.

## KI-6: A newly published post is missing from the posts listing

- **Observed:** a post published through the admin or the REST API is live at `/posts/<slug>`, but `/posts` keeps serving the cached list without it (`x-nextjs-cache: HIT`).
- **Expected:** publishing a post updates the listing that links to it.
- **Cause:** `/posts` is `force-static` with `revalidate = 600` in `src/app/(frontend)/posts/page.tsx`, and the `revalidatePost` hook in `src/collections/Posts/hooks/revalidatePost.ts` only invalidates `/posts/<slug>` and the sitemap tag.
- **Impact:** moderate. Readers cannot find a new post from the listing for at least 10 minutes, and the first request after that still gets the old list while the page regenerates.
- **Test:** `a published post appears in the posts listing`, in `tests/e2e/cms.admin.spec.ts`.

## KI-7: REST validation errors lose their field details once the admin panel has loaded first

- **Observed:** when the first route to initialize Payload in a server process is an admin page, a `400` from the REST API has only `{"errors":[{"message":"The following fields are invalid: ..."}]}`. When an API route comes first, the same request also returns `name` and `data.errors`, with the path and message of each field. The state lasts until the server restarts. Static routes such as `/` and `/posts` do not count, because they do not initialize Payload.
- **Expected:** the error body does not depend on which route was requested first, and clients can map each error to its field.
- **Cause:** `formatErrors` in `payload/dist/utilities/formatErrors.js` only keeps `name` and `data` when `incoming instanceof ValidationError`. The likely reason it is false is that the admin and API routes get separate bundled copies of the class. The dependence on the first route is measured; the separate copies are inferred.
- **Impact:** low. The status and the summary message stay correct, but a REST client cannot highlight individual fields.
- **Test:** `a validation error details each invalid field`, in `tests/api/pages.spec.ts`.
