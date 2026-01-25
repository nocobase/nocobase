# 本地存储

上传文件将保存在服务器本地硬盘目录中，适用于系统管理的上传文件总量较少或试验性的场景。

## 配置参数

![文件存储引擎配置示例](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=提示}
仅介绍本地存储引擎的专用参数，通用参数请参考[引擎通用参数](./index.md#引擎通用参数)。
:::

### 路径

同时表达文件存储在服务器上的相对路径和 URL 访问路径。如：“`user/avatar`”（无需开头和结尾的“`/`”），代表了：

1. 上传文件时存储在服务器上的相对路径：`/path/to/nocobase-app/storage/uploads/user/avatar`。
2. 访问时的 URL 地址前缀：`http://localhost:13000/storage/uploads/user/avatar`。
