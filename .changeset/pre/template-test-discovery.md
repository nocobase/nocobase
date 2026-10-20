---
'@nocobase/app-template-default': minor
---

Discover tests with a glob instead of a hand-maintained list of filenames, and pass an empty run so `pnpm test` works in a generated application, which ships no tests. The list named a file that no longer existed while several real test files were absent from it and were never run; those covering removed sources are deleted.
