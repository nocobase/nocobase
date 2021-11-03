---
title: Plugins
toc: menu
nav:
  title: Plugins
  order: 4
---

# Plugins

## Plugin Manager

Development can download, activate, disable, and remove plugins via the command line, which corresponds to

```bash
## Download plugins, which can be activated quickly with the --enable parameter
yarn nocobase pm:download <plugin-name> --enable
# Activate the plugin
yarn nocobase pm:enable <plugin-name>
# Disable the plugin
yarn nocobase pm:disable <plugin-name>
# Remove the plugin
yarn nocobase pm:remove <plugin-name>
```

## List of existing plugins

### @nocobase/plugin-collections datasheet configuration

Provides an HTTP API for managing data tables and fields

### @nocobase/plugin-permissions

Permissions module

### @nocobase/plugin-users

User module

### @nocobase/plugin-system-settings

Site information configuration

### @nocobase/plugin-china-region

Field extension, China region

### @nocobase/plugin-file-manager

Field extension, attachment field

### @nocobase/plugin-action-logs

Action logs

### @nocobase/plugin-multi-apps

Dynamic multi-apps, a simple SaaS

### @nocobase/plugin-export

Operation extensions, export

### @nocobase/plugin-notifications

Notifications module (half-baked), only supports emailing for now, no visual interface

### @nocobase/plugin-automations

Automation (not available at the moment)

### @nocobase/plugin-client

Client-side plugin that provides visual configuration support for nocobase. Dependent plugins are.

- @nocobase/plugin-collections (required)
- @nocobase/plugin-permissions (required)
- @nocobase/plugin-users (required)
- @nocobase/plugin-system-settings (required)
- @nocobase/plugin-file-manager (required)
- @nocobase/plugin-china-region (optional)
- @nocobase/plugin-action-logs (optional)

Several components are included.

- Store client ui-schema on the server side for on-demand dynamic output
- Store client-side ui-router on the server side for on-demand dynamic output
- Provide static server support for app dist, allowing configuration of app dist paths
- Provide initial demo data import support for nocobase installation, configurable via importData
- Provide visualization support for collections
