---
'@nocobase/studio': minor
---

Add an issue-level "Preview not required" setting that keeps a pull request's `no-preview` label in sync: the label is applied only when every linked active issue opts out, existing manual labels are kept, and failed label updates are retried and reported.
