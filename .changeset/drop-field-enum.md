---
'@nocobase/db': patch
---

Dropping an enum Field works again. The previous release compiled every dropped Field's columns to tell whether it owned any, and compiling an existing enum Field with a native type throws; only relations are now checked.
