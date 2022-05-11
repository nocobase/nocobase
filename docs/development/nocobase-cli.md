---
order: 2
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
  console
  db:auth
  db:sync
  install
  start
  build                development only
  clean                development only
  dev                  development only
  doc [cmd]            development only
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

NocoBase CLI 基于 commander 构建，你可以将扩展的 command 写在 `app/server/index.ts` 里：

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

## 内置命令行

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

### `install`

### `start`

### `build`

### `clean`

### `dev`

### `doc`

### `test`

### `umi`

### `upgrade`

### `help`

