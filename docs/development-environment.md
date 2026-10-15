# Development environment

Use this guide for machine setup and editor integration. [Development](development.md) covers contributions and Git workflow; [testing](testing.md) defines checks and CI; [deployment](deployment.md) covers hosting.

## Shared toolchain

| Tool          | Project choice                            | Where it is recorded                           |
| ------------- | ----------------------------------------- | ---------------------------------------------- |
| Node.js       | 24.21.0 LTS                               | `.nvmrc` and `package.json` engines            |
| npm           | 11.19.0                                   | `packageManager` and engines in `package.json` |
| Dependencies  | Exact installed versions                  | `package-lock.json`                            |
| Formatting    | Repository-installed Prettier             | `prettier.config.js`, `.prettierignore`        |
| Linting       | ESLint 10, TanStack rules and React Hooks | `eslint.config.js`                             |
| Type checking | Repository-installed TypeScript           | `tsconfig.json`                                |

`.npmrc` enables `engine-strict`, so dependency installation fails with the wrong Node/npm versions. `packageManager` documents npm's version; it does not install npm for you. Upgrade the pins together deliberately, update the lockfile and rerun validation.

The scaffold already includes these packages. Use `npm ci` after cloning; the CI guide's generic installation command is not a command to rerun over this configuration. ESLint 10 matches the installed TanStack config's rule package and supported plugin versions.

## Activate Node and npm

With an existing nvm installation, run from the LikeHome repository root:

```bash
nvm install
nvm use
npm install --global npm@11.19.0
node --version
npm --version
```

