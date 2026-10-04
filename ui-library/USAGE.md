# Using the UI Library

The UI Library publishes NocoBase business components as a [shadcn registry](https://ui.shadcn.com/docs/registry) at `http://ui.nocobase.com`. Adding an item copies its source files into your project and installs the dependencies it declares. The copy is yours from then on: edit it freely, and expect nothing to update it for you. This guide covers adding items to an application and to a plugin; [MAINTAINING.md](MAINTAINING.md) covers changing the library itself.

## Before you start

- **Declare the registry in `components.json`.** The three application templates already contain this entry. A plugin created by `pnpm plugin:create` does not, so add it there:

  ```json
  {
    "registries": {
      "@nocobase": "http://ui.nocobase.com/r/{name}.json"
    }
  }
  ```

  Keep the `http://` URL as written; the HTTPS endpoint does not present a valid certificate yet.

- **Point the `@nocobase` scope at the NocoBase npm registry.** Items depend on `@nocobase/*` packages, which are published only to `https://npm.nocobase.ai`. `create-app` needs the same setting, so you may have it already; otherwise add this line to `~/.npmrc`:

  ```text
  @nocobase:registry=https://npm.nocobase.ai
  ```

- **Have the plugins the item builds on.** An item calls a plugin's public exports and registers nothing itself, and some, such as the authentication components, call none and leave the wiring to your page, which then needs the plugin it calls, here `@nocobase/app-plugin-authentication`. The `docs` message shadcn prints after installing an item names what it requires.

## Find an item

`http://ui.nocobase.com` previews every item at desktop, tablet, and mobile widths, in both themes, next to the command that installs it. From a project that declares the registry, `npx shadcn@latest search @nocobase` lists the items, and `npx shadcn@latest view @nocobase/<item>` prints one, including its files and dependencies.

## Add an item to an application

Preview the change, then install:

```bash
npx shadcn@latest add @nocobase/auth-forms --dry-run
npx shadcn@latest add @nocobase/auth-forms
```

The dry run lists every file shadcn would create or overwrite and every dependency it would install; add `--diff <file>` to see the change to one file. Then:

1. **Keep your primitives.** An item lists the shadcn primitives it uses, such as `button` and `input`, and shadcn fetches the upstream version of each from the shadcn registry. When your project already has one with different content, shadcn asks whether to overwrite it, and the default is no. Keep that answer unless you want upstream's version in place of yours, and never pass `--overwrite` when adding an item. The same goes for `lib/utils.ts`, which an item that merges class names lists as `utils`: the templates' copy also exports `assetUrl`, which upstream's does not.
2. **Review `package.json`.** shadcn runs `pnpm add` for the item's dependencies before it writes any file. It adds every dependency the item pins to a range again, even one you already have, so it may rewrite that range. A package that only the primitives you declined needed, currently `cn`, is added all the same; remove it if nothing imports it. Packages that only `client/` imports belong in the application's `devDependencies`, as its `AGENTS.md` explains, while shadcn adds new ones to `dependencies`.
3. **Use the files.** A component lands in `client/components/` beside your own and is imported like them, as `@/components/page-header`; a block lands in `client/extensions/nocobase-<item>/`. Read the README in this repository — the [components README](registry/components/README.md), the [authentication README](registry/auth/README.md), or a block's own — for the entry points and what the item expects you to customize.
4. **Add the translations.** shadcn does not touch your locale resources. A block ships its translations in its `locales/` directory: spread each file into the matching file in `client/locales/`, before your own keys so that yours can reword them, as its README shows. A component ships none; add the keys its README lists. Without this step the item renders its English defaults in every language.
5. **Run the application's checks**: `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.

An application created from one of the templates already contains the `page-container`, `page-header`, `route-dialog`, `route-drawer`, `route-child-page` and `back-button` components in `client/components/`, and the `auth-forms`, `auth-methods` and `auth-split-layout` blocks its sign-in pages use in `client/extensions/nocobase-<item>/`. Do not add them again; to take a newer version, see [Upgrading an item](#upgrading-an-item).

## Add an item to a plugin

A plugin compiles `client/` with `tsc` using NodeNext resolution and publishes the output as `dist/`, which the installing application resolves again. An installed item therefore needs more work in a plugin than in an application.

1. **Install it.** Declare the registry in the plugin's `components.json` and run the same command from the plugin's directory. For a plugin in this repository, copy the item instead, as [Inside this repository](#inside-this-repository) describes. A component lands in the plugin's `client/components/` and a block in its `client/extensions/nocobase-<item>/`, with any missing primitive in `client/components/ui/`. You may move a block's directory, for example to `client/components/<item>/`, as long as it stays under `client/`.
2. **Replace the `@/` imports with relative `.js` paths.** TypeScript does not rewrite `paths` aliases in the JavaScript it emits, and in the application that installs the plugin, `@/` resolves to the application's own `client/`, so an `@/` import either fails there or binds to the wrong file. From `client/extensions/nocobase-auth-forms/`, for example:

   ```ts
   // As installed:
   import { Button } from '@/components/ui/button';
   import { cn } from '@/lib/utils';
   // In a plugin:
   import { Button } from '../../components/ui/button.js';
   import { cn } from '../../lib/utils.js';
   ```

   The item's own relative imports already carry the `.js` extension. `cn` resolves to the plugin's own `client/lib/utils.ts`, which shadcn creates from the item's `utils` dependency when the plugin has none.

3. **Declare the dependencies as peers.** shadcn adds packages to `dependencies`, but a plugin's client imports belong in `peerDependencies`: the installing application resolves them and provides one shared copy. For `@nocobase/app-plugin-*` packages and `@nocobase/i18n` this is also a matter of correctness, since a second copy of either breaks at runtime, and `pnpm peers:check` rejects them in `dependencies`.
4. **Add the translations to the plugin's own locales.** Under a plugin's route, keys resolve in the plugin's namespace first and fall back to the application's, so put the item's keys in the plugin's `client/locales/` rather than relying on the application to have them: spread a block's `locales/` files, and add the keys a component's README lists. The item's own files compile under the plugin's declaration build as they are, but the plugin's merged `en-US.ts` needs the explicit type the item's README shows: `isolatedDeclarations` cannot infer an object built with a spread and fails with `TS9015`. A plugin without `client/locales/` yet sets them up as the [plugin i18n reference](../.agents/skills/nocobase-plugin-development/references/i18n.md) describes.
5. **Check it.** Keep the component private unless the plugin deliberately exports it. Run the plugin's `lint`, `typecheck`, `test`, and `build`, which also check the explicit export types that declaration builds require, then render the item in an application that installs the plugin.

## Inside this repository

Do not run `shadcn add` in a template or a package of this repository. shadcn installs each dependency with `pnpm add <name>@<range>`, and pnpm resolves a range from the npm registry rather than linking the workspace package: it replaces `workspace:^` with a published version and installs a second copy of the package beside the workspace one.

Copy the item from its source instead:

1. Copy each file listed in `ui-library/registry/<group>/registry.json` from `ui-library/registry/<group>/<path>` to its `target`, then apply the plugin steps above if the destination is a plugin.
2. Declare the dependencies by hand, with `workspace:^` for NocoBase packages and `catalog:` for the shared UI packages, and run `CI=true pnpm install --no-frozen-lockfile`.
3. Add any missing primitive with `pnpm exec shadcn add <name>` from the package's directory, and review what it changes.

## Upgrading an item

Nothing updates an installed copy, and installing the item again over it would discard your changes, so an upgrade is a merge you make by hand:

1. Find what changed upstream. The item's history in this repository is the reliable record: `git log -p -- ui-library/registry/<group>/registry.json` followed by the item's sources — `ui-library/registry/<group>/<item>` for a block, or the files a component lists, such as `ui-library/registry/components/page-header.tsx`. `npx shadcn@latest add @nocobase/<item> --dry-run --diff <file>` compares your copy with the current published version, which mixes upstream changes with your own edits.
2. Apply the upstream changes to your copy, keeping your customizations.
3. Install any dependency or primitive the new version adds, and run your checks.

Record the date, or the nocobase3 commit, in the commit that installs or upgrades an item. It is where the next upgrade starts.

To remove an item, delete a block's directory, or a component's files, and the imports of them, then drop the dependencies nothing else imports. A file two components share, such as `route-overlay.tsx`, stays until neither is installed. Leave the primitives, which other code may use.

## Troubleshooting

| Symptom                                                                                              | Cause and fix                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Unknown registry "@nocobase"`                                                                       | `components.json` has no `registries` entry for `@nocobase`; add it as shown in [Before you start](#before-you-start).                                                                          |
| `Unexpected token '<', "<!doctype "... is not valid JSON`                                            | No item has that name, so the host answered with the site's HTML page. Check the name with `npx shadcn@latest search @nocobase`.                                                                |
| `ERR_PNPM_FETCH_404` for `registry.npmjs.org/@nocobase%2F...`                                        | The `@nocobase` scope is not pointed at `https://npm.nocobase.ai`. Add it to `~/.npmrc` and run the command again; shadcn installs dependencies before it writes files, so nothing was written. |
| `TS2307: Cannot find module '@/components/ui/button'` in a plugin                                    | An `@/` import has not been rewritten; see [Add an item to a plugin](#add-an-item-to-a-plugin).                                                                                                 |
| `TS2835: Relative import paths need explicit file extensions` in an installed item                   | The copy predates the `.js` rule or has been edited since; add the extension.                                                                                                                   |
| A plugin works in this repository, but an application reports `Could not resolve` one of its imports | The import is declared in `devDependencies`, which the installing application never receives. Declare it as a peer.                                                                             |
