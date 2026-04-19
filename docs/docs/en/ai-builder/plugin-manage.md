---
title: "Plugin Management"
description: "The Plugin Management Skill views, enables, and disables NocoBase plugins."
keywords: "AI Builder,plugin management,enable plugin,disable plugin"
---

# Plugin Management

## Introduction

The Plugin Management Skill views, enables, and disables NocoBase plugins — it automatically identifies local or remote environments, selects the appropriate execution backend, and verifies operations through read-back validation.

## Installation

```bash
npx skills add nocobase/skills --skill nocobase-plugin-manage -y
```

## Capabilities

- View the plugin directory and enabled status (`inspect`)
- Enable plugins (`enable`)
- Disable plugins (`disable`)

## Prompt Examples

### Scenario A: Viewing plugin status

```
Show which plugins are currently installed
```

It will list all plugins along with their enabled status and version information.

![Viewing plugin status](https://static-docs.nocobase.com/20260417150510.png)

### Scenario B: Enabling a plugin

```
Enable the plugin-localization plugin
```

The Skill will enable plugins in order, with a read-back verification after each enable to confirm `enabled=true`.

![Enabling a plugin](https://static-docs.nocobase.com/20260417153023.png)

### Scenario C: Disabling a plugin

```
Disable the plugin-localization plugin
```

![Disabling a plugin](https://static-docs.nocobase.com/20260417173442.png)

## FAQ

**What should I do if a plugin doesn't take effect after enabling?**

Some plugins require an application restart to take effect after being enabled. The Skill will indicate in the results whether a restart is needed.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [NocoBase CLI](../get-started/nocobase-cli.md) — Command-line tool for installing and managing NocoBase