Expected versions are `v24.21.0` and `11.19.0`. If you do not use nvm, install the matching platform build from the [Node release page](https://nodejs.org/en/blog/release/v24.21.0), then select npm 11.19.0 using your installation's normal permissions. Install nvm only through its [official instructions](https://github.com/nvm-sh/nvm#installing-and-updating).

On this setup Mac, Homebrew Node 24 has been installed alongside the previous Node installation. A new interactive zsh terminal selects it. To activate the same installation in an already-open terminal:

```bash
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
node --version
npm --version
```

The Homebrew path is machine-specific and is not a project setting. A future Homebrew update may move beyond the exact pinned version; use a version manager when you need to restore that exact version. For Windows or another platform, use the matching Node build and verify the same versions.

## Open the application folder

Open `LikeHome`, the directory containing package.json, as the editor's project root. Keep the class workspace and personal configuration outside this repository. Activate the toolchain before launching the editor from a terminal so its child processes can find the same Node runtime.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. Stop the development server with Control+C.
The current scaffold needs no database or application environment variables; authentication and database setup remain later work.

## Daily validation

```bash
npm run validate
```

This runs formatting, linting, production build and type checking in that order. Building first generates TanStack Start's route declarations for type checking. It does not start or deploy the application.

| Command                | Use                                                              |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run format:check` | Read-only formatting check                                       |
| `npm run check`        | Compatibility alias for the formatting check                     |
| `npm run format`       | Apply formatting; inspect the diff afterward                     |
| `npm run lint`         | Check code rules; warnings fail the command                      |
| `npm run lint:fix`     | Apply available lint fixes; inspect the diff afterward           |
| `npm run build`        | Generate routes and production output                            |
| `npm run typecheck`    | Verify types; refresh generated routes through build when needed |

Prettier owns formatting; ESLint owns code rules. `eslint-config-prettier` disables overlapping formatting rules. Formatting and lint fixing are separate commands so their changes can be reviewed. Editor diagnostics provide early feedback; the shared terminal commands remain the acceptance checks for all editors.

## VS Code

1. Open the application folder and run `npm ci` in its terminal with the pinned runtime.
2. Install the official [ESLint extension](https://github.com/microsoft/vscode-eslint) (`dbaeumer.vscode-eslint`) and [Prettier extension](https://github.com/prettier/prettier-vscode) (`esbenp.prettier-vscode`). Both should use the repository's installed tools and configuration.
3. Open a TypeScript file. Use the Command Palette's **TypeScript: Select TypeScript Version** → **Use Workspace Version**. See the [VS Code TypeScript guide](https://code.visualstudio.com/docs/typescript/typescript-transpiling).
4. If desired, merge the example below into workspace settings. Preserve the scaffold's generated-route watcher/search exclusions and read-only setting.

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "prettier.requireConfig": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

Format-on-save and fix-on-save are optional conveniences. Use the Problems panel for diagnostics and the ESLint/Prettier Output channels when integration fails. Avoid personal absolute paths in committed workspace settings.

## Neovim and AstroNvim

Launch `nvim .` from the activated repository terminal. TypeScript needs a language server; Prettier and ESLint need their respective editor adapters. AstroNvim's Mason integration can install TypeScript and ESLint language servers; use one TypeScript server and confirm it reads the repository's TypeScript installation. `:checkhealth vim.lsp` helps inspect LSP setup.

For Prettier, the existing None-ls plugin can prefer the repository executable. The following is an optional personal plugin recipe, not application code:

```lua
return {
  "nvimtools/none-ls.nvim",
  opts = function(_, opts)
    local null_ls = require "null-ls"
    opts.sources = require("astrocore").list_insert_unique(opts.sources, {
      null_ls.builtins.formatting.prettier.with {
        prefer_local = "node_modules/.bin",
      },
    })
  end,
}
```

Keep the existing sources when merging this into your personal configuration. AstroNvim starter plugin files may begin with `if true then return {} end`; that guard disables the example until you intentionally activate it. Choose Prettier as the formatting provider for these files, and configure ESLint diagnostics separately. Use [AstroNvim's LSP instructions](https://docs.astronvim.com/recipes/advanced_lsp/) and the [None-ls formatter documentation](https://github.com/nvimtools/none-ls.nvim/blob/main/doc/BUILTINS.md#prettier) for adapter details.

These editor recipes still require a manual check in each developer's editor. This repository setup does not install extensions or modify personal Neovim plugins.

## Generated files and editor checks

Do not manually edit or format `src/routeTree.gen.ts`. Keep it tracked; TanStack regenerates it during development/build. Dependencies, build output, caches and test reports are excluded from the relevant tools. See [commit guidance](development.md#repository-files-and-commits).

To check an editor integration, temporarily introduce an obvious type mismatch and confirm TypeScript reports it, then undo the change. Check a lint diagnostic and an unformatted line the same way. Confirm saving uses the repository's formatting, then run `npm run validate`. These are manual setup checks, not a product test suite.

## Troubleshooting

- **Node fails with a missing Homebrew library:** activate the working pinned runtime and check `node --version` and `node -p process.execPath`. Restart an editor launched with the old environment.
- **Installation reports an engine mismatch:** compare Node/npm versions with the pins. Select the documented versions rather than bypassing `engine-strict`.
- **npm warns about unapproved dependency install scripts:** npm 11.19.0 skips those scripts by default. The current clean installation passed validation with the `fsevents` and `unrs-resolver` scripts skipped. If a future dependency needs its install script, review it and record a specific approval using [npm's install-script commands](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts/).
- **ESLint fails before inspecting files:** inspect the underlying error and runtime. Native resolver dependencies need the correct platform and architecture; a restricted application-bundled Node runtime can reject their signatures. Use a normal development Node installation. Do not delete the committed lockfile as the first response to a generic native-binding message.
- **Type errors mention missing route declarations:** run `npm run build`, then `npm run typecheck`.
- **Editor formatting differs from the terminal:** check the project root, selected formatter, repository tool version and ignore rules. Disable competing formatting providers for the same files.
- **Checks fail after an intentional dependency change:** commit package.json and package-lock.json together after validation; use `npm ci` for ordinary fresh installs.
