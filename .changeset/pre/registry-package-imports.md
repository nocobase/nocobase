---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
'@nocobase/create-plugin': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-registry-example': patch
'@nocobase/app-plugin-ai-employee-example': patch
'@nocobase/app-plugin-ai-employee': patch
'@nocobase/app-skills': patch
---

Use package-local `#` subpath imports in registry recipes, examples and application templates. Configure the same prefixes in `components.json` and `package.json#imports`, and remove build-tool aliases for these paths. Generated plugins resolve development sources locally and published imports from `dist/client`.

Existing applications and plugins should merge the new `imports` mappings and shadcn prefixes before installing the updated registry recipes. Directory entry points need an explicit mapping to their index file. Existing customized copies remain application-owned and are not overwritten.
