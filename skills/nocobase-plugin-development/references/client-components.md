# Client Components and shadcn/ui

Use this reference for plugin-owned pages, React Providers, reusable component exports, and internal UI. A component becomes part of runtime behavior only when a Route loads it, a React Provider renders it, another module imports it, or the package exposes it through a public export; there is no `client.components` contribution.

## Decide component ownership first

| Component kind            | Assembled by                                     | Source owner                              |
| ------------------------- | ------------------------------------------------ | ----------------------------------------- |
| Page                      | Route `componentLoader()`                        | Plugin, unless the App overrides the page |
| React tree wrapper        | `defineClientReactProviders()`                   | Plugin                                    |
| Public reusable component | App or another plugin importing a package export | Plugin API                                |
| Internal component        | Another module inside the plugin                 | Plugin implementation                     |
| Registry component        | Target App after materialization                 | App                                       |

This ownership determines which package imports, UI primitives, locales, dependencies, exports, tests, and upgrade rules apply.

## Start common UI with shadcn/ui

Before implementing buttons, inputs, forms, selects, dialogs, sheets, tables, tabs, tooltips, dropdown menus, and similar common patterns, check shadcn/ui and generate the matching primitive into the plugin. Use ordinary semantic HTML for document structure and Tailwind utilities for composition, but do not hand-build a duplicate interactive primitive when shadcn provides one.

shadcn/ui distributes source rather than a shared NocoBase runtime package. Runtime UI used by a plugin belongs to that plugin under `client/components/ui/`, is published with the plugin, and resolves through that plugin's `package.json#imports`. Registry items use a different ownership model: once installed, their source belongs to the receiving package and resolves its own `#components/ui/*` mappings.

Inspect the plugin's `components.json`, `package.json#imports`, `publishConfig.imports`, and `tsconfig.json` before generation. When a plugin lacks shadcn setup, use the following package-local configuration with the repository's `base-nova` style:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "client/styles.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "#components",
    "utils": "#lib/utils",
    "ui": "#components/ui",
    "lib": "#lib",
    "hooks": "#hooks"
  },
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  },
  "menuColor": "default",
  "menuAccent": "subtle"
}
```

Provide the generation entrypoint at `client/styles.css`:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import 'shadcn/tailwind.css';

/* Generation entrypoint only. The host application owns the theme tokens. */
```

Declare the package's source and compiled targets in `package.json`:

```json
{
  "imports": {
    "#components/*": {
      "development": "./client/components/*.js",
      "default": "./dist/client/components/*.js"
    },
    "#hooks/*": {
      "development": "./client/hooks/*.js",
      "default": "./dist/client/hooks/*.js"
    },
    "#lib/*": {
      "development": "./client/lib/*.js",
      "default": "./dist/client/lib/*.js"
    },
    "#extensions/*": {
      "development": "./client/extensions/*.js",
      "default": "./dist/client/extensions/*.js"
    }
  },
  "publishConfig": {
    "imports": {
      "#components/*": "./dist/client/components/*.js",
      "#hooks/*": "./dist/client/hooks/*.js",
      "#lib/*": "./dist/client/lib/*.js",
      "#extensions/*": "./dist/client/extensions/*.js"
    }
  }
}
```

Keep existing `publishConfig` fields when adding these mappings. Set `compilerOptions.customConditions` to `["development"]` in the plugin's NodeNext tsconfig so shadcn and TypeScript find the source files. TypeScript resolves the `.js` targets to `.ts` or `.tsx` sources and leaves the `#` import in emitted JavaScript; pnpm replaces the published mappings with unconditional `dist/client` targets, including when the consuming application selects `development`. No TS `paths` or Vite alias is needed, and installed imports need no rewrite. An import of a directory needs an exact mapping to its `index.js`.

Keep `shadcn`, `tailwindcss`, and `tw-animate-css` in `devDependencies`. Put packages imported as values by the generated Client source in `peerDependencies`, commonly `@base-ui/react`, `class-variance-authority`, `cn`, and `lucide-react` when used. Generated primitives import `cn` from the `cn` package, which stays a package import; do not add `clsx` or `tailwind-merge`. Use the workspace catalog entries and remove generated dependencies that the retained source does not import.

