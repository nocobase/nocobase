---
'@nocobase/app-plugin-ai-employee': patch
---

Remove the SQL identifier quoting and `DB_UNDERSCORED` naming rules from the AI employee system prompt. AI employees read data only through the Repository-backed data tools, which take Collection and field names and apply the Connection naming strategy themselves, so the instructions to write SQL and convert names to snake_case described a capability they do not have.
