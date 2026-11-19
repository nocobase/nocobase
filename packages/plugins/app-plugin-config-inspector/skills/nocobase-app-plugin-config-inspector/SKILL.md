---
name: nocobase-app-plugin-config-inspector
description: Inspect reviewed application configuration, source precedence and the redacted file projection in System settings.
---

Open System settings → Application configuration with the `page:config-inspector/access` permission. Search by field path or section environment variable. The effective view shows the loaded value and source. The file projection reconstructs reviewed settings only, omitting all original YAML comments, credentials and unreviewed fields. Treat it as diagnostic output, never as an import or backup. Initial administrator credentials apply only during initial installation. To change configuration, use the owning application's deployment or configuration workflow.
