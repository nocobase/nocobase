# Using the UI Library

The UI Library publishes NocoBase business components as a [shadcn registry](https://ui.shadcn.com/docs/registry) at `https://ui.nocobase.com`. Adding an item copies its source files into your project and installs the dependencies it declares. The copy is yours from then on: edit it freely, and expect nothing to update it for you. This guide covers adding items to an application and to a plugin; [MAINTAINING.md](MAINTAINING.md) covers changing the library itself.

## Before you start

- **Declare the registry in `components.json`.** The three application templates and newly generated plugins with client code contain this entry. Add it to an older plugin when missing:

  ```json
  {
    "registries": {
      "@nocobase": "https://ui.nocobase.com/r/{name}.json"
    }
  }
  ```

- **Point the `@nocobase` scope at the NocoBase npm registry.** Items depend on `@nocobase/*` packages, which are published only to `https://npm.nocobase.ai`. `create-app` needs the same setting, so you may have it already; otherwise add this line to `~/.npmrc`:

  ```text
  @nocobase:registry=https://npm.nocobase.ai
  ```

- **Have the plugins the item builds on.** An item calls a plugin's public exports and registers nothing itself, and some, such as the authentication components, call none and leave the wiring to your page, which then needs the plugin it calls, here `@nocobase/app-plugin-authentication`. The `docs` message shadcn prints after installing an item names what it requires.

## Package imports

The application templates declare `#components/*`, `#hooks/*`, `#lib/*` and `#extensions/*` in `package.json#imports`, pointing to their own `client/` files with a `.js` suffix. TypeScript and Vite resolve that suffix to the `.ts` or `.tsx` source. `components.json` uses the same prefixes, so shadcn-generated imports stay in the receiving package. Older applications should copy these mappings and the `components.json` prefixes from the current template before adding an item. A directory entry point needs an exact mapping to its `index.ts` or `index.js`.

## Find an item

`https://ui.nocobase.com` previews every item at desktop, tablet, and mobile widths, in both themes, next to the command that installs it. From a project that declares the registry, `npx shadcn@latest search @nocobase` lists the items, and `npx shadcn@latest view @nocobase/<item>` prints one, including its files and dependencies. Every item has a usage example, `@nocobase/<item>-demo`, which is the demo the preview renders: `npx shadcn@latest view @nocobase/<item>-demo` prints it, and the shadcn MCP server's example lookup finds it. Read it rather than install it; installing it writes the demo to `client/extensions/nocobase-<item>-demo/`. An application generated from a template runs the MCP server from its own editor configuration, as its `nocobase-app-development` Skill describes.

## Add an item to an application

Preview the change, then install:

```bash
npx shadcn@latest add @nocobase/auth-forms --dry-run
npx shadcn@latest add @nocobase/auth-forms
```

The dry run lists every file shadcn would create or overwrite and every dependency it would install; add `--diff <file>` to see the change to one file. Then:

1. **Keep your primitives.** An item lists the shadcn primitives it uses, such as `button` and `input`, and shadcn fetches the upstream version of each from the shadcn registry. When your project already has one with different content, shadcn asks whether to overwrite it, and the default is no. Keep that answer unless you want upstream's version in place of yours, and never pass `--overwrite` when adding an item.
2. **Review `package.json`.** shadcn runs `pnpm add` for the item's dependencies before it writes any file. It adds every dependency the item pins to a range again, even one you already have, so it may rewrite that range. Packages that only `client/` imports belong in the application's `devDependencies`, as its `AGENTS.md` explains, while shadcn adds new ones to `dependencies`.
3. **Use the files.** A component lands in `client/components/` beside your own and is imported like them, as `#components/page-header`; a block lands in `client/extensions/nocobase-<item>/`. Read the README in this repository — the [components README](registry/components/README.md), the [authentication README](registry/auth/README.md), or a block's own — for the entry points and what the item expects you to customize.
4. **Add the translations.** shadcn does not touch your locale resources. A block ships its translations in its `locales/` directory: spread each file into the matching file in `client/locales/`, before your own keys so that yours can reword them, as its README shows. A component ships none; add the keys its README lists. Without this step the item renders its English defaults in every language.
5. **Run the application's checks**: `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.

An application created from one of the templates already contains the `page-container`, `page-header`, `route-dialog`, `route-drawer` and `route-child-page` components in `client/components/`, the `auth-forms`, `auth-methods` and `auth-split-layout` blocks its sign-in pages use, and the `device-approval` block its `/device` page uses, in `client/extensions/nocobase-<item>/`; one created from the default or the examples template also contains the `inbox` block its `/inbox` page renders and the `inbox-button` component in its header. Do not add them again; to take a newer version, see [Upgrading an item](#upgrading-an-item).

## Add an item to a plugin

A plugin compiles `client/` with `tsc` using NodeNext resolution and publishes the output as `dist/`, which the installing application resolves again. Package imports keep each component bound to the package that owns it, including when an application builds a compiled plugin.

1. **Install it.** Plugins generated with client code include `components.json`, the generation stylesheet, and shadcn tooling even without the `registry` capability, which publishes the plugin's own recipes. Run the command from the plugin's directory. For a plugin in this repository, copy the item instead, as [Inside this repository](#inside-this-repository) describes. A component lands in the plugin's `client/components/` and a block in its `client/extensions/nocobase-<item>/`, with any missing primitive in `client/components/ui/`. You may move a block's directory, for example to `client/components/<item>/`, as long as it stays under `client/`.
2. **Keep package imports aligned with the plugin build.** New plugins generated with client code declare `#components/*`, `#hooks/*`, `#lib/*` and `#extensions/*` in `package.json#imports`. Their `development` targets point to `client/**/*.js` (resolved to TypeScript sources by development tooling), their `default` targets point to `dist/client/**/*.js`, and `tsconfig.json` selects the `development` condition. `publishConfig.imports` replaces these with unconditional `dist/client/**/*.js` targets when pnpm packs the plugin, so a consuming application's development mode also loads published files. Older plugins need the same mappings before installing an item; do not add a host-global Vite alias or rewrite the component after installation. An extension imported by directory name needs an exact mapping to its `index.js`.

3. **Declare the dependencies as peers.** shadcn adds packages to `dependencies`, but a plugin's client imports belong in `peerDependencies`: the installing application resolves them and provides one shared copy. For `@nocobase/app-plugin-*` packages and `@nocobase/i18n` this is also a matter of correctness, since a second copy of either breaks at runtime, and `pnpm peers:check` rejects them in `dependencies`.
4. **Add the translations to the plugin's own locales.** Under a plugin's route, keys resolve in the plugin's namespace first and fall back to the application's, so put the item's keys in the plugin's `client/locales/` rather than relying on the application to have them: spread a block's `locales/` files, and add the keys a component's README lists. The item's own files compile under the plugin's declaration build as they are, but the plugin's merged `en-US.ts` needs the explicit type the item's README shows: `isolatedDeclarations` cannot infer an object built with a spread and fails with `TS9015`. A plugin without `client/locales/` yet sets them up as the [plugin i18n reference](../.agents/skills/nocobase-plugin-development/references/i18n.md) describes.
5. **Check it.** Keep the component private unless the plugin deliberately exports it. Run the plugin's `lint`, `typecheck`, `test`, and `build`, which also check the explicit export types that declaration builds require, then render the item in an application that installs the plugin. Registry sources and the maintained primitives are annotated for plugin declaration output; a newly fetched upstream primitive may still need explicit export types. That is separate from import resolution: keep the generated `#` imports unchanged.

For example, a standalone plugin with the NocoBase registry configured installs a component with several primitive imports using:

```bash
pnpm exec shadcn add @nocobase/permission-editor --dry-run
pnpm exec shadcn add @nocobase/permission-editor
pnpm typecheck
pnpm build
```

The same item's imports resolve the application's sources when installed into an application and the plugin's own sources or compiled files when installed into a plugin. `pnpm --filter @nocobase/create-plugin test` exercises this workflow against a local registry build in a generated component-only plugin, then packs it and renders the compiled component from an isolated host with conflicting host `#components/*` mappings. The test serves maintained primitives locally and resolves locked dependencies offline; it verifies source and published resolution without depending on the public registry's availability.

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
| `TS2307: Cannot find module '#components/ui/button'` in a plugin                                     | The owning package is missing an `imports` mapping; see [Add an item to a plugin](#add-an-item-to-a-plugin).                                                                                    |
| `TS2835: Relative import paths need explicit file extensions` in an installed item                   | The copy predates the `.js` rule or has been edited since; add the extension.                                                                                                                   |
| A plugin works in this repository, but an application reports `Could not resolve` one of its imports | The import is declared in `devDependencies`, which the installing application never receives. Declare it as a peer.                                                                             |
