---
title: "Standard Components and Extensions"
description: "The AI Portal's shadcn/ui component base and its extension mechanism — one directory per extension, discovered and mounted automatically."
keywords: "AI Portal,shadcn/ui,components,extensions,AppExtension,Registry,Tailwind CSS"
---

# Standard Components and Extensions

:::tip Prerequisites

Before reading this page, make sure you have your first Portal running by following the [AI Portal Quick Start](./index.md).

:::

A Portal's interface has two parts: `src/components/ui` provides the base components, and `src/extensions` holds the business modules. This page covers how to use both.

## Component base

`src/components/ui` has 60-odd [shadcn/ui](https://ui.shadcn.com/) components — buttons, forms, dialogs, drawers, tables, charts, all the common ones. The style is configured in `components.json`, and the icons come from lucide.

Unlike pulling in a component library, **the source of these components belongs to your project**. They sit in your repository, you can change them freely, and upstream updates never overwrite them.

Because of that, customize through composition rather than by editing them directly:

```tsx
// Recommended: wrap it, so the base component stays replaceable
import { Button } from "@/components/ui/button";

export function SubmitButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}
```

Editing `src/components/ui/button.tsx` directly works too, but it makes picking up upstream bug fixes harder later. When you do need to change a base component, compare against the upstream version first and merge selectively instead of overwriting your local changes wholesale.

:::warning Note

Don't bring Ant Design, or NocoBase's Ant Design-based client components, into a Portal. The Portal's styling is Tailwind CSS plus shadcn/ui, and mixing them causes style conflicts. This convention is already written into the template's `AGENTS.md`.

:::

## Extension mechanism

Business features are written as extensions under `src/extensions/`, one directory per feature module:

```text
src/extensions/
├── nocobase-acl/               Permission components
├── nocobase-ai/                AI conversation capabilities
├── nocobase-route-surfaces/    Page, drawer, and modal route surfaces
└── nocobase-users-example/     User management example
```

Each directory has an `extension.tsx` with a default export of an `AppExtension`. The template scans and loads them automatically — **drop it into the directory and it works, with no registration code to change**.

## AppExtension

An extension can provide these:

| Field | Description |
| --- | --- |
| `id` | Extension identifier, required |
| `priority` | Load order, lower numbers first, 100 by default |
| `resources` | Refine resource definitions, determining the navigation menu and route mapping |
| `routes` | Route elements, mounted under the authenticated route tree |
| `Provider` | A Provider wrapping the whole application |
| `AuthRuntimeProvider` | Authentication runtime Provider, active before login |
| `UserMenuItems` | Entries to add to the user menu |
| `authAdapters` | Authentication method adapters |
| `dev` | Resources and routes that only apply in development mode |

A minimal extension looks like this:

```tsx
import type { AppExtension } from "@/app/extension";
import { Route } from "react-router";
import { Package } from "lucide-react";
import { ProductList } from "./list";

const productsExtension: AppExtension = {
  id: "products",
  resources: [
    {
      name: "products",
      list: "/products",
      meta: {
        label: "Products",
        icon: <Package />,
        acl: { type: "collection" }, // Takes part in NocoBase's collection permission checks
      },
    },
  ],
  routes: <Route path="/products" element={<ProductList />} />,
};

export default productsExtension;
```

## Built-in extensions

The template ships with four extensions. They're ready to use, and they're also the best reference when writing new code:

**`nocobase-users-example`** — A complete CRUD module on NocoBase's standard `users` collection, with list, create, edit, and detail views. Point the AI at it when building a new page.

**`nocobase-acl`** — Permission components: `CanAccess`, `AclPage`, `AclRegion`, `AclField`, and `RoleSwitcher`.

**`nocobase-route-surfaces`** — Three route surfaces: full page, drawer, and modal. The same content can open as a standalone page or pop out as a drawer inside a list page, with route state staying in sync.

**`nocobase-ai`** — Brings NocoBase's AI conversation capabilities to the frontend, including the chat window, streaming, conversation history, and page context. Use it to build an AI assistant into your own Portal.

## Import rules

Two path conventions apply when writing an extension:

- Use the `@/` alias for anything from the host application, such as `@/components/ui/button`
- Keep relative imports inside the extension from reaching outside its own directory

That keeps every extension self-contained, so you can copy the whole directory into another Portal and keep using it.

## Installable official extensions

<!-- Registry 的对外地址和可安装项清单待定，确定后补充这一节：怎么安装、有哪些可选扩展、安装后源码落在哪里 -->

Besides the four built-in ones, NocoBase will provide a set of official extensions you can install as needed. Once installed, the source lands under `src/extensions/` and becomes your project's own code just like a built-in extension, ready to modify and commit with the application.

## Localization

Strings live in `src/locales/`, and the template ships with English and Chinese. An extension can have its own language pack too — create a `locales/` directory inside the extension and import it from `extension.tsx`.

## Related Links

- [AI Portal Quick Start](./index.md) — Get your first AI-written frontend entry running
- [Project Structure and Tech Stack](./project-structure.md) — The full directory conventions and common commands
- [Building with an AI Agent](./agent-workflow.md) — Have the AI follow a built-in extension when writing a new module
