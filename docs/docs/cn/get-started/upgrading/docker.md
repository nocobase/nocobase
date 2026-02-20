# Docker 安装的升级

:::warning 升级前的准备

- 请务必先备份数据库

:::

## 1. 切换到 docker-compose.yml 所在目录

例如

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. 更新 image 版本号

:::tip 版本号说明

- 别名版本号，如 `latest` `latest-full` `beta` `beta-full` `alpha` `alpha-full`，一般不需要修改
- 数字版本号，如 `1.7.14` `1.7.14-full` 需要修改为目标版本号
- 版本号只支持升级，不支持降级！！！
- 生产环境建议固定为具体数字版本，避免无意自动升级。[查看所有版本](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # 推荐使用阿里云镜像（国内网络更稳定）
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:1.7.14-full
    # 也可使用别名版本（可能自动升级，谨慎用于生产）
    # image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    # image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:beta-full
    # Docker Hub（国内可能较慢/失败）
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. 重启容器

```bash
# 拉取最新镜像
docker compose pull app

# 重建容器
docker compose up -d app

# 查看 app 进程的情况
docker compose logs -f app
```

## 4. 第三方插件的升级

参考 [安装与升级插件](../install-upgrade-plugins.mdx)

## 5. 回滚说明

NocoBase 不支持降级，如需回滚，请恢复升级前的数据库备份，并将镜像版本改回原版本。

## 6. 常见问题（FAQ）

**Q：镜像拉取慢或失败**

使用镜像加速，或使用阿里云镜像 `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:<tag>`

**Q：版本未变化**

确认已修改 `image` 为新的版本号，并成功执行了 `docker compose pull app` 与 `up -d app`

**Q：商业插件下载或更新失败**

商业插件请在系统中验证授权码，验证后重启 Docker 容器。详见 [NocoBase 商业授权激活指南](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)。