Run the CLI from the plugin directory and add only primitives required by the current feature:

```bash
cd packages/plugins/app-plugin-audit-log
pnpm exec shadcn add button card dialog
```

Do not use `--overwrite` over customized primitives without reviewing and accepting the diff. The Registry example components.json (`packages/examples/app-plugin-registry-example/components.json`), generation stylesheet (`packages/examples/app-plugin-registry-example/client/styles.css`), and adapted Button source (`packages/examples/app-plugin-registry-example/client/components/ui/button.tsx`) are the maintained source-generation example.

## Adapt generated source for a published plugin

Generated shadcn source targets application source by default. Before treating it as plugin runtime source:

- Preserve generated package-local `#` imports. Keep hand-written relative imports explicit with `.js` extensions.
- Give exported components, functions, constants, props, and default parameters explicit types suitable for declaration output.
- Preserve accessible names, focus behavior, disabled state, keyboard interaction, and theme-responsive classes.
- Remove unused generated files and peer dependencies.
- Keep CSS side effects explicit; use `sideEffects: false` only when every published module is genuinely free of import-time side effects.

Use the shared theme contract for all plugin UI: [theme tokens](theme-tokens.md). Prefer its color, typography, spacing, radius, shadow, and motion utilities so plugin UI responds to the target App's theme.

## Copy page and route components into the plugin

When a plugin needs the application's page structure or route overlays, copy the UI Library components that provide them into `<plugin>/client/components/` and maintain them as plugin-owned code. Inside this repository, copy each file an item lists in `ui-library/registry/components/registry.json` from `ui-library/registry/components/<path>` to its `target`, as `ui-library/USAGE.md` describes, rather than running `shadcn add`. These are source references, not runtime imports from the host App. Reuse an existing plugin copy before adding another.

| Need                                   | Item                           | Installs into `client/components/`                                                            |
| -------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| Page spacing                           | `page-container`               | `page-container.tsx`                                                                          |
| Page heading and actions               | `page-header`                  | `page-header.tsx`                                                                             |
| Route dialog or drawer                 | `route-dialog`, `route-drawer` | `route-dialog.tsx` or `route-drawer.tsx`, with `route-overlay.tsx` and `use-route-overlay.ts` |
| Covering child page                    | `route-child-page`             | `route-child-page.tsx`                                                                        |

Copy every file an item lists: `route-dialog` and `route-drawer` share `route-overlay.tsx` and the one Context `use-route-overlay.ts` declares, so a plugin that uses both keeps a single copy of each. Their imports remain unchanged: `cn` comes from the `cn` package and `#components/ui/<name>` resolves the plugin's own primitives through its package mappings. Generate missing primitives with the workflow above. Declare the packages each item lists in `dependencies` as peers. Keep these copies private unless an approved public export is required.

The way back from a page below another one is not a UI Library item: copy `BackButton` from an application template's `client/components/back-button.tsx`, such as `packages/templates/app-template-default/client/components/back-button.tsx`, into the plugin's `client/components/` the same way.

The overlays' close button reads `routeOverlay.close`, and `BackButton` reads `navigation.back`. Add them to the plugin's own `client/locales/` resources in every supported language (`Close` and `Back` in English, `关闭` and `返回` in Chinese, for example) and register the lazy locale manifest in its Client declaration; see [internationalization](i18n.md). Do not rely on the host App providing the key. Under the plugin's own route, the copied overlay inherits the plugin namespace; if it is intentionally exported for another owner to render, bind that namespace explicitly as described in the internationalization guide.

The page examples in this Skill assume these copies already exist. Nested pages adjust the relative path to the same plugin-owned components. The host App's private breadcrumb component is excluded from this copy workflow because it reads an App-owned route Context; do not copy that Context or import the host's routing internals.

Verify copied components with the plugin's lint, typecheck, tests and build, then exercise them in the target App. For overlays, cover direct URLs, closing, nested Context ownership, keyboard interaction and unsaved-change guards.

## Compose business components

Use semantic HTML for structure, plugin-owned shadcn primitives for interaction, and the shared Tailwind theme tokens for layout and visual hierarchy:

