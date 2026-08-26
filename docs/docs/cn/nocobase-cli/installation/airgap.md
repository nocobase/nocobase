# 内网安装

如果你的服务器无法访问公网，安装方式就要提前准备好离线所需的镜像、依赖和插件包。默认推荐先用 Docker 方式，路径最短，也最容易复现。

## 默认推荐：离线准备 Docker 镜像

在一台可以访问公网的机器上，先把应用镜像和数据库镜像拉下来：

```bash
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

然后导出为离线文件：

```bash
docker save -o nocobase-app.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full

docker save -o nocobase-postgres.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

如果你还需要商业插件，也建议在外网环境先准备好插件包，再一起带入内网。

## 把文件拷贝到内网服务器

至少准备这些文件：

- `nocobase-app.tar`
- `nocobase-postgres.tar`
- `docker-compose.yml`
- `.env` 或你自己的部署说明

## 在内网服务器导入镜像

```bash
docker load -i nocobase-app.tar
docker load -i nocobase-postgres.tar
```

## 启动应用

准备好 `docker-compose.yml` 后，直接启动：

```bash
docker compose up -d
docker compose logs -f app
```

如果你还没写 compose 文件，先看 [通过 Docker Compose 安装](./docker-compose.md)，把里面的示例保存到本地即可。

## 不能使用 Docker 怎么办

如果你的内网环境不能使用 Docker，也可以在外网环境先用 `create-nocobase-app` 创建完整项目、安装依赖并打包，再把整个项目拷贝到内网服务器。

这条路径会更长，不过在没有容器能力的环境里更实用。整体流程通常是：

1. 在外网环境创建项目并安装依赖。
2. 把项目目录打包。
3. 拷贝到内网服务器。
4. 在内网解压、补齐 `.env` 后启动应用。

## 下一步去哪里看

- 如果你还没确认应用配置，继续看 [应用环境变量](./env.md)
- 如果你准备把应用正式开放给业务用户，继续看 [Nginx](../production/reverse-proxy/nginx.md) 或 [Caddy](../production/reverse-proxy/caddy.md)
