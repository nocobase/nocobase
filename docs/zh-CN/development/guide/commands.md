# 命令行

## 基础概念

一些时候，我们不希望启动应用的进程，但又需要使用到应用的部分程序功能时，可以通过扩展命令行工具来处理对应的功能。

Nocobase 内置了命令行工具，应用进程大部分时候通过命令行启动，同时内部基于 npm 包 [Commander](https://www.npmjs.com/package/commander) 支持扩展更多的子命令。大部分 NocoBase 自身提供的命令也通过此方法定义。

### 扩展命令

使用 `app.command()` 接口定义子命令，之后可以链式调用标准的 Commander 包的命令定义方法：

```ts
app
  .command('echo')
  .option('-v, --version');
  .action(async ([options]) => {
    console.log('Hello World!');
    if (options.version) {
      console.log('Current version:', app.getVersion());
    }
  });
```

这个方法定义了以下的子命令：

```bash
yarn nocobase echo
# Hello World!
yarn nocobase echo -v
# Hello World!
# Current version: 0.7.4-alpha.7
```

更多 API 细节可参考 [Application.command()](/api/server/application#command) 部分。

## 示例

### 定义导出数据表的命令

如果我们希望把应用的数据表中的数据导出成 JSON 文件，可以定义一个如下的子命令：

```ts
import path from 'path';
import * as fs from 'fs/promises';

class MyPlugin extends Plugin {
  load() {
    this.app
      .command('export')
      .option('-o, --output-dir')
      .action(async (options, ...collections) => {
        const { outputDir = path.join(process.env.PWD, 'storage') } = options;
        await collections.reduce((promise, collection) => promise.then(async () => {
          if (!this.db.hasCollection(collection)) {
            console.warn('No such collection:', collection);
            return;
          }

          const repo = this.db.getRepository(collection);
          const data = repo.find();
          await fs.writeFile(path.join(outputDir, `${collection}.json`), JSON.stringify(data), { mode: 0o644 });
        }), Promise.resolve());
      });
  }
}
```

注册和激活插件之后在命令行调用：

```bash
mkdir -p ./storage/backups
yarn nocobase export -o ./storage/backups users
```

执行后会生成 `./storage/backups/users.json` 文件包含数据表中的数据。

## 小结

本章所涉及示例代码整合在 [packages/samples/command](https://github.com/nocobase/nocobase/tree/main/packages/samples/command) 包中，可以直接在本地运行，查看效果。
