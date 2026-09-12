# 给其他插件扩展用户和权限模块

默认有三个扩展入口：
- 给「Users & Permissions」增加新的设置页签
- 给「Roles & Permissions」增加新的角色级扩展面板
- 给「Roles & Permissions」页面里的「Permissions」区域增加子 tab


## 扩展点总览

| 扩展点 | 写法 | 适合放什么 |
| --- | --- | --- |
| 设置页签 | `pluginSettingsManager.addPageTabItem({ menuKey: 'users-permissions' })` | 用户、角色、授权相关的独立管理页面 |
| 角色详情页 | `aclPlugin.rolesManager.add()` | 围绕“当前角色”的附加信息、附加配置和附加操作 |
| 权限页子 tab | `aclPlugin.settingsUI.addPermissionsTab()` | 挂到「Roles & Permissions」页面里「Permissions」这一层的权限配置子页面 |

`pluginSettingsManager.addMenuItem()` 对应的 `users-permissions` 父菜单通常已经由 `plugin-users` 或 `plugin-acl` 创建好了。其他插件一般不用重复创建。

## 1. 扩展「Users & Permissions」设置页签

这是最常见的扩展方式。只要你的功能需要出现在「Users & Permissions」模块里，就往 `menuKey: 'users-permissions'` 下加页签。

`plugin-users` 自己注册 `Users` 页签的方式是：

```ts
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'users-permissions',
  key: 'users',
  title: this.t('Users'),
  icon: 'UserOutlined',
  aclSnippet: 'pm.users',
  sort: 2,
  componentLoader: () => import('./pages/UsersManagementPage'),
});
```

其他插件扩展时，通常只需要换掉 `key`、`title`、`aclSnippet` 和 `componentLoader`：

```ts
import { Plugin } from '@nocobase/client-v2';

export class PluginLockedUsersClientV2 extends Plugin {
  async load() {
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'users-permissions',
      key: 'locked-users',
      title: this.t('Locked users'),
      icon: 'StopOutlined',
      aclSnippet: 'pm.users.locked',
      sort: 20,
      componentLoader: () => import('./pages/LockedUsersPage'),
    });
  }
}
```

这些字段的职责可以这样理解：

| 字段 | 作用 |
| --- | --- |
| `menuKey` | 指定挂到哪个父菜单下。这里固定写 `users-permissions` |
| `key` | 当前页签自己的稳定标识。不要和别的插件重复 |
| `title` | 页签标题 |
| `icon` | 页签图标 |
| `aclSnippet` | 控制当前用户是否能看到这个页签 |
| `sort` | 控制页签顺序。数值越小越靠前 |
| `componentLoader` | 懒加载页面组件。v2 默认推荐这种写法 |

适合放进这里的内容，比如：

- 锁定用户
- 用户同步
- 用户导入导出
- 组织成员映射
- 额外的账号安全策略


## 2. 扩展角色详情页

如果你的功能不是“再加一个总管理页面”，而是“给当前角色多一块内容”，那么应该走 `PluginAclClientV2.rolesManager.add()`。

`plugin-users` 自己就是这样把“角色下的用户管理”挂进去的：

```ts
import PluginAclClientV2 from '@nocobase/plugin-acl/client-v2';

const aclPlugin = this.app.pm.get(PluginAclClientV2) as PluginAclClientV2 | undefined;

aclPlugin?.rolesManager.add('users', {
  title: String(this.t('Users')),
  sort: 10,
  componentLoader: () => import('./pages/RoleUsersManager'),
});
```

其他插件可以按同样方式，把角色级扩展页接进去：

```ts
import { Plugin } from '@nocobase/client-v2';
import PluginAclClientV2 from '@nocobase/plugin-acl/client-v2';

export class PluginUserGroupsClientV2 extends Plugin {
  async load() {
    const aclPlugin = this.app.pm.get(PluginAclClientV2) as PluginAclClientV2 | undefined;
    if (!aclPlugin) {
      return;
    }

    aclPlugin.rolesManager.add('user-groups', {
      title: this.t('User groups'),
      sort: 30,
      componentLoader: () => import('./pages/RoleUserGroupsTab'),
    });
  }
}
```

这里要注意的是，`rolesManager.add()` 挂进去的不是全局设置页，而是**角色详情页里的一个 tab**。它更适合放和“当前角色”强相关的内容。

适合放进这里的内容，比如：

- 当前角色关联的用户列表
- 当前角色允许访问的组织、部门或用户组
- 当前角色的附加安全策略
- 当前角色下才生效的第三方系统映射

## 3. 扩展权限页面内的子 tab

这一层和前面两个扩展点不太一样。它不是往「Users & Permissions」顶层再加一个页签，也不是给角色详情区再加一个独立 tab，而是往「Roles & Permissions」页面里已经存在的「Permissions」区域继续加内部子 tab。

你可以把页面结构理解成这样：

```text
Users & Permissions
  ├─ Users
  └─ Roles & Permissions
       ├─ Permissions
       │    ├─ System
       │    ├─ Desktop routes
       │    └─ 这里可以继续扩展更多权限子 tab
       ├─ Users
       └─ 其他 rolesManager tab
```

扩展入口在 `PluginAclClientV2.settingsUI.addPermissionsTab()` 上。`plugin-acl` 自己在 `load()` 里已经注册了两个内置子 tab：

```ts
this.settingsUI.addPermissionsTab({
  key: 'general',
  label: String(this.t('System')),
  sort: 10,
  componentLoader: () => import('./pages/permissions/SystemPermissionsTab'),
});

this.settingsUI.addPermissionsTab({
  key: 'menu',
  label: String(this.t('Desktop routes')),
  sort: 20,
  componentLoader: () => import('./pages/permissions/DesktopRoutesPermissionsTab'),
});
```

写法如下：

```ts
import { Plugin } from '@nocobase/client-v2';
import PluginAclClientV2 from '@nocobase/plugin-acl/client-v2';

export class PluginAIClientV2 extends Plugin {
  async load() {
    const aclPlugin = this.app.pm.get(PluginAclClientV2) as PluginAclClientV2 | undefined;
    if (!aclPlugin) {
      return;
    }

    aclPlugin.settingsUI.addPermissionsTab({
      key: 'ai-employees',
      label: this.t('AI employees'),
      sort: 30,
      componentLoader: () => import('./pages/permissions/AIEmployeesPermissionsTab'),
    });
  }
}
```

被加载的组件会收到这些 props：

- `activeKey`
- `activeRole`
- `currentUserRole`
- `onRoleChange`

也就是说，子 tab 里的组件可以同时拿到正在配置的角色 `activeRole`，以及当前登录用户的角色 `currentUserRole`。`currentUserRole` 会经过 `RolesManagementPage` 归一化，至少包含 `name`、`title`、`snippets` 等常用字段；如果当前角色上下文不可用，则为 `null`。
