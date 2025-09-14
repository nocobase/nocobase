# 权限控制插件示例

## 概述

权限控制插件 (`@nocobase/plugin-acl`) 提供了基于角色、资源和操作的权限控制功能，可以精确控制界面配置权限、数据操作权限、菜单访问权限、插件权限等。

## 功能特性

- 基于角色的访问控制 (RBAC)
- 支持资源和操作级别的权限控制
- 精确控制界面配置权限
- 数据操作权限管理
- 菜单访问权限控制
- 插件权限管理
- 支持权限继承和覆盖

## 安装和启用

```bash
yarn add @nocobase/plugin-acl
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import ACLPlugin from '@nocobase/plugin-acl';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(ACLPlugin);
  }
}
```

## 基本使用

### 1. 创建角色和权限

```ts
// src/server/role-setup.ts
import { Role, Resource } from '@nocobase/plugin-acl';

export async function setupRoles(acl) {
  // 创建管理员角色
  const adminRole = new Role('admin', {
    title: '管理员',
    description: '系统管理员角色'
  });
  
  // 创建普通用户角色
  const userRole = new Role('user', {
    title: '普通用户',
    description: '普通用户角色'
  });
  
  // 注册角色
  acl.registerRole(adminRole);
  acl.registerRole(userRole);
  
  // 为管理员角色分配所有权限
  adminRole.grant({
    resource: '*',
    actions: '*'
  });
  
  // 为普通用户分配特定权限
  userRole.grant({
    resource: 'posts',
    actions: ['view', 'create']
  });
  
  userRole.grant({
    resource: 'comments',
    actions: ['view', 'create', 'update']
  });
}
```

### 2. 在数据表中配置权限

```ts
// src/server/collection-permissions.ts
import { CollectionOptions } from '@nocobase/database';

export const postCollection: CollectionOptions = {
  name: 'posts',
  title: '文章',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题'
    },
    {
      type: 'text',
      name: 'content',
      title: '内容'
    },
    {
      type: 'belongsTo',
      name: 'author',
      title: '作者',
      target: 'users'
    }
  ],
  // 配置访问控制
  acl: {
    // 所有用户都可以查看文章
    'view': {
      condition: {} // 无条件
    },
    
    // 只有作者可以编辑自己的文章
    'update': {
      condition: {
        'author.id': '{{ currentUser.id }}'
      }
    },
    
    // 只有作者可以删除自己的文章
    'destroy': {
      condition: {
        'author.id': '{{ currentUser.id }}'
      }
    }
  }
};
```

### 3. 在客户端使用权限控制

```tsx
// src/client/components/PermissionBasedComponent.tsx
import React from 'react';
import { useACL } from '@nocobase/plugin-acl/client';

export default function PermissionBasedComponent() {
  const { can } = useACL();
  
  return (
    <div>
      <h2>文章管理</h2>
      
      {/* 只有有创建权限的用户才能看到创建按钮 */}
      {can('posts', 'create') && (
        <button>创建文章</button>
      )}
      
      {/* 只有管理员才能看到删除按钮 */}
      {can('admin') && (
        <button>删除文章</button>
      )}
      
      <div>
        {/* 文章列表 */}
      </div>
    </div>
  );
}
```

## 高级用法

### 1. 自定义权限策略

```ts
// src/server/custom-policy.ts
import { Policy } from '@nocobase/plugin-acl';

class DepartmentPolicy extends Policy {
  async check(role, resource, action, context) {
    // 实现部门级别的权限检查
    if (resource === 'departmentData') {
      const userDepartment = await this.getUserDepartment(context.user);
      const dataDepartment = await this.getDataDepartment(context.data);
      
      // 只允许访问同部门的数据
      return userDepartment.id === dataDepartment.id;
    }
    
    return super.check(role, resource, action, context);
  }
  
  private async getUserDepartment(user) {
    // 获取用户所属部门
  }
  
  private async getDataDepartment(data) {
    // 获取数据所属部门
  }
}

// 注册自定义策略
import { ACL } from '@nocobase/plugin-acl';

export function registerCustomPolicy(acl: ACL) {
  acl.registerPolicy('department', new DepartmentPolicy());
}
```

### 2. 动态权限控制

```ts
// src/server/dynamic-permissions.ts
import { Role } from '@nocobase/plugin-acl';

class DynamicRole extends Role {
  async getPermissions(context) {
    const permissions = [...this.staticPermissions];
    
    // 根据用户属性动态添加权限
    if (context.user.isVip) {
      permissions.push({
        resource: 'premiumContent',
        actions: ['view']
      });
    }
    
    // 根据时间动态添加权限
    const now = new Date();
    if (now.getHours() >= 9 && now.getHours() < 18) {
      permissions.push({
        resource: 'businessFeatures',
        actions: ['use']
      });
    }
    
    return permissions;
  }
}
```

## 最佳实践

1. **权限设计**：
   - 遵循最小权限原则
   - 合理划分角色和权限
   - 使用继承减少重复配置
   - 定期审查权限设置

2. **性能优化**：
   - 缓存权限检查结果
   - 批量权限验证
   - 使用索引优化查询条件
   - 避免复杂的权限逻辑

3. **安全性**：
   - 实施多层权限验证
   - 记录权限访问日志
   - 防止权限提升攻击
   - 定期更新权限策略

## 扩展示例

### 1. 多租户权限控制

