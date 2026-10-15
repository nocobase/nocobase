# 阿里云 OSS 存储

原生 `oss` 驱动使用官方服务端 SDK `ali-oss`，通过 HTTPS 和 V4 签名访问 OSS，支持上传（含流）、下载、元数据、存在判断、删除、复制和移动、分页递归或目录列表、公开链接、上传和下载签名链接及对象 ACL。现有 `fs`、`s3` 配置不变；AWS 默认凭证链仅用于 S3。

## 配置磁盘

给 ECS 实例绑定 RAM 角色，将 bucket 和地域替换为实际值：

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
      credentials:
        provider: aliyun-ecs-ram-role
        # roleName: your-role
```

未设置 `roleName` 时自动发现角色名。仅支持元数据加固模式：运行环境（包括容器）必须能够访问 `http://100.100.100.200` 并获取元数据 token。容器或 ACK 部署不一定具备此条件，请检查网络和实例元数据设置，参见 [ECS 实例元数据](https://www.alibabacloud.com/help/en/ecs/user-guide/view-instance-metadata)。

也可以将整个 `credentials` 对象替换为长期密钥。通过部署配置机制注入秘密，不要提交到仓库：

```yaml
credentials:
  accessKeyId: your-access-key-id
  accessKeySecret: your-access-key-secret
```

凭证来源必须二选一；混用密钥与 provider、未知 provider、空密钥、显式空角色名都会在创建磁盘时报错，不回退其他来源。OSS 的密钥字段是 `accessKeySecret`，S3 保留 `secretAccessKey`。

独立 Host 将同一磁盘对象（上述 `oss` 内的内容）放在 `host.artifact`；发布插件放在 `releases.artifact`。本次不增加环境变量映射。

## 权限和可见性

授予 bucket 资源 `acs:oss:*:*:your-bucket` 的 `oss:ListObjects`，以及对象资源 `acs:oss:*:*:your-bucket/*` 的 `oss:GetObject`、`oss:PutObject`、`oss:DeleteObject`，按实际路径限制范围。复制需要读源对象和写目标对象，移动还需要删除源对象。参见 [OSS RAM 策略](https://www.alibabacloud.com/help/en/oss/user-guide/common-examples-of-ram-policies)。

示例关闭对象 ACL 操作，由 bucket 策略控制访问。`supportsACL: false` 时读取可见性返回配置的 `visibility`，设置可见性为空操作；省略或为 `true` 时，还需 `oss:GetObjectAcl`、`oss:PutObjectAcl`、`oss:GetBucketAcl`。`public` 对应 `public-read`，`private` 对应 `private`；对象继承 ACL 时读取 bucket ACL。复制默认保留源对象实际可见性，可以显式覆盖。公开链接不会授予私有对象访问权限。

写入支持 `visibility`、`contentType`、`contentLanguage`、`contentEncoding`、`contentDisposition`、`cacheControl`、`contentLength`；OSS 专用 `meta` 和 `headers` 可传元数据和请求头，不翻译 AWS 专用选项。复制默认保留元数据；传替换元数据或内容头时遵循 OSS 替换语义。移动先复制再删除，没有事务；删除失败时可能同时保留两个对象。

## 网络和域名

`region` 包含 `oss-` 前缀，必须与 bucket 一致。默认 `internal: false`，操作和链接都使用 `https://your-bucket.oss-cn-hangzhou.aliyuncs.com`。`internal: true` 时两者都使用 `https://your-bucket.oss-cn-hangzhou-internal.aliyuncs.com`，需要访问该地域 OSS 内网；内网链接不能给外网客户端使用。

可选 `domain: https://files.example.com` 同时覆盖操作和链接主机名，优先于 `internal`。它必须是无路径、查询参数、用户凭证的 HTTPS 源地址，已在 OSS 绑定到选定 bucket，并有有效证书。SDK 直接对该域名签名，不在签名后替换主机名。运行时切换 bucket 时需确认自定义域名也绑定到新 bucket，或另配磁盘。参见 [自定义域名配置](https://www.alibabacloud.com/help/en/oss/user-guide/map-custom-domain-names-5)，并核对账号和地域的公网端点限制。外网链接需求应使用公网磁盘或可达自定义域名。

Flydrive 保留原有文件 key 校验。OSS 适配器生成链接和复制请求时会编码 key，请勿提前编码。

## 刷新和签名链接

每个 driver 仅在内存保存实例凭证。操作和签名前检查缓存，剩余不超过五分钟时按需刷新；并发刷新合并，整组凭证成功获取后创建新 SDK client。刷新失败则当前操作失败，下次可重试。没有后台轮询、持久化或 SDK 固定间隔刷新。元数据解析最多三轮，每次 HTTP（含响应体）超时一秒，重试间隔为 100/200 毫秒；每次解析遇到 401 最多重取一次 token。错误不携带响应体或秘密。

上传、下载签名链接默认有效期为 30 分钟。`expiresIn` 支持秒数或 `30mins`、`2 hours` 等时长，实际取请求值、七天和当前 STS 剩余寿命的最小值，向下取整为秒。刷新不会延长旧链接。下载的 `contentType`、`contentDisposition` 覆盖响应头；上传的 `contentType` 必须与客户端实际 Content-Type 一致。签名链接视为秘密，不要记录完整链接或 token。

缓存命中不增加元数据请求。首次通常三次（显式角色两次），刷新两次（显式角色一次），token 更新额外一次。普通文件操作通常一次 OSS 请求；ACL 继承和复制可能增加 ACL 查询，移动多一次删除，列表和批量删除按页请求。公开链接本地生成；签名前必要时刷新，其余计算在本地完成。

## 验证限制

自动化测试使用模拟元数据和 OSS 传输层，经过真实官方 SDK 请求与签名链路，独立重算 V4 签名，覆盖刷新后的凭证切换、文件操作、流、分页、ACL 和域名。尚未在真实 ECS/OSS 验证。生产启用前，请用绑定目标角色的 ECS 验证文件操作和上传、下载签名链接，跨 STS 刷新后重复验证，并从目标网络检查链接。记录结果时不要包含凭证或完整签名链接。
