# @nocobase/app-plugin-registry-example

This package is a runnable reference for package-owned NocoBase UI Registry
items. It demonstrates how one plugin can provide:

- runtime UI that remains owned and upgraded by the plugin;
- an editable page that integrates with the plugin;
- a standalone editable component;
- a standalone editable React Provider and hook.

The examples intentionally use different directory shapes. A Registry item is
a source distribution unit, not a page convention. Page items may use
`pages/`, while reusable components and Providers should keep the structure
that best represents their public API.

## Ownership model

| Source                          | Owner       | Upgrade behavior                         | Application edits                |
| ------------------------------- | ----------- | ---------------------------------------- | -------------------------------- |
| `client/**`                     | Plugin      | Replaced when the plugin is upgraded     | Do not edit in the consuming app |
| `registry/<item>/**`            | Plugin      | Canonical source published by the plugin | Do not edit the package copy     |
| `client/extensions/<target>/**` | Application | Not overwritten by plugin upgrades       | Expected and supported           |
| `client/components/ui/**`       | Application | Managed by the application               | Expected and supported           |

The plugin runtime and an installed Registry item may each contain or consume their own shadcn source. The runtime page imports the plugin-local Button. The installed page and component import the receiving package's Button through `#components/ui/button`.

The plugin's `components.json` uses the same `#` prefixes as `package.json#imports`. Its NodeNext tsconfig selects `development` sources, and `publishConfig.imports` makes packed plugins resolve `dist/client` in every host condition. Run shadcn from this package to add a primitive; keep generated imports unchanged. The application templates resolve these prefixes to their own sources, so neither scene needs a build-tool alias. See `ui-library/USAGE.md` from the repository root for installation and dependency ownership.

## Package structure

```text
app-plugin-registry-example/
├── client/
│   ├── components/ui/button.tsx
│   ├── default-pages/registry-example-page.tsx
│   ├── route-contracts.ts
│   └── routes.ts
├── registry/
│   ├── page-ui/
│   │   ├── pages/registry-example-page.tsx
│   │   ├── extension.ts
│   │   └── README.md
│   ├── component-ui/
│   │   ├── editable-panel.tsx
│   │   ├── index.ts
│   │   └── README.md
│   └── provider-ui/
│       ├── example-ui-context.ts
│       ├── example-ui-provider.tsx
│       ├── index.ts
│       └── README.md
├── components.json
├── registry.config.json
└── public/r/                         generated, not committed
```

## Registry items

The three items are independent. Install only the source the application
intends to own and customize.

| Item           | Shape                            | Installed target                                           | Plugin required | Application integration                               |
| -------------- | -------------------------------- | ---------------------------------------------------------- | --------------- | ----------------------------------------------------- |
| `page-ui`      | Complete page and route override | `client/extensions/nocobase-registry-example-page-ui`      | Yes             | Automatically discovered through `extension.ts`       |
| `component-ui` | Directly imported component      | `client/extensions/nocobase-registry-example-component-ui` | No              | Import `EditablePanel` from `index.ts`                |
| `provider-ui`  | Context, Provider, and hook      | `client/extensions/nocobase-registry-example-provider-ui`  | No              | Add `ExampleUiProvider` to the required React subtree |

### `page-ui`: plugin-integrated page

`page-ui` delivers a complete page, so keeping the component under `pages/` is
intentional. Its `extension.ts` imports the stable route ID from
`@nocobase/app-plugin-registry-example/client/route-contracts` and replaces
only that route's component loader.

The plugin continues to own:

- the `/registry-example` route path;
- the stable route ID;
- the default fallback page;
- any runtime or business capability required by the route.

The installed Registry source owns the editable page composition. It does not
declare a second route or import the plugin's private fallback components.

Register the plugin before using this item:

```bash
pnpm nocobase plugin register registry-example --workspace-root . --app app-template-default
```

Then materialize the editable page:

```bash
pnpm registry materialize \
  --package @nocobase/app-plugin-registry-example \
  --item page-ui \
  --output-root packages/templates/app-template-default
```

The application must already provide the shadcn `button` primitive when using
repository-local materialization:

```bash
cd packages/templates/app-template-default
pnpm exec shadcn add button
```

After installation, the Default Template discovers
`client/extensions/nocobase-registry-example-page-ui/extension.ts`. Visiting
`/registry-example` then renders the application-owned page. Without the
Registry item, the same route renders the plugin-owned fallback page.

### `component-ui`: directly imported component

`component-ui` follows the same pattern as reusable component Registries such
as the previous `nocobase-client` and `nocobase-file-upload` sources. It has no
page, route, or `extension.ts` because direct imports do not need automatic
application registration.

Materialize it independently:

```bash
pnpm registry materialize \
  --package @nocobase/app-plugin-registry-example \
  --item component-ui \
  --output-root packages/templates/app-template-default
```

Then import it from application code:

```tsx
import { EditablePanel } from '#extensions/nocobase-registry-example-component-ui/index';

export function CustomerSummary() {
  return (
    <EditablePanel
      title='Customer summary'
      description='This component is now owned by the application.'
      onAction={() => {
        // Call application code or a plugin's stable public action.
      }}
    >
      <p>Application-owned content</p>
    </EditablePanel>
  );
}
```

This item declares `button` as a `registryDependency`. Repository-local
materialization does not install that dependency, so add the shadcn Button to
the consuming application when it is not already present.

`component-ui` has no runtime import from this example plugin. The plugin owns
and publishes the recipe, but the installed component can be used without
enabling the plugin.

### `provider-ui`: Provider, Context, and hook