```ts
// src/server/multi-tenant-permissions.ts
export const tenantCollection: CollectionOptions = {
  name: 'tenants',
  title: '租户',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '租户名称'
    }
  ]
};

export const tenantUserCollection: CollectionOptions = {
  name: 'tenantUsers',
  title: '租户用户',
  fields: [
    {
      type: 'belongsTo',
      name: 'tenant',
      title: '租户',
      target: 'tenants'
    },
    {
      type: 'belongsTo',
      name: 'user',
      title: '用户',
      target: 'users'
    }
  ]
};

// 租户级别的权限控制
export const tenantDataCollection: CollectionOptions = {
  name: 'tenantData',
  title: '租户数据',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '数据名称'
    },
    {
      type: 'belongsTo',
      name: 'tenant',
      title: '租户',
      target: 'tenants'
    }
  ],
  acl: {
    'view': {
      condition: {
        'tenant.id': '{{ currentUser.tenant.id }}'
      }
    },
    'create': {
      condition: {
        'tenant.id': '{{ currentUser.tenant.id }}'
      }
    },
    'update': {
      condition: {
        'tenant.id': '{{ currentUser.tenant.id }}'
      }
    },
    'destroy': {
      condition: {
        'tenant.id': '{{ currentUser.tenant.id }}'
      }
    }
  }
};
```

### 2. 数据行级权限

```ts
// src/server/row-level-permissions.ts
export const projectCollection: CollectionOptions = {
  name: 'projects',
  title: '项目',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '项目名称'
    },
    {
      type: 'belongsToMany',
      name: 'members',
      title: '项目成员',
      target: 'users',
      through: 'projectMembers'
    }
  ],
  acl: {
    // 项目成员可以查看项目
    'view': {
      condition: {
        'members.id': '{{ currentUser.id }}'
      }
    },
    
    // 项目创建者可以编辑项目
    'update': {
      condition: {
        'createdBy.id': '{{ currentUser.id }}'
      }
    }
  }
};

export const taskCollection: CollectionOptions = {
  name: 'tasks',
  title: '任务',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '任务标题'
    },
    {
      type: 'belongsTo',
      name: 'project',
      title: '所属项目',
      target: 'projects'
    }
  ],
  // 任务继承项目权限
  acl: {
    'view': {
      condition: {
        'project.members.id': '{{ currentUser.id }}'
      }
    },
    'create': {
      condition: {
        'project.members.id': '{{ currentUser.id }}'
      }
    }
  }
};
```

### 3. 菜单权限控制

```tsx
// src/client/components/MenuWithPermissions.tsx
import React from 'react';
import { useACL } from '@nocobase/plugin-acl/client';

const menuItems = [
  {
    key: 'dashboard',
    title: '仪表板',
    path: '/dashboard',
    permission: 'dashboard:view'
  },
  {
    key: 'users',
    title: '用户管理',
    path: '/users',
    permission: 'users:manage'
  },
  {
    key: 'settings',
    title: '系统设置',
    path: '/settings',
    permission: 'admin'
  }
];

export default function MenuWithPermissions() {
  const { can } = useACL();
  
  const filteredMenuItems = menuItems.filter(item => 
    can(item.permission)
  );
  
  return (
    <nav>
      <ul>
        {filteredMenuItems.map(item => (
          <li key={item.key}>
            <a href={item.path}>{item.title}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

## 常见问题

### 1. 权限缓存

```ts
// src/server/permission-cache.ts
import { Cache } from '@nocobase/cache';

export class PermissionCache {
  constructor(private cache: Cache) {}
  
  async getUserPermissions(userId: number) {
    const cacheKey = `user_permissions_${userId}`;
    let permissions = await this.cache.get(cacheKey);
    
    if (!permissions) {
      permissions = await this.loadUserPermissions(userId);
      await this.cache.set(cacheKey, permissions, 5 * 60); // 缓存5分钟
    }
    
    return permissions;
  }
  
  async invalidateUserPermissions(userId: number) {
    const cacheKey = `user_permissions_${userId}`;
    await this.cache.del(cacheKey);
  }
  
  private async loadUserPermissions(userId: number) {
    // 从数据库加载用户权限
  }
}
```

### 2. 权限继承

```ts
// src/server/permission-inheritance.ts
import { Role } from '@nocobase/plugin-acl';

class InheritableRole extends Role {
  constructor(name, options, private parentRoles = []) {
    super(name, options);
  }
  
  async getPermissions(context) {
    const permissions = [...this.staticPermissions];
    
    // 继承父角色的权限
    for (const parentRoleName of this.parentRoles) {
      const parentRole = this.acl.getRole(parentRoleName);
      if (parentRole) {
        const parentPermissions = await parentRole.getPermissions(context);
        permissions.push(...parentPermissions);
      }
    }
    
    return permissions;
  }
}

// 使用继承角色
export function setupInheritedRoles(acl) {
  const baseRole = new Role('base', {
    title: '基础角色'
  });
  
  baseRole.grant({
    resource: 'common',
    actions: ['view']
  });
  
  const advancedRole = new InheritableRole('advanced', {
    title: '高级角色'
  }, ['base']); // 继承基础角色
  
  advancedRole.grant({
    resource: 'advanced',
    actions: ['view', 'create']
  });
  
  acl.registerRole(baseRole);
  acl.registerRole(advancedRole);
}
```

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/acl)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/acl)
- [认证插件](https://github.com/nocobase/nocobase/tree/main/packages/plugins/auth)
