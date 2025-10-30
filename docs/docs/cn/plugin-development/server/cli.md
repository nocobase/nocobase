# 命令行

在插件里，自定义的命令必须放在插件的 `src/server/commands/*.ts` 目录下，内容如下：

```ts
import { Application } from '@nocobase/server';

export default function(app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

:::warning
插件自定义的命令行必须在插件安装激活之后才有效
:::

Command 的特殊配置

- `ipc()` 当 app 运行时，命令行通过 ipc 发送指令，操作正在运行的 app 实例，未配置 ipc() 时，会新建一个应用实例，再执行操作（不会干扰正在运行的 app 实例）
- `auth()` 进行数据库检验，如果数据库配置不正确，不会执行该命令
- `preload()` 是否预先加载应用配置，也就是执行 app.load()

可以根据命令的实际用途进行配置，例子如下：

```ts
app.command('a').ipc().action()
app.command('a').auth().action()
app.command('a').preload().action()
```