`provider-ui` follows the same general pattern as the previous
`nocobase-i18n` Registry Provider. It has no page, route, or `extension.ts`.
The application decides which React subtree receives the Provider.

Materialize it independently:

```bash
pnpm registry materialize \
  --package @nocobase/app-plugin-registry-example \
  --item provider-ui \
  --output-root packages/templates/app-template-default
```

Wrap the appropriate application subtree:

```tsx
import type { ReactNode } from 'react';

import { ExampleUiProvider } from '#extensions/nocobase-registry-example-provider-ui/index';

export function FeatureProviders({ children }: { children: ReactNode }) {
  return (
    <ExampleUiProvider initialDensity='comfortable'>
      {children}
    </ExampleUiProvider>
  );
}
```

Consume the context from a descendant:

```tsx
import { useExampleUi } from '#extensions/nocobase-registry-example-provider-ui/index';

export function DensityControl() {
  const { density, setDensity } = useExampleUi();

  return (
    <button
      type='button'
      onClick={() =>
        setDensity(density === 'compact' ? 'comfortable' : 'compact')
      }
    >
      Current density: {density}
    </button>
  );
}
```

This item has no shadcn or plugin runtime dependency. Installing Registry
source and integrating a Provider are separate actions; copying the files does
not automatically wrap the application.

## Materialize all items

Omitting `--item` copies every configured item:

```bash
pnpm registry materialize \
  --package @nocobase/app-plugin-registry-example \
  --output-root packages/templates/app-template-default
```

This creates three independent application directories:

```text
client/extensions/
├── nocobase-registry-example-page-ui/
├── nocobase-registry-example-component-ui/
└── nocobase-registry-example-provider-ui/
```

Materialization is deliberately limited to copying canonical source:

- it does not install npm dependencies;
- it does not install `registryDependencies`;
- it does not register or enable plugins;
- it does not automatically integrate components or Providers;
- it refuses to overwrite any existing target directory.

No Registry build is required for materialization because the command reads
`registry/<item>` directly.

## Build Registry JSON

Build every item from the repository root:

```bash
pnpm registry build --package @nocobase/app-plugin-registry-example
```

Build one item only:

```bash
pnpm registry build \
  --package @nocobase/app-plugin-registry-example \
  --item component-ui
```

From this package, build every item with:

```bash
pnpm registry:build
```

A complete build generates:

```text
public/r/
├── registry.json
├── page-ui.json
├── component-ui.json
└── provider-ui.json
```

`public/r` is generated and ignored by Git. The package's `prepack` hook runs
`registry:build`, and `package.json#files` includes the generated JSON,
canonical Registry source, and `registry.config.json` in the npm tarball.

Build is required for remote `shadcn add`, but not for repository-local
`materialize`.

## Install from a hosted Registry

Publishing this npm package includes `public/r/*.json`, but an npm tarball is
not itself an HTTP Registry. A release service must expose those JSON files
through HTTP or a CDN.

Given a hosted item URL, a consuming application can run:

```bash
cd packages/templates/app-template-default

pnpm exec shadcn add \
  https://registry.example.com/registry-example/r/component-ui.json
```

Remote `shadcn add` can process the item's npm `dependencies`,
`registryDependencies`, and file targets. For example, installing
`component-ui` also resolves its declared shadcn `button` dependency.

A consuming application may also configure a named Registry in
`components.json`:

```json
{
  "registries": {
    "@nocobase-registry-example": "https://registry.example.com/registry-example/r/{name}.json"
  }
}
```

It can then install items by name:

```bash
pnpm exec shadcn add @nocobase-registry-example/component-ui
pnpm exec shadcn add @nocobase-registry-example/provider-ui
```

## Adding another item to this plugin

When adding a new Registry item:

1. Create its canonical source under `registry/<item-name>`.
2. Organize the directory around its real public API. Do not add `pages/` or
   `extension.ts` unless the item actually needs them.
3. Export directly consumed APIs through an `index.ts` when appropriate.
4. Add the item to `registry.config.json`, including a unique target under
   `client/extensions/`.
5. Add the same canonical source path to
   `package.json#nocobase.registry.items`.
6. Declare every npm dependency with a compatible version.
7. Declare required shadcn primitives in `registryDependencies`.
8. Keep business logic behind stable plugin exports instead of copying it into
   editable Registry source.
9. Add build and materialization coverage.
10. Build the complete Registry before packaging or publishing.

## Upgrade policy

Installed Registry source belongs to the consuming application. Upgrading this
plugin must not overwrite an edited `client/extensions/**` copy.

Treat upgrades as a three-way merge:

1. Use the previous canonical Registry source as the merge base.
2. Preserve the application's edited installed copy.
3. Review and merge changes from the new canonical Registry source.
4. Check for new npm dependencies and `registryDependencies`.
5. Run the consuming application's lint, typecheck, tests, and build.

The repository `materialize` command refuses existing targets to prevent
accidental data loss.

## Validation

Run the package's complete check:

```bash
pnpm --filter @nocobase/app-plugin-registry-example check
```

Or run individual checks:

```bash
pnpm --filter @nocobase/app-plugin-registry-example lint
pnpm --filter @nocobase/app-plugin-registry-example format:check
pnpm --filter @nocobase/app-plugin-registry-example typecheck
pnpm --filter @nocobase/app-plugin-registry-example test
pnpm --filter @nocobase/app-plugin-registry-example registry:build
pnpm --filter @nocobase/app-plugin-registry-example build
```

Repository script tests also verify that all three items build and materialize
into their declared application targets:

```bash
pnpm scripts:test
```
