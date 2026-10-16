# Aliyun OSS storage

The native `oss` driver uses the official `ali-oss` server SDK over HTTPS with V4 authorization. It supports uploads (including streams), downloads, metadata, existence checks, deletion, copy/move, paginated recursive or directory listings, public URLs, signed upload/download URLs and object ACLs. Existing `fs` and `s3` configuration is unchanged; the AWS default credential chain applies only to S3.

## Configure a disk

Bind a RAM role to the ECS instance and replace the bucket and region below:

```yaml
drive:
  default: oss
  disks:
    oss:
      driver: oss
      region: oss-cn-hangzhou
      bucket: your-bucket
      internal: false
      visibility: private
      supportsACL: false
      timeout: 600000
      credentials:
        provider: aliyun-ecs-ram-role
        # roleName: your-role
```

The role is discovered automatically unless `roleName` is provided. Only hardened metadata mode is supported: the runtime, including containers, must reach `http://100.100.100.200` and obtain a metadata token. A container or ACK deployment does not necessarily have this access; check its network and instance metadata settings. See [ECS instance metadata](https://www.alibabacloud.com/help/en/ecs/user-guide/view-instance-metadata).

Alternatively, replace the entire `credentials` object with long-lived keys. Supply secrets through your deployment configuration; do not commit them:

```yaml
credentials:
  accessKeyId: your-access-key-id
  accessKeySecret: your-access-key-secret
```

Exactly one credentials source is required. Mixing keys with a provider, unknown providers, empty keys or an empty explicit role name fails when the disk is created. There is no fallback. The secret field for OSS is `accessKeySecret`; S3 retains `secretAccessKey`.

For a standalone Host, put the same disk object (the contents of `oss` above) under `host.artifact`; for the releases plugin, use `releases.artifact`. No new environment variable mappings are added.

## Transfer timeout

`timeout` sets the SDK request timeout in milliseconds for OSS operations, including `put`, `putStream`, `get` and `getBytes`. It defaults to `600000` (10 minutes), instead of the SDK default of 60 seconds. Use an integer from `1` to `2147483647`; strings, zero, negative values and fractions are rejected when creating the disk. Choose a larger value for large files or slow connections: uploads and buffered downloads must complete within the request timeout, even while data is flowing. Refreshed clients and disks derived with `bucket()` retain this setting. It does not change signed URL lifetimes or the separate one-second metadata HTTP timeout. Uploads remain single requests; multipart upload is not added.

## Permissions and visibility

Grant `oss:ListObjects` on `acs:oss:*:*:your-bucket` and `oss:GetObject`, `oss:PutObject`, and `oss:DeleteObject` on `acs:oss:*:*:your-bucket/*`, limited to the paths the application needs. Copy requires source read and destination write access; move also requires source deletion. See [OSS RAM policies](https://www.alibabacloud.com/help/en/oss/user-guide/common-examples-of-ram-policies).

The example disables object ACL operations and relies on bucket policy. With `supportsACL: false`, visibility reads return the configured `visibility`, and setting visibility is a no-op. If omitted or `true`, additionally grant `oss:GetObjectAcl`, `oss:PutObjectAcl`, and `oss:GetBucketAcl`. `public` maps to `public-read`, `private` to `private`; inherited object ACLs are resolved through the bucket ACL. Copy preserves source effective visibility unless overridden. A public URL does not grant access to a private object.

Write options support `visibility`, `contentType`, `contentLanguage`, `contentEncoding`, `contentDisposition`, `cacheControl`, and `contentLength`. OSS-specific `meta` and `headers` supply metadata and headers; AWS-specific options are not translated. Copy preserves metadata by default; supplying replacement metadata or content headers follows OSS replacement semantics. Move is copy followed by delete without a transaction; if deletion fails, both objects can remain.

## Network and domains

`region` includes the `oss-` prefix and must match the bucket. With `internal: false` (default), operations and links use `https://your-bucket.oss-cn-hangzhou.aliyuncs.com`. With `internal: true`, both use `https://your-bucket.oss-cn-hangzhou-internal.aliyuncs.com`, requiring access to that region's OSS private network. Internal links cannot be used by external clients.

Optional `domain: https://files.example.com` overrides operation and link hosts, taking priority over `internal`. It must be an HTTPS origin without a path, query or credentials, bound to the selected bucket in OSS with a valid certificate. The SDK signs for that domain directly; hosts are never substituted after signing. When switching buckets at runtime, ensure a custom domain is bound to the new bucket as well, or use another disk. Check [custom domain configuration](https://www.alibabacloud.com/help/en/oss/user-guide/map-custom-domain-names-5) and account/region public endpoint restrictions. Use a public disk or reachable custom domain for external links.

Flydrive retains its existing file-key validation. The OSS adapter encodes keys when building links and copy requests; do not pre-encode keys.

## Refresh and signed links

Instance credentials are held only in memory per driver. Each operation or signature checks the cache, refreshing on demand when at most five minutes remain. Concurrent refreshes share one resolution; the entire credential set is installed into a new SDK client. Failed refreshes fail the operation; the next operation can retry. There is no background polling, persistence or SDK interval-based refresh. Metadata recovery allows three attempts, one second per HTTP request including its body, and 100/200 ms retry delays; a 401 permits at most one token renewal per resolution. Errors exclude response bodies and secrets.

Signed upload/download links default to 30 minutes. `expiresIn` accepts seconds or durations such as `30mins` or `2 hours`; lifetimes are capped at seven days and the signing STS credentials' remaining lifetime, rounded down to seconds. Refreshing does not extend existing links. Download `contentType` and `contentDisposition` override response headers; upload `contentType` must match the client's actual Content-Type. Treat signed URLs as secrets; never log complete URLs or tokens.

Cached operations add no metadata requests. Normal first acquisition takes three (two with an explicit role), refresh takes two (one with an explicit role), and metadata-token renewal adds one. Ordinary file operations take one OSS request; ACL inheritance and copying can add ACL reads, moving adds deletion, and listing/deletion are paginated. Public URL generation is local; signing is local after any needed refresh.

## Verification limits

Automated tests use simulated metadata and OSS transport with the real official SDK request/signing chain, independently verified V4 signatures, credential changes after refresh, operations, streams, pagination, ACL and domains. Real ECS/OSS remains unverified. Before production use, validate file operations and signed uploads/downloads on an ECS instance bound to the intended role, repeat after STS refresh, and check links from their intended network. Record results without credentials or complete signed URLs.
