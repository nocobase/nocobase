---
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

The application templates' first-read instructions now state the permission rules generated applications broke: business-object IDs differ from table names, operations use short titles such as View and Create, a Create hides only its own scope slot and keeps its related-record scopes, and a duplicate business key answers 409 through a unique constraint.
