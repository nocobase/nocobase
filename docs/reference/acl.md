# ACL

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
  public define(options?: DefineOptions): AclRole;
  public getRole(name: string): AclRole;
  public hasRole(name: string): Boolean;
  // 这里参数用 object，扩展项更好
  public can(options: CanOptions);
}

interface AvailableStrategyOptions {
  actions: false | string | string[];
  resource?: '*';
  displayName?: string; // 显示名称，给前端使用
}

interface AvailableActionOptions {
  aliases?: string[] | string;
  type: 'new-data' | 'old-data'; // 对新数据的操作 和 对已有数据操作，只做标记，提供给前端使用
  displayName?: string; // 显示名称，给前端使用
}

class ACLRole {
  protected resources;
  protected strategy: string | AvailableStrategyOptions;
  public setStrategy(value: string | AvailableStrategyOptions);
  public getStrategy();
  // 如果资源不存在，先创建，再附加 action；action 存在直接覆盖，没有 merge 操作
  public setAction(name: string, options: ActionOptions) {
    const [resourceName, actionName] = name.split(':');
    let resource;
    if (this.resources.has(resourceName)) {
      resource = this.resources.get(resourceName);
    } else {
      resource = new AclResource(resourceName);
      this.resources.set(resourceName, resource);
    }
    resource.setAction(actionName, options);
  }
  public getAction(name: string);
  public removeAction(name: string);
  // 如果资源存在，直接覆盖，没有 merge 操作
  public setResourceActions(name: string, options: ResourceActionsOptions) {
    const resource = new AclResource(name);
    resource.setActions(options);
    this.resources.set(name, resource);
  }
  public getResourceActions(name: string);
  public removeResourceActions(name: string);
}

class AclResource {
  protected resourceName: string;
  protected actions;
  constructor(resourceName: string);
  public setAction(name: string, options);
  public setActions(actions) {
    for (let key in actions) {
      this.addAction(key, actions[key]);
    }
  }
}

acl.setAvailableAction('view', {
  type: 'old-data',
  displayName: '查看',
  aliases: ['get', 'list'], 
});

acl.setAvailableStrategy('s1', {
  displayName: '可以管理所有数据',
  actions: '*',
  resource: '*',
});

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

// 通过 API 操作
const role = acl.setRole('admin');
const role = acl.getRole('admin');

role.setStrategy('s2');
role.getStrategy();

// 以 action 为单元
role.setAction('posts:create', {});
// 关系资源
role.setAction('posts.comments:create', {});
role.removeAction('posts:create');
role.getAction('posts:create');

// 以 resource 为单元添加 actions
role.setResourceActions('posts', {
  create: {},
  update: {},
});
role.removeResourceActions('posts');
// 资源下的所有 actions
role.getResourceActions('posts');
```