```tsx
import type { ReactElement } from 'react';

import { Button } from './ui/button.js';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card.js';

export interface AuditSummaryProps {
  readonly onViewRecords: () => void;
  readonly total: number;
}

export function AuditSummary({
  onViewRecords,
  total,
}: AuditSummaryProps): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit records</CardTitle>
        <CardAction>
          <Button variant='outline' onClick={onViewRecords}>
            View records
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className='text-2xl font-semibold'>{total}</p>
      </CardContent>
    </Card>
  );
}
```

Keep a component private unless the App or another package needs a stable import. Public components should be exposed through an intentional subpath such as `./client/components`, backed by a barrel and matching source and `publishConfig.exports`; consumers must not deep-import `src/`, private folders, or unpublished files.

A public component's contract includes props, render semantics, accessibility, theme integration, namespace behavior, peer dependencies, and export path. Update its types, behavioral tests, user-facing integration guidance, and changeset when that contract changes.

## Report results through the App's toasts

A plugin neither mounts a toast host nor brings a toast library. The App mounts one Base UI `Toaster` in its `client/react-providers.ts`, and a plugin component reaches it through `Toast.useToastManager()` from `@base-ui/react/toast`, a peer the plugin already declares:

```tsx
import { Toast } from '@base-ui/react/toast';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Button } from './ui/button.js';

export function SaveButton({
  onSave,
}: {
  readonly onSave: () => Promise<void>;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-audit');
  const { add: addToast } = Toast.useToastManager();
  return (
    <Button
      onClick={() =>
        void onSave().then(
          () => addToast({ type: 'success', title: t('records.saved') }),
          () =>
            addToast({
              type: 'error',
              priority: 'high',
              title: t('records.saveFailed'),
            }),
        )
      }
    >
      {t('actions.save')}
    </Button>
  );
}
```

Destructure `add` and `close` rather than keeping the returned object: the object changes whenever a toast appears or leaves, while `add` and `close` are stable, so only they belong in `useCallback` and `useEffect` dependencies. The hook throws outside a `Toast.Provider`, so a component test wraps what it renders, as `render(ui, { wrapper: Toast.Provider })`, or mocks the hook when it asserts what was reported. Do not add sonner or report through Refine's `useNotification()`: the App mounts no sonner host and registers no Refine notification provider, so both report nothing.

## Keep page modules lazy

Route declarations load page modules instead of statically importing them in `client/plugin.ts`. Declare `authz` on the first page of every path, as a check, `'skip'` or `'unrestricted'`. A nested page that omits it inherits its nearest ancestor page's value. A first page that omits it still registers with a development warning, defaulting to `'unrestricted'` (root only) on a protected App or settings page and to `'skip'` on a guest, optional or dev page, so always declare it:

```ts
defineSettingsRoutes([
  {
    name: 'audit-log',
    path: '/audit-log',
    navigation: { title: 'auditLog.title' },
    authz: { resource: { type: 'settings', id: 'audit-log' }, action: 'read' },
    componentLoader: () => import('./pages/audit-log-page.js'),
  },
]);
```

The page module must default-export a React component. Use a route component override when an App changes only the page UI; do not redeclare the plugin-owned route identity, path, authentication, or access metadata.

## Bind translations by render ownership

A component rendered under its own plugin Route or React Provider inherits that contribution's package namespace. A public component rendered by an App or another plugin sits in the consumer's render scope, so bind the plugin namespace explicitly with `useTranslation(PLUGIN_NS)` or `withNamespace(PLUGIN_NS, Component)`.

Explicit namespace binding selects resources but does not register them. A component-only package must either receive App-owned copy through props or provide a locales-only Client plugin factory that the target App explicitly registers. See [i18n.md](./i18n.md).

## Verify components at their public boundary

- Test user-visible behavior, keyboard and pointer interaction, accessible names, loading, empty, and error states.
- Import public components from their official package subpath in export tests.
- Invoke page `componentLoader()` and assert that it resolves a default component.
- Run the plugin's focused `lint`, `typecheck`, `test`, and `build`; use pack checks when exports or published files change.
- Exercise the component in the target App when the behavior depends on the real theme, application services, React Providers, routes, or locale composition.

A component is reached through the Route or React Provider that assembles it. Validate component behavior through types, exports, tests, build output, and the target App.
