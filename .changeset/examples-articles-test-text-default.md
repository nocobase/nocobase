---
'@nocobase/app-template-examples': patch
---

The articles migration test inserts a row with its `content` given, and checks only the defaults every dialect keeps in the table, so it passes on OceanBase, which keeps no default on a TEXT column.
