---
order: 2
nav:
  path: /
group:
  title: 开发指南
  order: 3
---

# NocoBase CLI

NocoBase CLI 旨在帮助你开发、构建和部署 NocoBase 应用。

<Alert>

NocoBase CLI 支持 ts-node 和 node 两种运行模式

- ts-node 模式（默认）：用于开发环境，支持实时编译，但是响应较慢
- node 模式：用于生产环境，响应迅速，但需要先执行 `yarn nocobase build` 将全部源码进行编译

</Alert>

## 使用说明

```bash
$ yarn nocobase -h

Usage: nocobase [options] [command]

Options:
  -h, --help           display help for command

Commands:
  create-plugin
  console
  db:auth
  db:sync
  install
  start
  build                development only
  clean                development only
  dev                  启动应用，用于开发环境，实时编译
  doc [cmd]            启动文本服务
  test                 development only
  umi                  development only
  upgrade              development only
  help [command]       display help for command
```

## 在脚手架里应用

应用脚手架 `package.json` 里的 `scripts` 如下：

```json
{
  "scripts": {
    "dev": "nocobase dev",
    "start": "nocobase start",
    "clean": "nocobase clean",
    "build": "nocobase build",
    "test": "nocobase test",
    "postinstall": "nocobase umi generate tmp"
  }
}
```

## 命令行扩展

NocoBase CLI 基于 [commander](https://github.com/tj/commander.js) 构建，你可以自由扩展命令，扩展的 command 可以写在 `app/server/index.ts` 里：

```ts
const app = new Application(config);

app.command('hello').action(() => {});
```

或者，写在插件里：

```ts
class MyPlugin extends Plugin {
  beforeLoad() {
    this.app.command('hello').action(() => {});
  }
}
```

终端运行

```bash
$ yarn nocobase hello
```

## 内置命令行

按使用频率排序

### `dev`

开发环境下，启动应用，代码实时编译。

<Alert>
NocoBase 未安装时，会自动安装（参考 install 命令）
</Alert>

```bash
# 启动应用，用于开发环境，实时编译
yarn nocobase dev
# 只启动服务端
yarn nocobase dev --server
# 只启动客户端
yarn nocobase dev --client
```

### `start`

生产环境下，启动应用，代码需要 yarn build。

<Alert>

- NocoBase 未安装时，会自动安装（参考 install 命令）
- 源码有修改时，需要重新打包（参考 build 命令）

</Alert>

```bash
# 启动应用，用于生产环境，
yarn nocobase start
```

### `install`

安装

```bash
# 初次安装
yarn nocobase install
# 安装中文版本
yarn nocobase install --lang=zh-CN
# 初始化账号和密码
yarn nocobase install --admin-email=admin@nocobase.com --admin-pwd=admin123
# 强制重新安装，会删除相关数据表
yarn nocobase install -f # --force
# 清空数据库，并重新安装
yarn nocobase install -c # --clean
```

<Alert>

`-f/--force` 和 `-c/--clean` 的区别
- `-f/--force` 只删除 collections 配置的数据表
- `-c/--clean` 清空数据库，所有数据表都会被删除

</Alert>

### `upgrade`

升级

```bash
yarn nocobase upgrade
```

### `test`

测试

```bash
# 运行所有测试文件
yarn nocobase test
# 运行指定文件夹下所有测试文件
yarn nocobase test packages/core/server
# 运行指定文件里的所有测试
yarn nocobase test packages/core/database/src/__tests__/database.test.ts
```

### `build`

代码部署到生产环境前，需要将源码编译打包，如果代码有修改，也需要重新构建。

```bash
# 所有包
yarn nocobase build
# 指定包
yarn nocobase build app/server app/client
```

### `clean`

删除编译之后的文件

```bash
yarn clean
# 等同于
yarn rimraf -rf packages/*/*/{lib,esm,es,dist}
```

### `doc`

```bash
# 启动文档
yarn doc # 等同于 yarn doc dev
# 构建文档，默认输出到 docs-dist 目录下
yarn doc build
```

### `db:auth`

校验数据库是否连接成功

```bash
$ yarn nocobase db:auth -h

Usage: nocobase db:auth [options]

Options:
  -r, --repeat [repeat]  重连次数
  -h, --help
```

### `db:sync`

通过 collections 配置生成相关数据表和字段

```bash
$ yarn nocobase db:sync -h

Usage: nocobase db:sync [options]

Options:
  -f, --force
  -h, --help   display help for command
```

### `umi`

`app/client` 基于 [umi](https://umijs.org/) 构建，可以通过 `nocobase umi` 来执行其他相关命令。

```bash
# 生成开发环境所需的 .umi 缓存
yarn nocobase umi generate tmp
```

### `help`

帮助命令，也可以用 option 参数，`-h` 和 `--help`

```bash
# 查看所有 cli
yarn nocobase help
# 也可以用 -h
yarn nocobase -h
# 或者 --help
yarn nocobase --help
# 查看 db:sync 命令的 option
yarn nocobase db:sync -h
```
