---
'@nocobase/app-plugin-agents': patch
'@nocobase/app-template-examples': patch
---

Keep native agent conversations usable when a user attaches an unsupported file type. Describe the filename, MIME type and parsing limitation in user-level model replay instead of failing the execution, including historical follow-up and unsupported image inputs. Preserve original attachments, authorization, input budgets and genuine parsing or Provider failures; update the Examples regression coverage without granting additional image capabilities.
