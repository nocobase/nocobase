---
'@nocobase/drive': minor
---

Support Aliyun ECS RAM roles for S3 storage with temporary credentials, automatic on-demand refresh, and bounded metadata recovery. Configure `credentials.provider: aliyun-ecs-ram-role` without storing access keys. Validated with simulated metadata and the real SDK signing chain; real ECS/OSS verification remains a follow-up.
