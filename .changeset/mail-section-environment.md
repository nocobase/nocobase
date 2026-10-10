---
'@nocobase/app-plugin-mail': patch
'@nocobase/app-template-examples': patch
---

Compose all seven MAIL_* environment mappings with the Mail configuration section and preserve them in the examples application. Keep the legacy fully prefixed application-level mappings compatible. Deployment environment values now override configuration files and code defaults automatically: review existing OAuth, sync, webhook and jobs variables before upgrading, including empty or invalid integers. Applications with custom parsers must retain or override the section rules explicitly; calling the defaults factory alone does not inherit them. Mail server configuration and webhook secrets remain outside public browser configuration.
