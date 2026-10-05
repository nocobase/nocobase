---
'@nocobase/app-template-examples': patch
---

The numeric examples test compares decimal strings by value, so it passes on PostgreSQL and MySQL, which pad a decimal to its column's or its aggregate's scale (`42.000000`, `3002399751580331.0000`) where SQLite does not.
