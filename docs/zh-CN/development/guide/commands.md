# 命令行

## 简介

NocoBase Server Application 除了用作 WEB 服务器以外，也是个强大可扩展的 CLI 工具。

新建一个 `app.js` 文件，代码如下：

```ts
const Application = require('@nocobase/server');

// 此处省略具体配置
const app = new Application({/*...*/});

app.runAsCLI();
```

以 `runAsCLI()` 方式运行的 app.js 是一个 CLI，在命令行工具就可以像这样操作了：

```bash
node app.js install # 安装
node app.js start # 启动
```

为了更好的开发、构建和部署 NocoBase 应用，NocoBase 内置了许多命令，详情查看 [NocoBase CLI](/api/cli) 章节。

## 自定义 Command

NocoBase CLI 的设计思想与 [Laravel Artisan](https://laravel.com/docs/9.x/artisan) 非常相似，都是可扩展的。NocoBase CLI 基于 [commander](https://www.npmjs.com/package/commander) 实现，可以这样扩展 Command：

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

这个方法定义了以下命令：

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
