# LikeHome

Open Ocean's CMPE 165 LikeHome application. Fresh team implementation.

## Start here

1. Follow [development](docs/development.md) to clone the application from `main` once the bootstrap setup is merged there.
2. Activate Node.js 24.21.0 and npm 11.19.0 using the [development environment guide](docs/development-environment.md).
3. Run `npm ci` after cloning (the lockfile is committed).
4. Run `npm run dev` and open <http://localhost:3000>.

The scaffold uses TanStack Start, React, TypeScript and Tailwind CSS.
Better Auth, Prisma and PostgreSQL are planned but are not installed or configured.
The current scaffold requires no database or application environment variables.
Document `.env.example`, local database setup and migrations when those integrations are added.

## Before opening a pull request

Run `npm run validate` for formatting, linting, production build and type checking.
Use `npm run format` for formatting or `npm run lint:fix` for lint fixes, then inspect the diff.
Unit tests, integration tests and browser tests are pending setup.
See [testing and CI](docs/testing.md) for available commands and current limitations.

## Team workflow

Planned workflow: feature branch → pull request → CI + designated reviewer → squash merge to main.
Bootstrap work is currently on `initial`; merge the scaffold into `main` before using `main` as the application development base.
The [CODEOWNERS file](.github/CODEOWNERS) designates Silas (`@Silasfay`) and Raph (`@Wayfleh`) for all files. Their invitations were pending in the September 29 setup screenshot; verify accepted write access before testing enforcement.
The owner reports branch review protection is configured. The commented [CI workflow](.github/workflows/ci.yml) is prepared locally; its first GitHub run and required-check selection are pending. GitHub enforcement remains unverified.
Once configured, the repository owner may bypass the review rule through a PR. CI still must pass in a separate ruleset.
Repository owner: `DomBarker99`. Designated reviewers: `Silasfay` and `Wayfleh`.

## Guides

- [Development and contribution](docs/development.md)
- [Development environment and editors](docs/development-environment.md)
- [Testing and CI](docs/testing.md)
- [Deployment and recovery](docs/deployment.md)
- [Assistant instructions](AGENTS.md)

Use GitHub Issues to track implementation. Required class workbooks remain separate course deliverables.
