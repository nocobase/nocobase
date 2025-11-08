
# Event 事件

NocoBase 的服务端（Server）在应用生命周期、插件生命周期以及数据库操作等环节中，都会触发相应的事件（Event）。插件开发者可以通过监听这些事件，实现扩展逻辑、自动化操作或自定义行为。

NocoBase 的事件系统主要分为两个层面：

- **`app.on()` - 应用级事件**：监听应用的生命周期事件，如启动、安装、启用插件等。
- **`db.on()` - 数据库级事件**：监听数据模型层面的操作事件，如创建、更新、删除记录等。


两者都继承自 Node.js 的 `EventEmitter`，支持使用标准的 `.on()`、`.off()`、`.emit()` 接口。NocoBase 还扩展支持了 `emitAsync`，用于异步触发事件并等待所有监听器执行完成。

## 注册事件监听的位置

事件监听一般应在插件的 `beforeLoad()` 方法中进行注册，这样可以保证事件在插件加载阶段就已准备好，后续逻辑能正确响应。

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // 监听应用事件
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase 已启动');
    });

    // 监听数据库事件
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`新帖子：${model.get('title')}`);
      }
    });
  }
}
```

## 监听应用事件 `app.on()`

应用事件用于捕获 NocoBase 应用及插件的生命周期变化，适合做初始化逻辑、资源注册或插件依赖检测等。

### 常见事件类型

| 事件名称 | 触发时机 | 典型用途 |
|-----------|------------|-----------|
| `beforeLoad` / `afterLoad` | 应用加载前 / 后 | 注册资源、初始化配置 |
| `beforeStart` / `afterStart` | 服务启动前 / 后 | 启动任务、打印启动日志 |
| `beforeInstall` / `afterInstall` | 应用安装前 / 后 | 初始化数据、导入模板 |
| `beforeStop` / `afterStop` | 服务停止前 / 后 | 清理资源、保存状态 |
| `beforeDestroy` / `afterDestroy` | 应用销毁前 / 后 | 删除缓存、断开连接 |
| `beforeLoadPlugin` / `afterLoadPlugin` | 插件加载前 / 后 | 修改插件配置或扩展功能 |
| `beforeEnablePlugin` / `afterEnablePlugin` | 插件启用前 / 后 | 检查依赖、初始化插件逻辑 |
| `beforeDisablePlugin` / `afterDisablePlugin` | 插件禁用前 / 后 | 清理插件资源 |
| `afterUpgrade` | 应用升级完成后 | 执行数据迁移或兼容性修复 |

示例：监听应用启动事件

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 NocoBase 服务已启动！');
});
```

示例：监听插件加载事件

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`插件 ${plugin.name} 已加载`);
});
```

## 监听数据库事件 `db.on()`

数据库事件可以捕获模型层的各种数据变更，适合做审计、同步、自动填充等操作。

### 常见事件类型

| 事件名称 | 触发时机 |
|-----------|------------|
| `beforeSync` / `afterSync` | 同步数据库结构前 / 后 |
| `beforeValidate` / `afterValidate` | 数据校验前 / 后 |
| `beforeCreate` / `afterCreate` | 创建记录前 / 后 |
| `beforeUpdate` / `afterUpdate` | 更新记录前 / 后 |
| `beforeSave` / `afterSave` | 保存前 / 后（含创建和更新） |
| `beforeDestroy` / `afterDestroy` | 删除记录前 / 后 |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | 操作包含关联数据后 |
| `beforeDefineCollection` / `afterDefineCollection` | 定义集合前 / 后 |
| `beforeRemoveCollection` / `afterRemoveCollection` | 删除集合前 / 后 |

示例：监听数据创建后事件

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('数据已创建！');
});
```

示例：监听更新数据前事件

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('数据已创建！');
});
```
