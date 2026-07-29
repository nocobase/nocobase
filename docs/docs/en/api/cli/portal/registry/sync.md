---
title: "nb portal registry sync"
description: "nb portal registry sync command reference: install, compare, or update plugin-provided Registry items in an AI Portal."
keywords: "nb portal registry sync,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry sync

Install NocoBase Portal Registry items into an existing AI Portal workspace. The command reads the Registry index from the selected NocoBase service, so newly enabled plugins become available without hard-coding their items in the Portal template.

## Usage

```bash
nb portal registry sync <portal> [items...] [flags]
```

## Arguments and flags

| Argument or flag | Type | Description |
| --- | --- | --- |
| `<portal>` | string | Required AI Portal name or slug |
| `[items...]` | string[] | Optional Registry item names. Omit them to install all items exposed by enabled plugins. Both `ai` and `@nocobase/ai` forms are accepted |
| `--env`, `-e` | string | CLI env name; when omitted, the current env is used |
| `--yes`, `-y` | boolean | Skip confirmation when an explicit `--env` targets a different env |
| `--overwrite` | boolean | Replace installed Registry files while preserving existing `src/components/ui` files |
| `--overwrite-ui` | boolean | Allow `--overwrite` to also replace existing `src/components/ui` files; requires `--overwrite` |
| `--diff` | boolean | Show Registry file differences without changing the Portal |
| `--build` | boolean | Run `pnpm build` and `pnpm build:html` after installation |

## Examples

Install all available items that are not already installed:

```bash
nb portal registry sync customer
```

Install selected items:

```bash
nb portal registry sync customer ai acl auth-sms
```

Compare an installed item with the service version without writing files:

```bash
nb portal registry sync customer ai --diff
```

Overwrite an installed item while preserving base UI components:

```bash
nb portal registry sync customer ai --overwrite
```

Overwrite Registry files and base UI components:

```bash
nb portal registry sync customer --overwrite --overwrite-ui
```

Install and build the Portal:

```bash
nb portal registry sync customer --build
```

Use another env in a non-interactive workflow:

```bash
nb portal registry sync customer --env dev --yes
```

## Behavior

The command first requests the Registry index from the selected NocoBase service. Only items contributed by enabled plugins are returned. It then configures the `@nocobase` Registry in the Portal's `components.json` and installs items with the Portal's local shadcn CLI.

By default, items whose declared target files already exist are skipped. Existing `src/extensions` files and `src/components/ui` files are protected while missing items and dependencies are added.

Use `--overwrite` when you intentionally want to refresh installed Registry files. Base UI components remain protected unless `--overwrite-ui` is also passed. Review local customizations before using either overwrite option.

`--diff` is read-only and cannot be combined with `--overwrite`, `--overwrite-ui`, or `--build`.

If the Portal does not have `node_modules`, the command runs `pnpm install --frozen-lockfile` before invoking shadcn.

## Related Commands

- [`nb portal registry`](./index.md)
- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
