---
"@nocobase/lifecycle": patch
"@nocobase/app-plugin-lifecycle-example": patch
"@nocobase/app-plugin-office-flows-example": patch
---

Persist whether each effect run belongs to the entered state in the required boolean `stayBound` field. Preserve transition-owned continuations when a hook immediately moves the record onward, even when the same effect also appears in `onEnter`, and keep a run's binding stable across definition changes. Update both examples' unreleased migrations and the lifecycle example API schema.
