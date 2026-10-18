# @nocobase/drive

File storage for NocoBase applications.

## Skill and configuration guides

The package ships the [NocoBase Drive Skill](skills/nocobase-drive/SKILL.md). Applications that declare `@nocobase/drive` as a direct dependency can run `pnpm nocobase skills sync` to copy it into `.agents/skills/nocobase-drive/`; the standard application templates run synchronization during installation.

- [Filesystem storage (`fs`)](skills/nocobase-drive/references/fs.md)
- [S3 and compatible storage (`s3`)](skills/nocobase-drive/references/s3.md)
- [Native Aliyun OSS and ECS RAM roles (`oss`)](skills/nocobase-drive/references/aliyun-ecs-ram-role.md)
- [Custom driver factories in `disks`](skills/nocobase-drive/references/custom-drivers.md)
