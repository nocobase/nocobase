# `create-nocobase-app` 安装的升级

<Alert>
v0.12 之后的版本，通过 create-nocobase-app 安装的应用不再有 packages/app 目录了，在 packages/app 里自定义的代码，需要移至自定义插件中。
</Alert>

## 版本升级

v0.12 之后的版本，应用的升级直接执行 `yarn nocobase upgrade` 升级命令即可

```bash
# 切换到对应的目录
cd my-nocobase-app
# 执行更新命令
yarn nocobase upgrade
# 启动
yarn dev
```

如果升级存在问题，也可以[重新创建新应用](/welcome/getting-started/installation/create-nocobase-app)，并参考旧版本的 .env 修改环境变量。数据库信息需要配置正确，使用 SQLite 数据库时，需要将数据库文件复制到 `./storage/db/` 目录。最后再执行 `yarn nocobase upgrade` 进行升级。
