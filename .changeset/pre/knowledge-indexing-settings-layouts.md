---
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Add shared dialog and standalone Knowledge indexing settings with type-owned forms, on-demand Embedding catalogs, per-instance drafts and zero-configuration guidance. Move the pgvector generation table prefix into deployment configuration and prevent browser options from overriding it. Add a permission-protected Examples settings page and synchronize deployment examples in both templates. Separate index enablement into a dedicated switch, retain rendered forms and drafts across toggles, show document progress with hover-only failure counts, and place rebuild controls in the footer. Display the selected instance type beside its selector. Keep settings fields, progress and footer vertically stacked in both standalone and dialog layouts. Remove duplicate standalone back navigation and scope labels. Make indexing entry placement application-owned: add a generic title-action slot and remove built-in page/back navigation from the reusable settings components. Add an Examples Knowledge indexing menu immediately below Knowledge.

Explain the sqlite-vec and pgvector vector database options in two setup cards, followed by concrete configuration-file, restart and enablement steps. Provide a separate localized Agent prompt that checks available types, waits for the user’s choice and confirms configuration changes and paid operations.
