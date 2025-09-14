# NocoBase 插件 API 参考

本文档详细介绍了 NocoBase 插件开发中可用的核心 API。

## 1. Plugin 基类

所有插件都必须继承自 `Plugin` 基类。

### 1.1 构造函数

```typescript
constructor(app: Application, options: PluginOptions)
```

### 1.2 生命周期方法

#### beforeLoad()

在插件加载前执行，用于初始化配置。

```typescript
class MyPlugin extends Plugin {
  beforeLoad() {
    // 初始化配置
    this.app.logger.info('Plugin initializing');
  }
}
```

#### load()

插件加载时执行的主要逻辑。

```typescript
class MyPlugin extends Plugin {
  async load() {
    // 注册资源、中间件等
    this.app.resource({ /* ... */ });
  }
}
```

#### install(options)

插件安装时执行的初始化逻辑。

```typescript
class MyPlugin extends Plugin {
  async install(options: InstallOptions) {
    // 初始化数据、创建默认配置等
  }
}
```

#### disable()

插件禁用时执行的清理逻辑。

```typescript
class MyPlugin extends Plugin {
  async disable() {
    // 清理资源、删除临时数据等
  }
}
```

## 2. Application 对象

通过 `this.app` 访问应用实例。

### 2.1 核心属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `db` | Database | 数据库实例 |
| `acl` | ACL | 访问控制列表 |
| `resourceManager` | Resourcer | 资源管理器 |
| `middleware` | MiddlewareManager | 中间件管理器 |
| `logger` | Logger | 日志记录器 |

### 2.2 核心方法

#### resource()

注册资源。

```typescript
this.app.resource({
  name: string,
  actions?: Record<string, ActionHandler>,
  middlewares?: Middleware[],
})
```

#### middleware.register()

注册中间件。

```typescript
this.app.middleware.register(middleware: Middleware)
```

#### acl.allow()

设置访问权限。

```typescript
this.app.acl.allow(
  resourceName: string,
  actionName: string,
  condition?: string | Function
)
```

## 3. 数据库 API

通过 `this.app.db` 访问数据库实例。

### 3.1 collection()

定义数据表。

```typescript
this.app.db.collection(options: CollectionOptions)
```

### 3.2 getRepository()

获取数据仓库。

```typescript
const repository = this.app.db.getRepository(collectionName: string)
```

### 3.3 registerModels()

注册数据模型。

```typescript
this.app.db.registerModels(models: Record<string, ModelCtor>)
```

### 3.4 registerRepositories()

注册数据仓库。

```typescript
this.app.db.registerRepositories(repositories: Record<string, RepositoryCtor>)
```

## 4. 资源管理器 API

通过 `this.app.resourceManager` 访问资源管理器。

### 4.1 use()

为资源添加中间件。

```typescript
this.app.resourceManager.use(
  resourceName: string,
  middleware: Middleware
)
```

### 4.2 define()

定义资源。

```typescript
this.app.resourceManager.define(options: ResourceOptions)
```

## 5. 访问控制 API

通过 `this.app.acl` 访问访问控制列表。

### 5.1 allow()

允许访问资源。

```typescript
this.app.acl.allow(
  resourceName: string,
  actionName: string,
  condition?: string | Function
)
```

### 5.2 define()

定义策略。

```typescript
this.app.acl.define(
  name: string,
  handler: Function
)
```

## 6. 中间件管理器 API

通过 `this.app.middleware` 访问中间件管理器。

### 6.1 register()

注册中间件。

```typescript
this.app.middleware.register(middleware: Middleware)
```

## 7. 客户端 API

### 7.1 addComponents()

添加组件。

```typescript
this.app.addComponents(components: Record<string, ComponentType>)
```

### 7.2 schemaInitializerManager.addItem()

添加 Schema 初始化器。

```typescript
this.app.schemaInitializerManager.addItem(
  initializerName: string,
  key: string,
  item: SchemaInitializerItem
)
```

### 7.3 pluginSettingsManager.add()

添加插件设置。

```typescript
this.app.pluginSettingsManager.add(
  name: string,
  options: PluginSettingsOptions
)
```

### 7.4 router.add()

添加路由。

```typescript
this.app.router.add(
  name: string,
  options: RouteOptions
)
```

### 7.5 i18n.addResources()

添加国际化资源。

