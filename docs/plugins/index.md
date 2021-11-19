---
title: Overview
nav:
  title: Plugins
  order: 4
---

# Plugins

## Plugin Manager <Badge>Not Available</Badge>

<Alert title="Note">
It is not yet possible to manage plugins via the CLI, this part is still under design and development.
</Alert>

Development can download, activate, disable, and remove plugins via the command line, which corresponds to

```bash
# Download plugins, which can be activated quickly with the --enable argument
yarn nocobase pm:download <plugin-name> --enable
# Activate the plugin
yarn nocobase pm:enable <plugin-name>
# Disable the plugin
yarn nocobase pm:disable <plugin-name>
# Remove the plugin
yarn nocobase pm:remove <plugin-name>
```

## List of existing plugins

Core plugins

- [@nocobase/plugin-collections](plugins/collections)  
  Provides an HTTP API for managing data tables and fields
- [@nocobase/plugin-permissions](plugins/permissions)  
  Permissions module (server-side)
- [@nocobase/plugin-users](plugins/users)  
  User module (server-side)
- [@nocobase/plugin-client](plugins/client)  
  Client-side plugin that provides a GUI for the server and connects @nocobase/server to @nocobase/client
- [@nocobase/plugin-ui-schema](plugins/ui-schema)  
  Store the Schema of the client SchemaComponent on the server side for on-demand dynamic output
- [@nocobase/plugin-ui-router](plugins/ui-router)  
  Client-side routing table, storing client-side route config on the server side for on-demand dynamic output

Other plugins

- [@nocobase/plugin-action-logs](plugins/action-logs)  
  Action logs
- [@nocobase/plugin-file-manager](plugins/file-manager)  
  File Manager
- [@nocobase/plugin-china-region](plugins/china-region)  
  China region, field extensions
- [@nocobase/plugin-export](plugins/export)  
  Export plugin
- [@nocobase/plugin-system-settings](plugins/system-settings)  
  System information configuration
- [@nocobase/plugin-multi-apps](plugins/multi-apps)  
  Dynamic multi-apps, easy SaaS plugin
- [@nocobase/plugin-notifications](plugins/notifications)  
  Notifications module (half-finished), only supports emailing for now, no visual interface
- [@nocobase/plugin-automations](plugins/automations)  
  Automation module (temporarily unavailable)
