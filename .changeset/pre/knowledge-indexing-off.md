---
'@nocobase/app-plugin-knowledge': minor
---

Add `createKnowledgePlugin({ indexing: false })` and the client option `indexing: false` for applications without a vector index: no index backends, indexing routes, `kb.indexing` settings item or indexing entry are registered, and search keeps the built-in text match. The `kb.indexing` settings item now has translated titles and its own Knowledge group under administration.
