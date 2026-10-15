# Deployment and recovery

## Service

Planned provider: Railway (`LikeHome-bench` project). Source: `DomBarker99/LikeHome-bench`, branch `main` after the scaffold is merged.
The scaffold includes the Nitro build configuration and production-start command. Railway account connection, service configuration and a successful hosted deployment have not been verified by this setup work.
Service owner and deployed URL: pending documentation.

The existing commands are:

```bash
npm run build
npm run start
```

The start script runs `node .output/server/index.mjs`; build output must exist first.
Verify build/start locally before configuring those commands in Railway.
Use the pinned Node.js 24.21.0 and npm 11.19.0 toolchain in hosting as well as development. See [development environment](development-environment.md).

Enable Wait for CI after a push-to-main workflow has completed. GitHub Actions is not configured yet.
For Prisma, once installed and configured, generate the client during build and run `prisma migrate deploy` as a pre-deploy command.
Configure `/health` to return HTTP 200 when the process is ready; the health route has not been implemented yet.

## Variables

Document names here; values belong in Railway or ignored local environment files.
The current scaffold needs no application environment variables. No `.env.example` has been added.
Planned database/authentication names include `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`; hosting may also use `PORT` and `NODE_ENV`.
Add only the variables actually needed when those integrations are implemented, using safe dummy values in `.env.example`.
Review trusted origins and cookie settings for the real HTTPS service URL.
Any CI dummy auth secret is public test data and must never be used in a hosted environment.

## Verification

First hosted delivery and its verification are pending.
After deployment, confirm the deployed commit matches the intended main commit.
Verify `/health` once implemented and one important user journey with disposable test data.
Railway startup health checks do not replace continuous uptime/error monitoring.

## Recovery

Recovery steps must be rehearsed and recorded after the first successful deployment.
Inspect the failed build/pre-deploy/start logs first.
Use a reviewed revert PR or Railway's rollback to a compatible previous deployment.
Application rollback does not undo database migrations.
Favor backward-compatible migrations and record backup/restore procedures before destructive changes.

## Previews

PR previews are optional and pending setup.
Use isolated databases and environment variables. Do not copy hosted credentials into PR test code.
PR author access and Railway workspace settings must permit the preview.
