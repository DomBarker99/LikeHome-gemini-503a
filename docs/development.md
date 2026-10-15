# Development

## Toolchain

Package manager: npm. Keep package-lock.json committed. Use `npm install` when intentionally changing dependencies; use `npm ci` for a repeatable installation.

Use Node.js 24.21.0 and npm 11.19.0. `.nvmrc`, package.json and `.npmrc` record and enforce the installation versions. Keep local development, future CI and Railway consistent. See the [development environment guide](development-environment.md) for activation, editor setup and troubleshooting.

## First run

The standard application base is `main`. Before teammate handoff, merge the bootstrap setup into that branch. The commands below describe that handoff; the setup owner may already have the application checked out locally.

```bash
git clone https://github.com/DomBarker99/LikeHome-bench.git
cd LikeHome-bench
npm ci
npm run dev
```

Open <http://localhost:3000>. Activate the pinned toolchain before installing dependencies or launching your editor.

Better Auth, Prisma and PostgreSQL are pending implementation. There is no `.env.example` yet, and no database or application environment variables are required for the current scaffold. When integrations are added, use `.env.example` for variable names and safe dummy values only, and document the actual local database and migration commands here.

Production commands in the scaffold are:

```bash
npm run build
npm run start
```

The start command runs the generated Nitro server at `.output/server/index.mjs`; it requires a successful build first. These commands do not deploy the application. See [deployment](deployment.md) for the pending hosting setup.

Onboarding from a clean clone on a second teammate's machine has not been verified.

## Contribution

Create a branch such as `feat/42-search-filters`. Keep one coherent change per PR.
Link the issue and its acceptance criteria. Include screenshots for UI changes.
Run [local checks](testing.md) and request a designated reviewer once reviewers are configured. Resolve review conversations.
Squash merge after required checks pass; update your local main and remove the merged feature branch.

Bootstrap work currently uses `initial`. After it is merged into `main`, start ordinary feature work with:

```bash
git switch main
git pull --ff-only
git switch -c feat/42-search-filters
```

Commit local changes, then publish the branch:

```bash
git status
git add path/to/changed-file
git diff --cached
git commit -m "Describe the change"
git push -u origin feat/42-search-filters
```

Replace the example file path and branch name with your actual change. The first push creates the GitHub branch and sets tracking; later pushes on that branch use `git push`. Open a PR targeting `main` when ready for review.

## Review policy

Designated reviewers: Silas (`@Silasfay`) and Raph (`@Wayfleh`). The [CODEOWNERS file](../.github/CODEOWNERS) lists only those two accounts for every file, including `.github/` and `AGENTS.md`.

Their invitations were pending in the September 29 setup screenshot. Each reviewer must accept write access before GitHub can assign ownership to that account. The owner reports branch review protection is configured; enforcement and bypass behavior have not been verified here.

GitHub uses CODEOWNERS from the PR's destination branch. Commit and merge the file into `main` before testing review requests and enforcement on PRs targeting `main`. A local or staged file on `initial` does not activate ownership for `main`.

The intended policy requires one eligible code-owner approval: either listed reviewer can satisfy it, and both approvals are not required. Authors cannot approve their own PRs. Adding CODEOWNERS requests reviews; the GitHub rule requiring code-owner review enforces approval before merging. See [GitHub's CODEOWNERS documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
`DomBarker99` may use the PR-only owner bypass on the review ruleset once configured. Note the reason in the PR.
The owner is not listed in CODEOWNERS; bypass permission is configured separately in GitHub.
Automated checks remain required in a separate ruleset once configured.
The pull request template collects review information; it does not enforce these rules.

## Repository files and commits

Commit source code, documentation and shared configuration needed to reproduce the application. A leading dot means the file is hidden by convention; it does not determine whether it belongs in Git.

| Path                                                 | Purpose                                                        | Commit policy                                              |
| ---------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| `src/routes/index.tsx`                               | The home page at `/`                                           | Commit                                                     |
| `src/routes/__root.tsx`                              | Shared HTML document and root layout                           | Commit                                                     |
| `src/router.tsx`                                     | Router creation and settings                                   | Commit                                                     |
| `src/styles.css`                                     | Application styles and Tailwind setup                          | Commit                                                     |
| `src/routeTree.gen.ts`                               | TanStack's generated route map and types                       | Keep tracked; regenerate rather than edit manually         |
| `package.json`, `package-lock.json`                  | Commands, dependencies and exact resolved versions             | Commit both                                                |
| `.nvmrc`, `.npmrc`                                   | Runtime selection and installation version enforcement         | Commit                                                     |
| `vite.config.ts`, `tsconfig.json`, `tsr.config.json` | Build, TypeScript and route-generator configuration            | Commit                                                     |
| `eslint.config.js`, `prettier.config.js`             | Code validation and formatting configuration                   | Commit                                                     |
| `README.md`, `AGENTS.md`, `docs/`, `.github/`        | Onboarding, assistant instructions and review/CI configuration | Commit                                                     |
| `.gitignore`, `.prettierignore`                      | Git and formatting exclusions                                  | Commit                                                     |
| `.vscode/settings.json`                              | Shared editor settings for generated routes                    | Keep the scaffold's settings; avoid personal machine paths |
| `.cta.json`                                          | Records scaffold choices                                       | Keep the scaffold's metadata                               |
| `node_modules/`                                      | Installed dependencies recreated by `npm ci`                   | Ignore                                                     |
| `.output/`, `.tanstack/`, build/test reports         | Generated output and working files                             | Ignore                                                     |
| `.env`, private `.env.*` files                       | Local environment values and secrets                           | Ignore                                                     |
| `.env.example`                                       | Safe example names and dummy values, when needed               | Commit sanitized examples only                             |
| `.git/`                                              | Git's local repository data                                    | Managed by Git; never stage as application content         |

Generated files are not all treated alike: package-lock.json and the route tree remain committed, while dependency folders, build output and reports are recreated locally. Formatting exclusions do not change Git tracking.

Use `git status` to see staged, unstaged and untracked files; `git diff` to inspect unstaged changes; and `git diff --cached` to inspect the next commit. Git does not track empty directories. Adding an ignore rule does not remove an already tracked file.

Never place the entire class workspace, private course documents, access instructions or browser data in this repository.
