---
pkg: '@nocobase/plugin-file-storage-s3-pro'
title: "Migration zu S3 Pro"
description: "Migrate files from public-only storage engines to S3 Pro, including maintenance windows, backups, object key mapping, record updates, and risk checks."
keywords: "S3 Pro,storage migration,private access,file migration,Local Storage,S3,OSS,COS,NocoBase"
---

# Migration zu S3 Pro

If you already use [Local Storage](./local.md), [Amazon S3](./amazon-s3.md), [Aliyun OSS](./aliyun-oss.md), or [Tencent COS](./tencent-cos.md), and later need private file access, you can migrate historical files to [S3 Pro](./s3-pro.md).

This is not only a storage configuration change. A migration must handle three things: make the physical files or objects available from the new storage, update file records, and switch future uploads to the new storage.

:::warning Hinweis

Run the migration once in a test environment first, and prepare restorable database and file backups. If users continue to upload or delete attachments during the migration, records can be missed, overwritten, or become inconsistent.

:::

## Scope

This guide applies when migrating from these storage engines to S3 Pro:

| Source storage engine | Historical file location |
| --- | --- |
| Local Storage | `<documentRoot>/<record.path>/<record.filename>` |
| Amazon S3 | `join(record.path, record.filename)` in the source bucket |
| Aliyun OSS | `join(record.path, record.filename)` in the source bucket |
| Tencent COS | `join(record.path, record.filename)` in the source bucket |

Here, `record.path` and `record.filename` come from the file record itself, including the built-in `attachments` table and other file collections.

:::tip Hinweis

For Local Storage, `documentRoot` must come from `options.documentRoot` in the corresponding `storages` record. The default value is `storage/uploads`, but the final absolute path depends on the runtime storage directory of NocoBase.

:::

## Operation Steps

### Step 1: Stop writes or enter a maintenance window

Pause user uploads, updates, and deletions of attachments during the migration. You can use a maintenance window, temporarily disable entry points, or freeze related business flows.

The goal is to keep file records and physical files stable. If users upload or delete files during migration, the migration script may no longer be working against the latest records.

### Step 2: Back up the database and files

Prepare at least two backups:

1. Database backup
2. File backup or object snapshot from the source storage

For Local Storage, back up the directory pointed to by `documentRoot`. Historical files are usually stored at:

```text
<documentRoot>/<record.path>/<record.filename>
```

For Amazon S3, Aliyun OSS, and Tencent COS, confirm that objects in the source bucket are still readable, and record the source storage engine's `id`, `name`, `type`, `path`, `baseUrl`, and `options`.

It is also recommended to export a migration manifest for rollback and manual review:

```text
collection
id
oldStorageId
oldPath
oldFilename
oldUrl
newKey
size
mimetype
```

### Step 3: Create and verify the S3 Pro storage

Create a new `s3-compatible` storage according to [S3 Pro](./s3-pro.md). At least verify these settings:

- bucket
- endpoint
- region
- accessKey
- secret
- public / private
- access endpoint
- forcePathStyle
- file size and MIME type rules

Upload a test file with the new storage and confirm upload, preview, download, and deletion all work. If the target is private access, also confirm that the access URL is a temporary signed URL and that its expiration is expected.

:::warning Hinweis

S3 Pro uses direct client upload. The target bucket must have CORS rules that allow uploads from the NocoBase site, otherwise new uploads will fail.

:::

### Step 4: Decide the object key mapping

For historical files migrated to S3 Pro, it is recommended to continue using the old relative path as the S3 object key:

```text
oldKey = join(record.path, record.filename)
```

For example:

```text
record.path = "avatars"
record.filename = "a-123.png"
oldKey = "avatars/a-123.png"
```

For persisted file records, S3 Pro uses `file.filename` directly as the full object key when accessing the file. It does not append `file.path`. Therefore, migrated records should be updated to:

```text
storageId = <s3-pro-storage-id>
filename = <oldKey>
path = ""
url = ""
```

Do not migrate to this shape:

```text
filename = "a-123.png"
path = "avatars"
```

Otherwise S3 Pro may treat only `a-123.png` as the object key, causing historical files to fail to load.

Use `/` as the separator when generating object keys. Do not use operating-system-specific path separators. If an old path starts with `/`, remove the leading slash.

### Step 5: Move physical files or confirm object location

Traverse all file records, including the built-in `attachments` table and other file collections. Only process records where `storageId = <old-storage-id>`.

If the source is Local Storage, upload the local files to the bucket used by S3 Pro. If the source is already Amazon S3, Aliyun OSS, or Tencent COS, and the new S3 Pro storage points to the same bucket and endpoint, with credentials that can read the same objects, you usually do not need to copy objects. In that case, confirm that the `oldKey` generated in Step 4 is accessible through S3 Pro.

| Source storage engine | Whether files need to be copied | Target object key |
| --- | --- | --- |
| Local Storage | Must be uploaded to the S3 Pro bucket | `join(record.path, record.filename)` |
| Amazon S3 | Usually no copy if reusing the same bucket; copy is needed when changing bucket, account, or region | `join(record.path, record.filename)` |
| Aliyun OSS | Usually no copy if reusing the same bucket; copy is needed when changing bucket, account, or region | `join(record.path, record.filename)` |
| Tencent COS | Usually no copy if reusing the same bucket; copy is needed when changing bucket, account, or region | `join(record.path, record.filename)` |

Files or objects still need to be copied in these cases:

