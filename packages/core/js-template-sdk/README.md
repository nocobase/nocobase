# @nocobase/js-template-sdk

Canonical authoring types, schema contracts, and pure settings type generation for NocoBase JS templates.

- `@nocobase/js-template-sdk/client`: client Entry context types and settings helpers.
- `@nocobase/js-template-sdk/schema`: canonical `entry.json v1` schema and condition contract constants.
- `@nocobase/js-template-sdk/shared`: runtime-neutral settings context types and helpers.
- `@nocobase/js-template-sdk/typegen`: pure `entry.json.settings` type generation.

The legacy `@nocobase/light-extension-sdk` package remains a compatibility facade with the same public subpaths.
Legacy schema URIs, generated paths, and `light-extension:settings/*` imports remain stable protocol identifiers.

## JS Page typing

Place each JS Page entry in `src/client/js-pages/<entry-name>/` with an `entry.json` descriptor. The workspace generates a settings module from the descriptor key:

```ts
import type { JSPageContext, RunJSContext } from '@nocobase/js-template-sdk/client';
import type { Settings } from 'light-extension:settings/client/js-page/hello-page';

const pageContext: RunJSContext & JSPageContext<Settings> = ctx;
await pageContext.page.refresh();
```

The generated settings import is authoring-only and is not stored with runtime artifacts. JS Page code runs as trusted administrator code rather than an untrusted sandbox; requests still use the current server resource ACL and cannot bypass data permissions.
