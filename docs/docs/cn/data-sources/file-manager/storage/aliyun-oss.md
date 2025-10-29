# 阿里云 OSS

基于阿里云 OSS 的存储引擎，使用前需要准备相关账号和权限。

## 配置参数

![阿里云 OSS 存储引擎配置示例](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=提示}
仅介绍阿里云 OSS 存储引擎的专用参数，通用参数请参考[引擎通用参数](./index.md#引擎通用参数)。
:::

### 区域

填写 OSS 存储的区域，例如：`oss-cn-hangzhou`。

:::info{title=提示}
可以在[阿里云 OSS 控制台](https://oss.console.aliyun.com/)中查看存储空间的区域信息，且只需截取区域前缀部分即可（无需完整域名）。
:::

### AccessKey ID

填写阿里云授权访问密钥的 ID。

### AccessKey Secret

填写阿里云授权访问密钥的 Secret。

### 存储桶

填写 OSS 存储的存储桶名称。
