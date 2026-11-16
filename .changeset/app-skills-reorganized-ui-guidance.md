---
'@nocobase/app-skills': minor
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Reorganize the application development Skills so each rule has one home and an ordinary CRUD page needs far less reading. Frontend work follows two workflows: changing an existing page (verified at 1440 and 390 px) or building a new page or module from a short page plan and the runnable example, followed by an independent acceptance pass. The UI guidelines are the only source of visual and interaction rules and resolve earlier conflicts: forms open in a route dialog whose `FeedbackForm` asks before discarding input, row actions stay in the "⋮" menu with at most two planned primary actions exposed, small records open their details in a drawer, search uses `DataTableSearch`, and views refresh after a write only through scopes. The entry Skill delivers only what the user asked for plus the minimal administration a used capability needs, and asks before installing packages. The plugin, deployment and upgrade Skills link to the application Skill instead of copying it, organisation guidance moves to the authorization plugin Skill, the upstream shadcn Skill copy and retired Hub guidance are removed, and the UI Library catalog becomes a compact index. The component checker limits exposed row actions to two and reports a page that asks about unsaved input itself, through `OwnDiscardQuestion`, a navigation guard or `beforeClose`, so the onboarding and procurement examples now compare their form values with what is saved instead. The runnable list example uses `DataTableSearch`, the list state helper, `useCan` and a detail drawer, the customer contacts example refreshes its views through scopes after a write, and the Default template ships the shared `DatePicker`.
