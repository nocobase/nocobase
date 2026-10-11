---
'@nocobase/studio': patch
---

Keep preview label ownership durable across concurrent Studio instances and validate label observations independently of pull request merge checks. Refresh issue previews when an external agent links the first pull request, and stop polling label states for closed pull requests. Once Studio attempts to add a PR's no-preview label, that label remains managed by the issue preferences while the PR is open; labels already present before Studio takes ownership remain manual.