- Migrating from Local Storage to S3 Pro
- Changing bucket, account, region, or cloud provider
- Moving historical objects from a public bucket to a new private bucket
- Renaming object keys or reorganizing directories
- The source bucket policy is not suitable for S3 Pro signed access or direct client upload
- S3 Pro cannot directly access the source objects with the current endpoint and credentials

Before the real migration, run a dry-run. At least output:

- Number of records to migrate
- Total size to migrate
- Number of missing local files or missing source objects
- Number of duplicate object keys
- Number of records with unrecognized `storageId`
- List requiring manual handling

If duplicate object keys appear, do not overwrite directly. Compare file size, ETag, or hash to confirm whether they point to the same file. If they are different files, generate a new key for one record and use that new key when updating the record.

### Step 6: Verify target object accessibility

After files are copied, or after confirming that the source cloud bucket can be reused, run S3 HEAD Object or an equivalent check for every migrated record. Confirm that S3 Pro can access the object through the target object key.

Recommended output:

- Success count
- Missing source file count
- Upload or copy failure count
- Missing target object count
- Duplicate key count
- List requiring manual handling

Do not rely only on the script exit code. Object storage can have partial failures, successful retries, same-key overwrites, or write-only-but-not-readable permission problems. The migration manifest and HEAD Object checks are more reliable.

### Step 7: Update file records

After confirming that all target objects exist, update the file records. Only update records in file collections, keep the original `id`, and do not update many-to-many junction tables generated by attachment fields.

Core fields:

| Field | Value after migration |
| --- | --- |
| `storageId` | New S3 Pro storage ID |
| `filename` | `join(oldPath, oldFilename)` |
| `path` | Empty string |
| `url` | Empty string for private storage; public URL or empty string for public storage |

If S3 Pro is private, `url` must be empty. S3 Pro also clears `url` before saving non-public storage records. File access will dynamically generate a temporary signed URL.

:::warning Hinweis

Batch update records in a transaction if possible, and keep the migration manifest from Step 2 until after the migration is fully verified. Rollback needs that manifest to restore `storageId`, `path`, `filename`, and `url` to their old values.

:::

### Step 8: Switch future uploads to the new storage

After historical records are updated, switch the target storage for new uploads.

Check three types of configuration:

1. Default storage engine: if attachment fields or file collections do not specify storage, uploaded files use the default storage. Set the new S3 Pro storage as the default.
2. Attachment fields: if an attachment field is configured with `options.storage = <old-storage-name>`, change it to the new S3 Pro storage `name`.
3. File collections: if a file collection is configured with the old storage engine, change it to the new S3 Pro storage `name`.

Here, `name` is the storage engine name, not the storage ID. Historical file records use `storageId`.

### Step 9: Restart or refresh storage cache

The file manager caches `storages` configuration. If you update storage configuration through the NocoBase UI or resource API, `reloadStorages` is usually triggered. If you update the database directly, restart the application after migration or make sure the storage cache has been refreshed.

If you directly changed attachment field metadata or file collection metadata, it is also recommended to restart the application so collection configuration, field configuration, and frontend cache all use the new storage.

### Step 10: Sample-check and keep old files

After migration, verify at least these scenarios:

- View, preview, and download historical files in attachment fields
- View, preview, and download historical files in file collections
- Image thumbnails or preprocessing parameters
- Office preview and other features that depend on external services reading file URLs
- Save, preview, download, and delete newly uploaded files
- Object deletion after deleting file records

Do not delete files from the old storage immediately. Keep them until the business side confirms the migration, backup cycles have covered the new state, and access logs show no abnormal behavior.

## Risks

### Data inconsistency during writes

If users can still upload or delete files during migration, objects may be copied after records are deleted, records may be updated while objects remain only in the old storage, or new uploads may not be included in the migration manifest. The default approach is to enter a maintenance window.

### Different object key rules in S3 Pro

After migration, `filename` should store the full object key and `path` should be empty. This differs from the historical record shape of Local Storage and built-in S3 / OSS / COS, and is the easiest place to make mistakes.

### URL accessibility changes

After migrating from public storage to private S3 Pro, historical public URLs may no longer remain valid. NocoBase dynamically generates temporary signed URLs for internal file access, but old URLs already saved in external systems are not automatically rewritten.

If third-party systems, email templates, exported files, or rich text content directly stores old URLs, evaluate a separate replacement strategy.

:::warning Hinweis

If Markdown (Vditor) field content already stores file URLs, handle those contents separately. Private S3 Pro access generates temporary signed URLs that expire, and currently these private links are not supported for long-term storage and use inside Markdown (Vditor) fields.

If these fields must continue referencing files, keep publicly accessible file URLs for now.

:::

### Preview services and private files

Some preview features depend on external services accessing file URLs. Private S3 Pro generates temporary signed URLs, which can usually be accessed, but they are affected by signature expiration, network reachability, bucket permissions, and server-side caching.

If files are very sensitive, reassess whether external preview services should be allowed to read them.

### Direct database changes do not trigger all hooks

If you update `storages`, collection configuration, field configuration, and file records directly through SQL or a custom script, some NocoBase cache refreshes and save hooks are not triggered automatically. Restart the application after the update and verify storage configuration again.

### Delete behavior points to the new storage

After a file record's `storageId` is updated to S3 Pro, deleting that file record later will make NocoBase try to delete the object from the new bucket. Objects in the old storage will not be deleted automatically and need to be cleaned up separately.
