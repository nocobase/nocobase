# Develop with a local Default app

Use `pnpm dev:default` from the repository root to try plugins and application changes in a private workspace app. To change the distributed Default template itself, use `pnpm default:dev` and edit `packages/templates/app-template-default/`. Use `pnpm examples:dev` to work on the Examples template.

## Start the app

```sh
pnpm install --frozen-lockfile
pnpm dev:default
```

First start generates `local/default/` from the Default template in the current checkout, installs its workspace dependencies and initializes SQLite. Open the application URL printed by the dev server. Later starts reuse its configuration, database and plugin registrations. The generated app is gitignored and its package is private.

Edit plugin source under `packages/plugins/`. Run application commands from the local app to keep experimental registrations there. For example, to enable the preinstalled Verification plugin:

```sh
cd local/default
pnpm nocobase plugin register verification --no-install
```

## Refresh the template

Start checks the template for changes. To apply an update, stop the local app and run the following from the repository root:

```sh
pnpm local:refresh default
```

Refresh picks up tracked working-tree edits and new source files that Git includes. The template's ignore rules exclude local configuration, databases, dependencies and build output. Refresh applies upstream additions, edits and removals while preserving files unique to the local app. If both sides changed the same file, it lists the conflicts before writing. Save local edits, reconcile the file with either the previous or incoming template content, and run refresh again.

The shared lockfile records the resolutions for both the official template and its private copy. A normal lockfile update in a checkout without the local app also updates its reserved resolutions. If you change template dependencies while the local app exists, refresh it to generate the matching manifest, then run `pnpm install --lockfile-only --no-frozen-lockfile` at the root and review the diff. If refresh reports an outdated lockfile, the new manifest is already on disk. Rerun refresh after updating the lockfile.

For a preinstalled plugin, `--no-install` reuses its workspace link. Registering additional dependencies through the package manager can change the shared lockfile; keep local experiment changes out of commits.
