# Git 源码安装

## 0. 先决条件

请确保你已经：

- 安装了 Git、Node.js 14+、Yarn 1.22.x
- 配置并启动了所需数据库 SQLite 3.x、MySQL 8.x、PostgreSQL 10.x 任选其一

## 1. 将 NocoBase 下载到本地

```bash
git clone https://github.com/nocobase/nocobase.git my-nocobase-app
```

## 2. 切换目录

```bash
cd my-nocobase-app
```

## 3. 安装依赖

📢 由于网络环境、系统配置等因素影响，接下来这一步骤可能需要十几分钟时间。  

```bash
yarn install
```

## 4. 设置环境变量

NocoBase 所需的环境变量储存在根目录 `.env` 文件里，根据实际情况修改环境变量，如果你不知道怎么改，[点此查看环境变量说明](../../development/env.md)，也可以保持默认。

```bash
# 使用 sqlite 数据库
DB_DIALECT=sqlite
# sqlite 文件地址
DB_STORAGE=storage/db/nocobase.sqlite
```

## 5. 安装 NocoBase

```bash
yarn nocobase install --lang=zh-CN
```

## 6. 启动 NocoBase

开发环境

```bash
yarn dev
```

生产环境

```bash
# 编译
yarn build
# 启动
yarn start # 暂不支持在 win 平台下运行
```

## 7. 登录 NocoBase

使用浏览器打开 http://localhost:13000/ 初始化账号和密码是 `admin@nocobase.com` 和 `admin123`。
