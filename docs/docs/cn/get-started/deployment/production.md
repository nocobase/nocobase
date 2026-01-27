# 生产环境部署

在生产环境中部署 NocoBase 时，由于不同系统和环境的构建方式存在差异，安装依赖可能较为繁琐。为获得完整功能体验，我们推荐使用 **Docker** 进行部署。如果系统环境无法使用 Docker，也可以使用 **create-nocobase-app** 进行部署。

:::warning

不建议直接在生产环境中使用源码部署。源码依赖较多、体积庞大，且全量编译对 CPU 和内存要求较高。如果确实需要使用源码部署，建议先构建自定义 Docker 镜像，再进行部署。

:::

## 部署流程

生产环境的部署可参考已有的安装和升级步骤。

### 全新安装

- [Docker 安装](../installation/docker.mdx)
- [create-nocobase-app 安装](../installation/create-nocobase-app.mdx)

### 升级应用

- [Docker 安装的升级](../installation/docker.mdx)
- [create-nocobase-app 安装的升级](../installation/create-nocobase-app.mdx)

### 第三方插件的安装与升级

- [安装与升级插件](../install-upgrade-plugins.mdx)

## 静态资源代理

在生产环境中，建议将静态资源交由代理服务器管理，例如：

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## 常用运维命令

根据不同的安装方式，可以使用以下命令管理 NocoBase 进程：

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)
