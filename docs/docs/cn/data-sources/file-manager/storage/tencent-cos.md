# 腾讯云 COS

基于腾讯云 COS 的存储引擎，使用前需要准备相关账号和权限。

## 配置参数

![腾讯 COS 存储引擎配置示例](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=提示}
仅介绍腾讯云 COS 存储引擎的专用参数，通用参数请参考[引擎通用参数](./index.md#引擎通用参数)。
:::

### 区域

填写 COS 存储的区域，例如：`ap-chengdu`。

:::info{title=提示}
可以在[腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)中查看存储空间的区域信息，且只需截取区域前缀部分即可（无需完整域名）。
:::

### SecretId

填写腾讯云授权访问密钥的 ID。

### SecretKey

填写腾讯云授权访问密钥的 Secret。

### 存储桶

填写 COS 存储的存储桶名称，例如：`qing-cdn-1234189398`。
