# Git 源码安装

## 0. 先决条件

请确保你已经：

- 安装了 Git、Node.js 20+、Yarn 1.22.x
- 配置并启动了所需数据库 MySQL 8.0.17+、MariaDB 10.9+、PostgreSQL 10+ 任选其一

## 1. 将 NocoBase 下载到本地

### latest 版本 (`main`)

功能稳定，测试较为完善的版本，仅做缺陷修复。推荐安装此版本。

```bash
git clone https://github.com/nocobase/nocobase.git -b main --depth=1 my-nocobase
```

### beta 版本 (`next`)

包含即将发布的新功能，经过初步测试的版本，可能存在部分已知或未知问题。

```bash
git clone https://github.com/nocobase/nocobase.git -b next --depth=1 my-nocobase
```

### alpha 版本 (`develop`)

包含即将发布的新功能，经过初步测试的版本，可能存在部分已知或未知问题。

```bash
git clone https://github.com/nocobase/nocobase.git -b develop --depth=1 my-nocobase
```

## 2. 切换目录

```bash
cd my-nocobase
```

## 3. 安装依赖

由于国内网络环境的原因，强烈建议你更换国内镜像。

```bash
$ yarn config set disable-self-update-check true
$ yarn config set registry https://registry.npmmirror.com/
```

📢 由于网络环境、系统配置等因素影响，接下来这一步骤可能需要十几分钟时间。

```bash
yarn install --frozen-lockfile
```

## 4. 设置环境变量

NocoBase 所需的环境变量储存在根目录 `.env` 文件里，根据实际情况修改环境变量，如果你不知道怎么改，[点此查看环境变量说明](../env.md)，也可以保持默认。

```bash
TZ=Asia/Shanghai
APP_KEY=your-secret-key
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=postgres
DB_USER=nocobase
DB_PASSWORD=nocobase
```

:::warning

- `TZ` 用于设置应用的时区，默认为操作系统时区；
- `APP_KEY` 是应用的密钥，用于生成用户 token 等（如果 APP_KEY 修改了，旧的 token 也会随之失效）。它可以是任意随机字符串。请修改为自己的秘钥，并确保不对外泄露；
- `DB_*` 为数据库相关，如果不是例子默认的数据库服务，请根据实际情况修改。

:::

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
# 编译（请确保已执行 `yarn install --frozen-lockfile`）
yarn build
# 启动
yarn start
```

## 7. 登录 NocoBase

使用浏览器打开 [http://localhost:13000](http://localhost:13000) 初始化账号和密码是 `admin@nocobase.com` 和 `admin123`。
