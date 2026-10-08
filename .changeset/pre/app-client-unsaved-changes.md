---
'@nocobase/app-client': patch
---

Add the "Discard unsaved changes?" state to `@nocobase/app-client` (`useUnsavedChangesGuard`, `useUnsavedChanges`, `useGuardedClose`, `UnsavedChangesContext`), so plugins that do not depend on each other ask the same question before a dialog with unsubmitted input closes; each plugin renders the question with its own UI.
