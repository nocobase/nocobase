# 文件存储（S3 / 阿里云 OSS）

部署在阿里云 ECS 上的应用可以使用实例 RAM 角色访问 OSS，无需在 `config.yml` 保存密钥。先为 ECS 绑定 RAM 角色，授予目标 bucket 的 `oss:ListObjects` 权限及其对象的 `oss:GetObject`、`oss:PutObject`、`oss:DeleteObject` 权限。启用 ACL 操作时，还需授予 `oss:GetObjectAcl` 和 `oss:PutObjectAcl`。

添加以下 Drive 配置，将 bucket 和地域替换为实际值：

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

默认自动发现实例角色名；如需显式指定，在 `credentials` 下添加 `roleName: your-role`。提供器只使用加固元数据模式，运行环境（包括容器）必须能访问 `http://100.100.100.200` 并取得元数据 token。容器或 ACK 部署不一定天然具备访问能力，请检查网络和实例元数据设置。参见 [ECS 实例元数据说明](https://www.alibabacloud.com/help/en/ecs/user-guide/view-instance-metadata)。

使用 OSS 的 S3 兼容 endpoint，region 与 bucket 所在地域一致。示例采用虚拟主机寻址（`your-bucket.s3.oss-cn-hangzhou.aliyuncs.com`）。同地域内网访问可使用 `https://s3.oss-cn-hangzhou-internal.aliyuncs.com`。使用签名链接的客户端也必须能访问该 endpoint，内网链接不适用于外网客户端。使用公网 endpoint 前，请核对账号和地域的域名限制，尤其是受影响中国内地账号的自定义域名要求，参见[阿里云 AWS SDK 接入说明](https://www.alibabacloud.com/help/en/oss/developer-reference/use-aws-sdks-to-access-oss)。

示例关闭对象 ACL 操作，由 bucket 策略控制访问。独立 Host 将相同磁盘对象（上方 `oss` 的内容）放在 `host.artifact`；发布插件使用 `releases.artifact`。

AWS SDK 缓存临时凭证，在临近到期时按需刷新，无需后台任务。上传、下载签名链接的实际有效期不超过签发时凭证的有效期，即使配置的链接有效期更长；刷新凭证也不会延长已有链接的寿命。未指定 provider 时，原有静态密钥配置及 AWS 默认凭证链行为保持不变；指定未知或空 provider 时，创建磁盘会报错。
