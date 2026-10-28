---
'@nocobase/app-plugin-releases': patch
---

Downloading a release whose archive is missing from the artifact storage answers `404` with reason `RELEASE_ARCHIVE_NOT_FOUND` before any response headers are sent, instead of failing the stream mid-response. `EnvironmentsSettings` takes any `ReactNode` as its `title` and `description`.