```typescript
this.app.i18n.addResources(
  lang: string,
  namespace: string,
  resources: Record<string, string>
)
```

## 8. 工作流 API

### 8.1 registerInstruction()

注册工作流指令。

```typescript
this.app.workflow.registerInstruction(
  type: string,
  instruction: InstructionClass
)
```

### 8.2 registerInstructionComponent()

注册工作流指令组件。

```typescript
this.app.workflow.registerInstructionComponent(
  type: string,
  component: ComponentType
)
```

## 9. 日志 API

通过 `this.app.logger` 访问日志记录器。

### 9.1 info()

记录信息日志。

```typescript
this.app.logger.info(message: string, meta?: any)
```

### 9.2 error()

记录错误日志。

```typescript
this.app.logger.error(message: string, meta?: any)
```

### 9.3 warn()

记录警告日志。

```typescript
this.app.logger.warn(message: string, meta?: any)
```

### 9.4 debug()

记录调试日志。

```typescript
this.app.logger.debug(message: string, meta?: any)
```

## 10. 定时任务 API

通过 `this.app.schedule` 访问定时任务管理器。

### 10.1 register()

注册定时任务。

```typescript
this.app.schedule.register(
  name: string,
  cron: string,
  handler: Function
)
```

## 11. 事件系统 API

### 11.1 emit()

触发事件。

```typescript
this.app.emit(eventName: string, data?: any)
```

### 11.2 on()

监听事件。

```typescript
this.app.on(eventName: string, handler: Function)
```

### 11.3 off()

移除事件监听。

```typescript
this.app.off(eventName: string, handler: Function)
```

## 12. 插件管理器 API

通过 `this.app.pm` 访问插件管理器。

### 12.1 add()

添加插件。

```typescript
this.app.pm.add(plugin: Plugin)
```

### 12.2 get()

获取插件。

```typescript
const plugin = this.app.pm.get(pluginName: string)
```

## 13. 客户端 Hooks

### 13.1 useCollectionRecord()

获取当前记录。

```typescript
const record = useCollectionRecord()
```

### 13.2 useRecord()

获取记录数据。

```typescript
const { data, loading, error, refresh } = useRecord()
```

### 13.3 useActionContext()

获取操作上下文。

```typescript
const { setVisible, setSubmitted } = useActionContext()
```

### 13.4 useRequest()

发起请求。

```typescript
const { data, loading, error, run } = useRequest(options)
```

## 14. Schema 设置 API

### 14.1 SchemaSettings

创建 Schema 设置。

```typescript
const settings = new SchemaSettings({
  name: string,
  items: SchemaSettingsItem[]
})
```

### 14.2 schemaSettingsManager.add()

添加 Schema 设置。

```typescript
this.app.schemaSettingsManager.add(settings: SchemaSettings)
```

## 15. 插件设置 API

### 15.1 pluginSettingsManager.add()

添加插件设置。

```typescript
this.app.pluginSettingsManager.add(
  name: string,
  options: {
    title: string,
    icon: string,
    Component: ComponentType,
    sort?: number
  }
)
```

## 16. 错误处理 API

### 16.1 CustomError

自定义错误类。

```typescript
import { CustomError } from '@nocobase/errors';

throw new CustomError(
  code: string,
  message: string,
  status: number
)
```

## 17. 验证器 API

### 17.1 validators.register()

注册自定义验证器。

```typescript
this.app.db.validators.register(
  name: string,
  validator: Function
)
```

## 18. 最佳实践

### 18.1 类型安全

使用 TypeScript 提供的类型定义：

```typescript
import { Plugin } from '@nocobase/server';
import { CollectionOptions } from '@nocobase/database';

class MyPlugin extends Plugin {
  async load() {
    // 利用类型推断
    this.app.db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
          required: true,
        }
      ]
    } as CollectionOptions);
  }
}
```

### 18.2 错误处理

始终正确处理异步操作中的错误：

```typescript
class MyPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async create(ctx, next) {
          try {
            await next();
          } catch (error) {
            this.app.logger.error('创建文章失败', { error });
            throw error;
          }
        }
      }
    });
  }
}
```

### 18.3 资源清理

在插件禁用时清理资源：

```typescript
class MyPlugin extends Plugin {
  async disable() {
    // 清理定时任务
    this.app.schedule.unregister('my-task');
    
    // 清理事件监听
    this.app.off('post.created', this.handlePostCreated);
  }
}
```
