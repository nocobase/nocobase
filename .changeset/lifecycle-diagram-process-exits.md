---
"@nocobase/app-plugin-lifecycle-example": minor
"@nocobase/app-skills": minor
"@nocobase/app-template-default": minor
"@nocobase/app-template-examples": minor
---

Change `LifecycleDiagram` to default to compact `process` presentation (previously `classic`) with inline pill actions, and add explicit `exitStates` support for multi-stage early-termination outcomes.

Behavior change for newly created applications and code regenerated from the updated Skill (existing applications retain their copied component source): callers that omit `presentation` now render in `process` mode, where backward and self-transitions move from canvas edges into node hover/focus notes, `revealEdges` and `auxiliaryEdges` props are ignored in favor of process routes, and `initialMinZoom` defaults to `0.1` instead of `0.7`. Pass `presentation="classic"` to keep the previous full-edge card layout. Folded `exitStates` appear in each source stage's hover/focus notes and mark execution termination directly on the stopping stage.
