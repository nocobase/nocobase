# @nocobase/js-template-sdk

Canonical authoring types, schema contracts, and pure settings type generation for NocoBase JS templates.

- `@nocobase/js-template-sdk/client`: client template context types and settings helpers.
- `@nocobase/js-template-sdk/schema`: canonical `entry.json v1` schema and condition contract constants.
- `@nocobase/js-template-sdk/shared`: runtime-neutral settings context types and helpers.
- `@nocobase/js-template-sdk/typegen`: pure `entry.json.settings` type generation.

The package is the only SDK implementation for JS Templates. Schema URIs, generated paths, and
`js-template:settings/*` imports are canonical protocol identifiers.

## JS Page typing

Place each JS Page template in `src/client/js-pages/<template-name>/` with an `entry.json` descriptor. The workspace generates a settings module from the descriptor key:

```ts
import type { JSPageContext, RunJSContext } from '@nocobase/js-template-sdk/client';
import type { Settings } from 'js-template:settings/client/js-page/hello-page';

const pageContext: RunJSContext & JSPageContext<Settings> = ctx;
await pageContext.page.refresh();
```

The generated settings import is authoring-only and is not stored with runtime artifacts. JS Page code runs as trusted administrator code rather than an untrusted sandbox; requests still use the current server resource ACL and cannot bypass data permissions.
