# `create-nocobase-app` 安装的升级

## 小版本升级

执行 `nocobase upgrade` 升级命令即可

```bash
# 切换到对应的目录
cd my-nocobase-app
# 执行更新命令
yarn nocobase upgrade
# 启动
yarn dev
```

## 大版本升级

如果小版本升级失效，也可以采用此升级办法。

### 1. 创建新的 NocoBase 项目

```bash
# SQLite
yarn create nocobase-app my-nocobase-app -d sqlite
# MySQL
yarn create nocobase-app my-nocobase-app -d mysql
# PostgreSQL
yarn create nocobase-app my-nocobase-app -d postgres
```

### 2. 切换目录

```bash
cd my-nocobase-app
```

### 3. 安装依赖

📢 由于网络环境、系统配置等因素影响，接下来这一步骤可能需要十几分钟时间。  

```bash
yarn install
```

### 4. 修改 .env 配置

参考旧版本的 .env 修改，数据库信息需要配置正确。SQLite 数据库也需要将数据库文件复制到 `./storage/db/` 目录。

### 5. 旧代码迁移（非必须）

业务代码参考新版插件开发教程和 API 参考进行修改。

### 6. 执行升级命令

代码已经是最新版了，所以 upgrade 时需要跳过代码更新 `--skip-code-update`。

```bash
yarn nocobase upgrade --skip-code-update
```

### 7. 启动 NocoBase

开发环境

```bash
yarn dev
```

生产环境

```bash
yarn start # 暂不支持在 win 平台下运行
```

注：生产环境，如果代码有修改，需要执行 `yarn build`，再重新启动 NocoBase。
