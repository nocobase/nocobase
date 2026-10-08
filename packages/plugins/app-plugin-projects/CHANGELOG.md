# @nocobase/app-plugin-projects

## 0.1.0-beta.0

### Minor Changes

- 68d4feb: Add `@nocobase/app-plugin-projects`: projects, issues, workflows, labels and members for a NocoBase application. Issues carry workflow states, assignees of pluggable kinds (people, the plugin's own rules, or kinds another plugin registers, such as agents), sub-issues and dependencies, comments with reactions, attachments and activity; operation plans let a person confirm, rehearse, execute and undo a batch of changes proposed for them; intake splits and extracts issues from text and files. Business permissions are declared in `shared/access.ts` (the `pm` resource type, `edit.related` and `edit.all` levels) and resolved by the assembling application through `projectsAccessToken`. Every route is documented with command-line hints, and the client exports headless hooks (`client/kit`, `client/issues`) for the UI Library's project and issue blocks.

### Patch Changes

- 32d8faa: On PostgreSQL, a member who may see no project, no issue or no App no longer gets a server error: the filters used a NUL character as a placeholder id that matches nothing, which PostgreSQL refuses. The releases plugin's App list, for one, answered 500 to every member who had created no App.
- ec4a25d: On PostgreSQL, a lookup over an empty list of ids no longer fails with an invalid byte sequence: it sent a NUL character as a placeholder that matches nothing, which PostgreSQL refuses. This stopped the default workflow template from installing on a fresh database.
- 6162033: A pending invitation's row menu no longer closes by itself when the invitation list renders again, such as when it is fetched again: the list's cells are no longer rebuilt on every render.
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [be0fbbd]
- Updated dependencies [bc1e83f]
- Updated dependencies [6993158]
- Updated dependencies [a6796d9]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [3f1b78f]
- Updated dependencies [8885ce4]
- Updated dependencies [0151805]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [e538d12]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [6162033]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
  - @nocobase/markdown-mermaid@0.1.0-beta.0
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.25
  - @nocobase/app-plugin-users@2.0.0-beta.1
  - @nocobase/app-plugin-notification@1.0.0-beta.23
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/app-plugin-file@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/repository-input@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

### Patch Changes

- Add the initial plugin scaffold.
