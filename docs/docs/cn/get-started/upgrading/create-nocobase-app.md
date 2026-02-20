# create-nocobase-app 安装的升级

:::warning 升级前的准备

- 请务必先备份数据库
- 停止运行中的 NocoBase

:::

## 1. 停止运行中的 NocoBase

如果是非后台运行的进程，通过 `Ctrl + C` 停止，生产环境执行 `pm2-stop` 命令来停止。

```bash
yarn nocobase pm2-stop
```

## 2. 执行升级命令

直接执行 `yarn nocobase upgrade` 升级命令即可

```bash
# 切换到对应的目录
cd my-nocobase-app
# 执行更新命令
yarn nocobase upgrade
# 启动
yarn dev
```

### 升级到指定版本

修改项目根目录的 `package.json` 文件，修改 `@nocobase/cli` 和 `@nocobase/devtools` 的版本号即可（只能升级不能降级）。如：

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

然后执行升级命令

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```
