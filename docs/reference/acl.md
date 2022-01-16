---
toc: menu
---

# ACL

## ACL

```ts
class ACL {
  // 可以被配置权限的 actions
  protected availableActions;
  // 可供角色选择的权限策略
  protected availableStrategies;
  // 核心，基于角色的权限设计
  protected roles;
  // acl 公开的 API
  public setAvailableAction(name: string, options?: AvailableActionOptions);
  public setAvailableStrategy(name: string, options?: AvailableStrategyOptions);
  // 一种更易用的 setRole，也可用于代码层面配置
  public define(options?: DefineOptions): ACLRole;
  public getRole(name: string): ACLRole;
  public hasRole(name: string): Boolean;
  // 这里参数用 object，更好扩展
  public can(options: CanOptions): CanResult;
  public beforeSetAction(path: string, listener?: Listener);
}
```

### `acl.setAvailableAction()`

可以被配置权限的 action，不在 availableActions 内的 action 不处理。可以用于配置 action 的别名，以及通配符 `actions: '*'` 表示的 action 有哪些。

```ts
class ACL {
  // 可以被配置权限的 actions
  protected availableActions;
  public setAvailableAction(name: string, options: AvailableActionOptions);
}

interface AvailableActionOptions {
  aliases?: string[] | string;
  type: 'new-data' | 'old-data'; // 对新数据的操作 和 对已有数据操作，只做标记，提供给前端使用
  displayName?: string; // 显示名称，给前端使用
}
```

##### Examples

```ts
acl.setAvailableAction('view', {
  type: 'old-data',
  displayName: '查看',
  aliases: ['get', 'list'], 
});
```

### `acl.setAvailableStrategy()`

设置可供角色选择的权限策略

```ts
class ACL {
  // 可供角色选择的权限策略
  protected availableStrategies;
  public setAvailableStrategy(name: string, options: AvailableStrategyOptions);
}

interface AvailableStrategyOptions {
  displayName?: string; // 显示名称，给前端使用
  actions: false | string | string[];
  resource?: '*';
}
```

##### Examples

```ts
acl.setAvailableStrategy('s1', {
  displayName: '可以管理所有数据',
  actions: '*',
  resource: '*',
});
```

### `acl.define()`

配置角色权限，通用的权限配置入口，相当于 setRole，不过更为易用，可直接用于代码层面配置。

```ts
class ACL {
  public define(options?: DefineOptions): ACLRole;
}

interface DefineOptions {
  role: string;
  strategy?: string | AvailableStrategyOptions;
  actions?: {
    [key: string]: ActionParams;
  };
  resources?: {
    [resourceName: string]: {
      [actionName: string]: ActionParams;
    }
  };
  routes?: any;
}

interface ActionParams {
  fields?: string[];
  filter?: any;
}
```

##### Examples

```ts
// 统一配置，比如直接代码层面配置
const role = acl.define({
  role: 'admin',
  // 通用配置
  strategy: 's1', // 从全局 availableStrategies 获取
  strategy: {     // 无需从全局 availableStrategies 获取，更便于代码上直接配置
    actions: '*',
    resource: '*',
  },
  // 直接配置 actions
  actions: {
    'posts:create': {},
    'posts.comments:create': {},
  },
  // 直接配置 resources
  resources: {
    posts: {
      create: {},
    },
    'posts.comments': {
      create: {},
    },
    comments: {
      // 不确定是否需要，感觉不是很好，容易杂糅不清，又增加了复杂度
      '*': {}, // 通配符，所有的 actions 统一配置，表示 availableActions 的都允许
    },
  },
  // 以后可能的扩展
  routes: {},
});
```

### `acl.getRole()`

获取角色配置

```ts
class ACL {
  public getRole(name: string): ACLRole;
}
```

### `acl.hasRole()`

判断角色是否已存在

```ts
class ACL {
  public hasRole(name: string): Boolean;
}
```

### `acl.can()`

权限判断

```ts
class ACL {
  // 这里参数用 object，扩展项更好
  public can(options: CanOptions): CanResult | null;
}

interface CanOptions {
  role: string;
  resource: string;
  action: string;
  // 以后可以扩展对 route 的支持
}

interface CanResult {
  role: string;
  resource: string;
  action: string;
  params?: ActionParams;
}
```

##### Examples

```ts
acl.setAvailableAction('view', {
  type: 'old-data',
  displayName: '查看',
  aliases: ['get', 'list'], 
});

acl.define({
  role: 'admin',
  actions: {
    'posts:view': {
      filter: { status: 'publish' },
    },
  },
});

const result = acl.can({
  role: 'admin',
  resource: 'posts',
  action: 'get',
});
// 输出结果为：
{
  role: 'admin',
  resource: 'posts',
  action: 'get', // get 为 view 的别名
  params: {
    filter: { status: 'publish' },
  },
}
```

