---
title: "Command 命令行"
description: "NocoBase 服务端自定义命令行：app.command、commander、CLI 扩展、yarn nocobase 子命令。"
keywords: "Command,命令行,app.command,commander,CLI,yarn nocobase,NocoBase"
---

# Command 命令行

在 NocoBase 中，命令（Command）用于在命令行中执行与应用或插件相关的操作——比如运行系统任务、执行迁移、初始化配置，或与正在运行的应用实例交互。你可以为插件定义自定义命令，通过 `app` 对象注册后，在 CLI 中以 `nocobase <command>` 的形式执行。

## 命令类型

在 NocoBase 中，命令的注册方式分为两类：

| 类型 | 注册方式 | 插件是否需要启用 | 典型场景 |
|------|------------|------------------|-----------|
| 动态命令 | `app.command()` | ✅ 是 | 插件业务相关命令 |
| 静态命令 | `Application.registerStaticCommand()` | ❌ 否 | 安装、初始化、维护类命令 |

## 动态命令

使用 `app.command()` 定义插件命令，插件被启用后才能执行。命令文件通常放在插件目录下的 `src/server/commands/*.ts` 中。

### 示例

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
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

其中：

- `app.command('echo')` — 定义一个名为 `echo` 的命令
- `.option('-v, --version')` — 为命令添加选项
- `.action()` — 定义命令执行逻辑
- `app.version.get()` — 获取当前应用版本

### 执行命令

```bash
nocobase echo
nocobase echo -v
```

## 静态命令

使用 `Application.registerStaticCommand()` 注册，静态命令无需启用插件即可执行，适用于安装、初始化、迁移或调试类任务。通常在插件类的 `staticImport()` 方法中注册。

### 示例

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

### 执行命令

```bash
nocobase echo
nocobase echo --version
```

其中：

- `Application.registerStaticCommand()` 会在应用实例化前注册命令
- 静态命令通常用于执行与应用或插件状态无关的全局任务

## Command API

命令对象提供了三个可选的辅助方法，用于控制命令的执行上下文：

| 方法 | 作用 | 示例 |
|------|------|------|
| `ipc()` | 与正在运行的应用实例通信（通过 IPC） | `app.command('reload').ipc().action()` |
| `auth()` | 验证数据库配置是否正确 | `app.command('seed').auth().action()` |
| `preload()` | 预加载应用配置（执行 `app.load()`） | `app.command('sync').preload().action()` |

### 配置说明

- **`ipc()`**
  通常来说，命令会在一个新的应用实例中执行。启用 `ipc()` 后，命令会通过进程间通信（IPC）与当前正在运行的应用实例交互，适合实时操作命令（比如刷新缓存、发送通知）。

- **`auth()`**
  在命令执行前检查数据库配置是否可用。如果数据库配置错误或连接失败，命令不会继续执行。常用于涉及数据库写入或读取的任务。

- **`preload()`**
  在执行命令前预加载应用配置，相当于执行 `app.load()`。适用于依赖配置或插件上下文的命令。

更多 API 方法可以参考 [AppCommand API](../../api/server/app-command.md)。

## 常见示例

### 初始化默认数据

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

### 让运行中实例重新加载缓存（IPC 模式）

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

### 静态注册安装命令

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```

## 相关链接

- [Plugin 插件](./plugin.md) — 插件生命周期与核心 API
- [服务端开发概述](./index.md) — 服务端各模块一览
- [Test 测试](./test.md) — 如何编写服务端插件测试
- [Migration 迁移](./migration.md) — 数据迁移与升级脚本
- [插件开发概述](../index.md) — 插件开发整体介绍
- [AppCommand API](../../api/server/app-command.md) — AppCommand 的完整 API 参考
