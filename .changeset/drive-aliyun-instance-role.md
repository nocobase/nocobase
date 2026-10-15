---
'@nocobase/drive': minor
'@nocobase/app-host': patch
---

Add a native Aliyun OSS drive using the official server SDK, with access keys or ECS RAM role credentials, on-demand refresh, V4 signed URLs, file operations and ACL support. Handle input stream errors while credentials are loading so failed uploads reject safely without terminating the process. Allow OSS artifact storage in standalone App Hosts. S3 configuration and credential behavior remain unchanged. Validated with simulated metadata and the real OSS SDK request/signing chain; real ECS/OSS verification remains a follow-up.