### `acl.beforeSetAction()`

用于过滤 action params

```ts
class ACL {
  beforeSetAction(path: string, listener?: Listener) {
    // 类似 db 直接用的 EventEmitter 来处理
    this.on(`${path}.beforeSetAction`, listener);
  }
}

interface ListenerContext {
  acl: ACL;
  role: ACLRole;
  params: ActionParams; 
}

type Listener = (ctx: ListenerContext) => void;
```

##### Examples

```ts
acl.define({
  role: 'admin',
  actions: {
    'posts:create': {},
  },
});

acl.beforeSetAction('posts:create', (ctx) => {
  ctx.params = {
    filter: {
      status: 'publish',
    },
  };
});

const result = acl.can({ role: 'admin', resource: 'posts', action: 'create' });
{
  role: 'admin',
  resource: 'posts',
  action: 'create',
  params: {
    // 由 beforeSetAction 提供
    filter: {
      status: 'publish',
    },
  },
}
```

## ACLRole

```ts
class ACLRole {
  protected resources;
  protected strategy: string | AvailableStrategyOptions;
  public setStrategy(value: string | AvailableStrategyOptions);
  // 如果资源不存在，先创建，再附加 action；action 存在直接覆盖，没有 merge 操作
  public setAction(path: string, options: ActionParams);
  public getAction(path: string): ActionParams;
  public removeAction(path: string);
  // 如果资源存在，直接覆盖，没有 merge 操作
  public setResourceActions(resourceName: string, options: ResourceActionsOptions);
  public getResourceActions(resourceName: string);
  public removeResourceActions(resourceName: string);
  public toJSON(): DefineOptions;
}
```

### role.setStrategy()

```ts
class ACLRole {
  protected strategy: string | AvailableStrategyOptions;
  public setStrategy(value: string | AvailableStrategyOptions)
}
```

### role.setAction()

```ts
class ACLRole {
  // 如果资源不存在，先创建，再设置 action；action 存在直接覆盖，没有 merge 操作
  public setAction(path: string, options: ActionParams) {
    const [resourceName, actionName] = path.split(':');
    let resource;
    if (this.resources.has(resourceName)) {
      resource = this.resources.get(resourceName);
    } else {
      resource = new ACLResource(resourceName);
      this.resources.set(resourceName, resource);
    }
    resource.setAction(actionName, options);
  }
}

interface ActionParams {
  fields?: string[];
  filter?: any;
}
```

##### Examples

```ts
// 以 action 为单元
role.setAction('posts:create', {
  whitelist: [],
});
```

### role.getAction()

```ts
class ACLRole {
  public getAction(path: string): ActionParams;
}
```

### role.removeAction()

```ts
class ACLRole {
  public removeAction(path: string);
}
```

### role.setResourceActions()

```ts
class ACLRole {
  public setResourceActions(resourceName: string, options: ResourceActionsOptions);
}

interface ResourceActionsOptions {
  [actionName: string]: ActionParams;
}
```

### role.getResourceActions()

```ts
class ACLRole {
  public getResourceActions(resourceName: string): ResourceActionsOptions;
}
```

### role.removeResourceActions()

```ts
class ACLRole {
  public removeResourceActions(resourceName: string);
}
```

### role.toJSON()

```ts
class ACLRole {
  public toJSON(): DefineOptions;
}
```

##### Examples

```ts
role.toJSON();
{
  role: 'admin',
  strategy: 's1',
  resources: {},
}
```

## ACLResource

```ts
class ACLResource {
  protected resourceName: string;
  protected actions;
  constructor(resourceName: string, context: ACLResourceContext);
  public setAction(actionName: string, options: ActionParams);
  public setActions(actions: { [key: string]: ActionParams });
}

interface ACLResourceContext {
  acl: ACL;
  role: ACLRole;
}
```

### resource.setAction()

```ts
class ACLResource {
  public setAction(actionName: string, params: ActionParams) {
    const name = `${this.resourceName}.${actionName}`;
    const ctx = { ...this.context, params };
    this.context.acl.emit(`${name}.beforeSetAction`, ctx);
    this.actions.set(actionName, ctx.params);
  }
}
```

### resource.setActions()

```ts
class ACLResource {
  public setActions(actions: { [key: string]: ActionParams }) {
    for (let key in actions) {
      this.addAction(key, actions[key]);
    }
  }
}
```
