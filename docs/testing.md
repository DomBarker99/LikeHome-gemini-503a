# Testing and CI

## Local command contract

| Command                    | Purpose                                  | Status                                                           |
| -------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `npm run format:check`     | Read-only Prettier formatting check      | Configured                                                       |
| `npm run check`            | Compatibility alias for `format:check`   | Configured                                                       |
| `npm run lint`             | ESLint rules; warnings fail              | Configured                                                       |
| `npm run build`            | Production build and route generation    | Configured                                                       |
| `npm run typecheck`        | TypeScript verification                  | Configured                                                       |
| `npm run validate`         | Formatting → lint → build → typecheck    | Configured; run before opening a PR                              |
| `npm run test:unit`        | Vitest unit suite                        | Vitest is installed; configuration, script and tests are pending |
| `npm run test:integration` | Database/service tests                   | Pending; database, tooling, script and tests not added           |
| `npm run test:e2e`         | Playwright against the production server | Pending; tooling, script and tests not added                     |

Use `npm run format` to apply Prettier changes or `npm run lint:fix` to apply ESLint fixes, then inspect the diff and rerun relevant checks. These commands modify files; CI should run the read-only checks.

Use Node.js 24.21.0 and npm 11.19.0. See [development environment](development-environment.md) for activation and editor integration. From a clean checkout, run `npm ci`, then `npm run validate`. The lockfile and toolchain pins must be committed together with their package.json changes.

The production build runs before typecheck so TanStack Start's route declarations are current. Keep the generated route tree tracked. ESLint keeps the scaffold's TanStack rules, adds React Hooks checks, and excludes generated output. Prettier handles formatting through its configuration; `eslint-config-prettier` avoids overlapping formatting rules.

`.prettierignore` excludes generated output, reports, the route tree and the lockfile from formatting. The route tree and lockfile remain tracked in Git.

For documentation-only changes, check the edited Markdown with Prettier and verify local links and command names against package.json. Application changes also need the relevant lint/build checks and, once configured, meaningful tests. A production build is not a substitute for a test suite or a dedicated typecheck.

## Local setup verification

On September 29, 2026, a fresh source copy without node_modules passed `npm ci` and `npm run validate` using the pinned runtime. The local production server returned HTTP 200 with the expected scaffold page and was then stopped. A conditional React Hook probe was rejected by ESLint; no probe files were added to the repository.

The build still reports dependency bundling warnings about module directives and code splitting. The build and startup checks passed; these checks do not establish a hosted deployment or browser test coverage. Editor integration and onboarding on a second teammate's machine remain to be checked manually.

## CI

The commented [workflow](../.github/workflows/ci.yml) is prepared locally. Publishing it and verifying its first GitHub Actions run are still pending. It adapts the infrastructure guide's core recipe to the commands actually available in this scaffold; it does not call the guide's unimplemented test scripts or require database/authentication settings.

The workflow runs on PRs targeting `main`, pushes to `main`, and manual dispatch. The PR branch filter selects the destination branch. A normal PR checkout checks GitHub's proposed merge; the push run checks the actual commit accepted onto `main`. The manual button becomes available once the workflow exists on the default branch. There are no path filters, so documentation PRs also produce the final check.

### Reading the workflow

The workflow decides when and where to run commands. The project scripts in package.json define what those commands do. YAML indentation groups the settings into workflow → jobs → steps; comments beginning with `#` explain them without executing anything.

| Component             | Responsibility in this workflow                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name: CI`            | Names the workflow in the Actions tab.                                                                                                                                    |
| `on`                  | Selects the events that start a run.                                                                                                                                      |
| `permissions`         | Gives the automatic GitHub token read access to repository contents.                                                                                                      |
| `concurrency`         | Cancels an older run of the same PR when a newer update starts; main/manual runs use unique groups.                                                                       |
| `jobs.quality`        | Groups the setup and project checks; `quality` is its internal ID.                                                                                                        |
| `runs-on`             | Requests a fresh GitHub-hosted Ubuntu 24.04 runner for each job.                                                                                                          |
| `timeout-minutes`     | Stops a stuck job after its runtime limit; this is not an account spending cap.                                                                                           |
| `steps`               | Lists operations in execution order within a job.                                                                                                                         |
| `uses` / `with`       | Runs a reusable action and supplies its inputs. Checkout fetches code; setup-node installs Node and enables npm download caching. Actions are pinned to full commit SHAs. |
| `run`                 | Executes a shell command on the runner. `npm run lint`, for example, invokes the ESLint script defined in package.json.                                                   |
| `needs: [quality]`    | Makes the final job wait for the quality job and exposes its outcome.                                                                                                     |
| `if: ${{ always() }}` | Asks GitHub to evaluate the final gate after failed or skipped prerequisites too. A canceled whole run is not a successful required check.                                |
| `env`                 | Passes the quality job's outcome into the final step's shell variable.                                                                                                    |
| `name: CI / required` | Gives the final job its stable check name for branch rules.                                                                                                               |

The quality job checks out the repository, reads the Node pin from `.nvmrc`, selects the npm version from `package.json`, and runs `npm ci`. Selecting npm explicitly matters because the version bundled with Node may differ from our pin, and `.npmrc` enforces the engines. The cache stores downloaded npm package data, not node_modules; each run still installs from the lockfile.

Then it runs formatting → lint → production build → typecheck, matching `npm run validate`. These are separate workflow steps so a failed command is easy to locate in the Actions log. The build must precede typecheck because it generates TanStack's route declarations. CI checks formatting without fixing files and builds without deploying anything.

If formatting fails, for example, the quality job fails and its remaining ordinary steps are skipped. The final job inspects the quality job's result; only `success` passes. Failure, cancellation or a skipped quality job cannot turn into a successful gate. The final job runs on a separate runner and only needs the outcome supplied by GitHub, so it does not repeat installation or project commands.

This setup uses one quality job, a small final gate, dependency caching and cancellation of outdated PR runs. It has no browser services or multi-version matrix. Timeouts constrain stuck jobs; check the account's Actions usage and billing settings separately for its spending controls.

### Turning checks into merge protection

The file creates checks; GitHub's ruleset decides whether they are required for merging. After the workflow is published and a real run produces `CI / required`, select that exact job check in the CI ruleset. Verify it on a PR, including a failing check that prevents merging. Required status-check configuration and that verification remain pending; local validation does not prove GitHub enforcement.

The owner reports branch review protection is configured. Designated-reviewer enforcement and the owner review bypass still need verification after CODEOWNERS is on `main` and reviewer access is accepted. Reviews and CI are separate requirements: passing one does not satisfy the other.

## Test isolation

Database and authentication integration are pending. Once configured, use a disposable PostgreSQL database named `likehome_ci` for the guide's integration example.
Apply committed migrations before tests. Never use the hosted connection string.
External hotel/payment services use deterministic mocks or explicit test modes.

## Coverage

There is currently no automated unit, integration or browser test suite, and no coverage report.
Generate a report before setting thresholds. Track important business branches, not just a percentage.
The guide's database example only tests migration plumbing; add auth and business-operation tests with each feature.
Its browser starter only tests startup; add login, search and reservation journeys as those features exist.

## Investigating failures

For a local failure, read the first relevant error and reproduce the exact command.
After Actions is configured, open Actions → workflow run → failed job → first failing step.
Download the private Playwright report/trace if available after browser tests are configured.
Fix flaky tests; a retry is a diagnostic aid, not evidence that nondeterminism is acceptable.
