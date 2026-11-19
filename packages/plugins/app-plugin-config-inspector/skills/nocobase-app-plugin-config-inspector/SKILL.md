---
name: nocobase-app-plugin-config-inspector
description: Inspect the running application configuration, each setting's source, declared environment variables and the masked config.yml in System settings.
---

Open System settings → Application configuration with the `page:config-inspector/access` permission. "By module" shows every running setting with its value and source (config file, environment variable or code default), the declared variable and any file value the environment overrides; "Only changed" lists what differs from `config.example.yml`. "Environment" lists the declared variables and whether each is set. "Full config.yml" shows the loaded file, comments kept and credentials masked, in full or compared with `config.example.yml`. Treat it as diagnostic output, never as an import or backup: credentials, webhook URLs and URLs with embedded credentials are always masked. Initial administrator settings apply only during the first installation. To change configuration, edit config.yml or the environment through the owning application's deployment workflow and reload.
