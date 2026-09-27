---
'@nocobase/app-plugin-ai-employee': patch
---

The `nocobase-app-plugin-ai-employee` Skill's frontmatter is valid YAML again. Its unquoted `description` contained a colon followed by a space, which YAML reads as the start of a nested mapping, so Skill loaders that parse the frontmatter strictly skipped the Skill entirely.
