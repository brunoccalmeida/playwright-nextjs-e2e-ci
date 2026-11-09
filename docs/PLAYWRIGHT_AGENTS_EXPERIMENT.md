<!-- LTeX: language=en-US -->

# Playwright Test Agents: experiment report

An experiment run on 2026-11-09 to see whether [Playwright Test Agents](https://playwright.dev/docs/test-agents) can work under this project's rules. The planner, generator and healer were pointed at one feature, the contact form at `/contact`.

**Verdict:** useful for drafting a plan and first tests, and good at repairing a broken locator. It is not safe to run unattended here. The healer's default instructions hide bugs behind `test.fixme()`, and it cannot tell a stale test from a real regression. The generated agent files were not kept. See [Decision](#decision).

## Setup

| Item        | Value                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Playwright  | 1.63.0                                                                                                  |
| Agent files | `playwright init-agents --loop=claude -c config/playwright.config.ts --project=chromium`                |
| Runner      | Claude Code 2.1.319 in non-interactive mode (`-p`), one agent per run                                   |
| Model       | Sonnet, as set by the generated files (`model: sonnet`), reported as `claude-sonnet-5-5`                |
| Application | Production build, migrated and seeded Postgres, no edits to the app                                     |
| Permissions | Fixed tool list per agent; the healer could only edit `tests/e2e/contact-form/`                         |
| Limits      | US$ 3 per run. A 15-minute limit was added after the first run hung                                      |

`--help` in 1.63.0 lists `claude`, `codex`, `copilot`, `opencode`, `vscode` and `vscode-legacy` as `--loop` values. `claude` is the right one for Claude Code. The docs' Claude Code example shows `--loop=vscode`, which looks like a mistake on that page.

The agents ran with the project's `CLAUDE.md` loaded, unless noted. That is how they would run in this repository, but it means they knew the rules. The planner's output cites `test.fail` and the "seen failing" rule, which it can only have learned from there.

## Runs

| Agent     | Task                                                 | Outcome                                               | Time   | Cost (estimate) |
| --------- | ---------------------------------------------------- | ----------------------------------------------------- | ------ | --------------- |
| Planner   | Plan the contact form                                | **Hung**; killed after over 25 min, no plan saved     | 25+ min | not reported   |
| Planner   | Same session, resumed and told why it had hung       | 16 scenarios in `specs/contact-form.md`               | 48 s   | $0.09           |
| Generator | 3 of those scenarios                                 | 3 spec files, 10 tool errors recovered from           | 110 s  | $0.40           |
| Healer    | Test failing from an app bug, project rules loaded   | `test.fail` with a known issue; 2 edits denied        | 35 s   | $0.13           |
| Healer    | Same bug, rules disabled, hint comment removed       | `test.fixme()`                                        | 18 s   | $0.04           |
| Healer    | 2 planted test defects, project rules loaded         | Both tests repaired                                   | 48 s   | $0.08           |

Costs are the CLI's client-side estimates. The total is about US$ 0.74, plus whatever the hung run used.

Each condition ran **once**. These are observations, not rates: the agents are not deterministic, and a different run could behave differently.

## What the agents got right

- **User-facing locators.** Every generated test uses `getByRole` and `getByText`, with `/contact` relative to `baseURL`. There are no time-based waits in the generated tests.
- **Waiting for results.** `waitForResponse` is registered before the click, and the "no request was sent" check comes after the validation errors appear.
- **The generator corrected the planner.** The plan says the confirmation has "no heading". The generator saw it rendered as an `h2` and said so in a comment.
- **Honest reporting.** The generator said it had not run its tests. It also disclosed dropping one plan input, `a@b`, because the app accepts it.
- **A real bug.** The planner noticed that a malformed email gets "This field is required". It is now [KI-8](KNOWN_ISSUES.md#ki-8-a-malformed-email-shows-the-generic-required-field-message).
- **Locator repair.** With a button renamed to `Send` in the test, the healer restored `Submit`, a one-line diff.

First run of the generated tests, before any healing: 2 passed, 1 failed from the app bug. `tsc` passed.

## What needed correction

| Problem                                                                                     | Where     | Caught by             |
| ------------------------------------------------------------------------------------------- | --------- | --------------------- |
| Plan expects `a@b` to be rejected; the app accepts it                                       | Planner   | Generator             |
| Plan says "record behavior" instead of stating an expected result (scenarios 2.3, 2.6, 2.7) | Planner   | Review                |
| Scenario 3.1 partly overlaps the tab-order test on `/contact` in `keyboard.spec.ts`          | Planner   | Review                |
| One test per file: 16 files for one form, unlike the rest of the suite                      | Both      | Review                |
| Parent lookup with `.locator('..')`, a DOM-structure dependency                             | Generator | Review, not lint      |
| A loop of 3 emails: in a failing test, only the first ever ran                              | Generator | The healer's report   |
| Prettier failed on 2 generated tests and on the seed file                                   | Generator | `format:check`        |
| The generated seed file has unused variables and no assertion                               | `init`    | ESLint                |
| `planner_setup_page` needs `project`, or it answers `seed test not found`                   | Tooling   | The agents, on retry  |
| Snapshots in `.playwright-mcp/`, at the repository root and not in `.gitignore`             | Tooling   | `git status`          |
| `.mcp.json` has no `--config`, and this repository's config is not at the root              | `init`    | Reading the file      |

On the last row: without `--config`, the server would presumably pick up the template's root `playwright.config.ts`, which starts `pnpm dev`. That was inferred and not executed. This project avoids `dev` because it marks the migrated database as `dev`.

## What would have broken the project rules

**1. The healer's default instructions hide bugs.** The generated file says to mark a test `test.fixme()` when it is confident the test is correct, and also "Do not ask user questions". The control run followed that, and reported "2 tests pass and this one is skipped". The [docs](https://playwright.dev/docs/api/class-test) say Playwright "will not run the test past the `test.fixme()` call", so the bug stops being checked. This project's rule is `test.fail()`, which "runs this test and ensures that it is actually failing" and flags the day the bug is fixed.

| Healer on the same app bug | Result                                                             | Bug still checked? |
| -------------------------- | ------------------------------------------------------------------ | ------------------ |
| With the project's rules   | `test.fail` with `knownIssue`, tried to add the known issue entry  | Yes                |
| Out of the box             | `test.fixme()`                                                     | No                 |

The rules in `CLAUDE.md` overrode the agent's own instructions in the one run tested. A rule written in prose is not a guarantee, so a `test.fixme` should also be stopped by lint before anyone relies on this.

**2. It rewrites expectations to match the app.** A test was planted expecting a message the app does not show. The healer changed the test to the app's text and concluded it was not an app bug. That was correct, since the defect was planted. But the generated instructions list "Fixing assertions and expected values", and the action would look the same if the app had regressed. The healer has no source for what is correct other than the test and the current app.

**3. Its "seen failing" claim was not the rule's.** After the planted defects, the healer said the tests had been seen failing for the right reason. A test failing because of a wrong button name says nothing about the behavior it checks.

**4. It reached outside its task.** Asked to fix a test, the healer tried to edit `docs/KNOWN_ISSUES.md` and `tests/known-issues.ts`. The permission scope denied both, leaving the test referencing a `KI-8` that did not exist. The edits were reasonable under the project's rules, but scoping is what stopped them.

**5. Exploration ignored the waiting rule.** The rule against time-based waits held in the generated tests but not in the planner's exploratory code, which used `waitForTimeout(1000)`.

## Operational risk: an agent can hang silently

The first planner run called `locator.waitFor()` on an `h3` that the page does not have. `actionTimeout` is not set in this project, so the wait had no limit. Nothing ended it for over 25 minutes, and the budget limit did not help because an idle tool spends nothing.

The transcript kept receiving heartbeat events during the hang, which looked like progress. Tool calls completed is the number to watch, not events written. Any automated use needs an external time limit.

## Limits of this experiment

- One feature, one model and one run per condition.
- Only 3 of the 16 planned scenarios became tests.
- The healer was never given a flaky test.
- `CLAUDE_CODE_DISABLE_CLAUDE_MDS=1` removes `CLAUDE.md` memory files. The control run did not consult the project's known issues, but the repository was still readable.
- The healer did not use `test_debug` or the browser in any of its runs, although its instructions call for them. Its debugging workflow is therefore untested.

## Decision

- **Not adopted in CI, and the generated agent files were removed** (YAGNI). The [docs](https://playwright.dev/docs/test-agents) say they should be regenerated when Playwright is updated, so keeping them adds maintenance for a tool not in regular use.
- **Kept from the experiment:** KI-8 and its test, written by hand with the project's conventions. The generated tests were not kept.
- **If this is revisited:** use the planner and generator to draft, keep a person reviewing every change, and treat any healer change to an expected value as needing proof that the app is right. Add a lint rule against `test.fixme` first.

## Reproducing it

```sh
playwright init-agents --loop=claude -c config/playwright.config.ts --project=chromium
```

Then point the MCP server at this project's config with `playwright run-test-mcp-server -c config/playwright.config.ts --headless`, and set `NODE_ENV=production` and `NODE_OPTIONS="--no-deprecation --import=tsx/esm"` in its environment. Set an external time limit on every run.
