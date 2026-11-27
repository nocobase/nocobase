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

Each generated app has its own gitignored `pnpm-workspace.yaml`, `pnpm-lock.yaml` and `node_modules`. Install or remove experimental dependencies from inside the app. Dependencies inherited from a template link to its installed copies, so source edits and shared runtime packages use the repository checkout. To try an additional unpublished plugin, run `pnpm add @nocobase/app-plugin-example@link:../../packages/plugins/app-plugin-example` from the app, substituting the plugin name and path.

After upgrading an existing local app from the shared workspace, run `pnpm local:refresh default` once. Refresh keeps the existing configuration, SQLite data and local edits, and reports template conflicts before writing.
