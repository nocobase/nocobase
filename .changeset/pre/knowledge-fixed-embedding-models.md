---
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-plugin-agents': patch
---

Allow Knowledge indexing to use a manually entered fixed Embedding model ID as well as catalog suggestions, including services with empty model lists. Keep unlisted models behind an explicit server-only gateway opt-in, preserve service and model-kind checks, and learn unknown vector dimensions from indexing responses without probing on edit or save. Rename the Chinese settings title and remove duplicate dialog close controls and standalone configuration headings.

Show deployment guidance whenever no indexing instances are configured, including when earlier settings remain saved. Preserve those settings without presenting a stale form or old progress as configurable.

Simplify zero-instance guidance and localize a clearer Agent configuration prompt: inspect supported indexing types, let the user choose, and edit knowledge.indexing in the actual config.yaml or existing config.yml without assuming a vector backend.
