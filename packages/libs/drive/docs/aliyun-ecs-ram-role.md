# File storage (S3 / Aliyun OSS)

Applications running on Aliyun ECS can use the instance's RAM role for OSS without storing access keys in `config.yml`. Bind a RAM role to the ECS instance and allow `oss:ListObjects` on the target bucket and `oss:GetObject`, `oss:PutObject`, and `oss:DeleteObject` on its objects. If ACL operations are enabled, also allow `oss:GetObjectAcl` and `oss:PutObjectAcl`.

Add the following Drive configuration, replacing the bucket and region with your own:

```yaml
drive:
  default: oss
  disks:
    oss:
      driver: s3
      bucket: your-bucket
      region: cn-hangzhou
      endpoint: https://s3.oss-cn-hangzhou.aliyuncs.com
      forcePathStyle: false
      supportsACL: false
      visibility: private
      credentials:
        provider: aliyun-ecs-ram-role
```

The role name is discovered automatically. To select it explicitly, add `roleName: your-role` under `credentials`. The provider uses only the hardened metadata mode: the runtime, including a container, must reach `http://100.100.100.200` and obtain a metadata token. A container or ACK deployment does not necessarily have this access; check its network and instance metadata settings. See [ECS instance metadata](https://www.alibabacloud.com/help/en/ecs/user-guide/view-instance-metadata).

Use the S3-compatible OSS endpoint, with the same region as the bucket. The example uses virtual-host addressing (`your-bucket.s3.oss-cn-hangzhou.aliyuncs.com`). For access within the same region's private network, use `https://s3.oss-cn-hangzhou-internal.aliyuncs.com`. The endpoint must also be reachable by clients using signed URLs; internal URLs are unsuitable for external clients. Before using public endpoints, check the account and region's domain restrictions in [Alibaba Cloud's AWS SDK access guide](https://www.alibabacloud.com/help/en/oss/developer-reference/use-aws-sdks-to-access-oss), including the custom-domain requirement for affected mainland China accounts.

The example disables object ACL operations and relies on bucket policies for access control. For a standalone Host, put the same disk object (the contents of `oss` above) under `host.artifact`; for the releases plugin, use `releases.artifact`.

The AWS SDK caches temporary credentials and refreshes them on demand near expiration; no background task is needed. A signed upload or download URL stops working when its signing credentials expire, even if its configured URL lifetime is longer. Refreshing credentials does not extend an existing URL's lifetime. Existing static access-key configurations and the AWS default credential chain remain available when no provider is specified; an unsupported or empty provider fails when the disk is created.
