---
title: "nb portal registry"
description: "nb portal registry command reference: manage plugin-provided Portal Registry items in an AI Portal workspace."
keywords: "nb portal registry,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry

Manage NocoBase Portal Registry items in an AI Portal workspace. Enabled server plugins can expose reusable frontend integrations such as components, hooks, adapters, and demo pages. The Registry commands install those integrations into the Portal source code.

## Usage

```bash
nb portal registry <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb portal registry sync`](./sync.md) | Install or update Registry items exposed by enabled NocoBase plugins |

## Requirements

- The Portal workspace must already exist and contain `package.json` and `components.json`.
- The selected NocoBase env must expose the Portal Registry API.
- Only Registry items from enabled plugins are available.

## Examples

Install all available Registry items into the `customer` Portal:

```bash
nb portal registry sync customer
```

Install selected items:

```bash
nb portal registry sync customer ai acl auth-sms
```

## Related Commands

- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
