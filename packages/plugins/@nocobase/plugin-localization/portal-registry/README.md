# NocoBase i18n

Optional NocoBase server-language integration and language controls for the
NocoBase Admin Starter.

The Starter owns the Refine i18n provider, local i18next runtime, application
resources, locale selection, and the shared `systemSettings:get` bootstrap.
This Registry reuses those foundations and adds only the NocoBase-specific
remote capabilities:

- load registered dynamic namespaces from `app:getLang`;
- persist a signed-in user's selected language through `users:updateLang`;
- expose reusable page and user-menu language switchers;
- provide an integrated Demo and Prompt generator.

When this Registry is not installed, the Starter still uses the system default
language and all local translations normally. It does not request
`app:getLang`. When installed, the Registry reads the already-cached system
settings and requests only registered server namespaces. `lm-collections` is
registered by default for collection and field metadata.

Application-owned React translations belong in `src/locales`, outside the
installed Registry directory:

```ts
import { registerLocaleResources } from "@/providers/i18n";

registerLocaleResources("my-feature", {
  "en-US": { title: "Orders" },
  "zh-CN": { title: "订单" },
});
```

Other installed components can opt into another server-generated namespace:

```ts
import { registerServerResourceNamespace } from "@/extensions/nocobase-i18n";

registerServerResourceNamespace("my-dynamic-namespace");
```

Namespaces registered after startup are loaded incrementally. Existing exact
NocoBase expressions such as `{{t("Orders")}}` remain supported by the
Starter's translation compatibility helper.
