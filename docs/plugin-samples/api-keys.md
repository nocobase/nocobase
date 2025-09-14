# API 密钥认证插件示例

## 概述

API 密钥认证插件 (`@nocobase/plugin-api-keys`) 允许用户使用 API 密钥访问应用的 HTTP API。这对于需要通过程序化方式访问 NocoBase 应用数据的场景非常有用。

## 功能特性

- 支持 API 密钥生成和管理
- 可控制 API 密钥的权限范围
- 支持密钥过期时间设置
- 提供密钥使用统计和监控
- 与 NocoBase 权限系统集成
- 支持密钥的启用和禁用

## 安装和启用

```bash
yarn add @nocobase/plugin-api-keys
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import ApiKeysPlugin from '@nocobase/plugin-api-keys';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(ApiKeysPlugin);
  }
}
```

## 基本使用

### 1. 创建 API 密钥

```ts
// src/server/api-key-setup.ts
import { ApiKey } from '@nocobase/plugin-api-keys';

export async function setupApiKeys(apiKeyManager) {
  // 创建一个具有特定权限的 API 密钥
  const apiKey = await apiKeyManager.create({
    name: 'Data Sync Key',
    description: '用于数据同步的 API 密钥',
    userId: 1, // 关联的用户 ID
    permissions: ['posts:view', 'posts:create'], // 权限列表
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 天后过期
  });
  
  console.log('API Key created:', apiKey.token);
  // 注意：token 只在创建时显示一次，需要安全保存
}
```

### 2. 使用 API 密钥进行认证

```bash
# 在 HTTP 请求中使用 API 密钥
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     http://localhost:13000/api/posts
```

在代码中使用：

```javascript
// JavaScript 示例
const response = await fetch('http://localhost:13000/api/posts', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
```

```python
# Python 示例
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('http://localhost:13000/api/posts', headers=headers)
```

## 高级用法

### 1. 自定义权限范围

```ts
// src/server/custom-api-key-permissions.ts
import { ApiKey } from '@nocobase/plugin-api-keys';

class CustomApiKey extends ApiKey {
  async checkPermission(action: string, resource: string) {
    // 实现自定义权限检查逻辑
    if (this.permissions.includes('*')) {
      return true; // 全部权限
    }
    
    // 检查具体权限
    return this.permissions.includes(`${resource}:${action}`) ||
           this.permissions.includes(`${resource}:*`) ||
           this.permissions.includes(`*:${action}`);
  }
  
  async canAccessCollection(collectionName: string) {
    // 实现集合访问控制
    if (this.collections && this.collections.length > 0) {
      return this.collections.includes(collectionName);
    }
    return true; // 如果没有指定集合限制，则允许访问所有集合
  }
}
```

### 2. API 密钥中间件

```ts
// src/server/api-key-middleware.ts
import { Context, Next } from 'koa';

export function apiKeyMiddleware() {
  return async (ctx: Context, next: Next) => {
    const authHeader = ctx.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // 验证 API 密钥
      const apiKey = await validateApiKey(token);
      if (apiKey) {
        // 检查密钥是否过期
        if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
          ctx.status = 401;
          ctx.body = { error: 'API key has expired' };
          return;
        }
        
        // 检查密钥是否被禁用
        if (!apiKey.enabled) {
          ctx.status = 401;
          ctx.body = { error: 'API key is disabled' };
          return;
        }
        
        // 将用户信息附加到上下文
        ctx.state.user = await getUserById(apiKey.userId);
        ctx.state.apiKey = apiKey;
        
        // 记录使用情况
        await logApiKeyUsage(apiKey.id, ctx);
        
        await next();
        return;
      }
    }
    
    ctx.status = 401;
    ctx.body = { error: 'Invalid API key' };
  };
}

async function validateApiKey(token: string) {
  // 实现 API 密钥验证逻辑
}

async function getUserById(userId: number) {
  // 实现获取用户信息逻辑
}

async function logApiKeyUsage(apiKeyId: number, ctx: Context) {
  // 实现使用日志记录逻辑
}
```

## 最佳实践

1. **安全性**：
   - 妥善保管 API 密钥，避免泄露
   - 为不同的用途创建不同的 API 密钥
   - 设置合适的过期时间
   - 定期轮换密钥

2. **权限控制**：
   - 遵循最小权限原则
   - 限制 API 密钥可访问的资源
   - 使用只读密钥进行数据查询
   - 为敏感操作使用独立的密钥

3. **监控和日志**：
   - 记录 API 密钥的使用情况
   - 监控异常使用模式
   - 设置使用量限制
   - 定期审查密钥权限

## 扩展示例

### 1. 项目集成密钥管理

```ts
// src/server/project-api-keys.ts
export const projectApiKeyCollection: CollectionOptions = {
  name: 'projectApiKeys',
  title: '项目 API 密钥',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '密钥名称'
    },
    {
      type: 'string',
      name: 'token',
      title: '密钥',
      hidden: true // 在列表中隐藏
    },
    {
      type: 'text',
      name: 'description',
      title: '描述'
    },
    {
      type: 'belongsTo',
      name: 'project',
      title: '项目',
      target: 'projects'
    },
    {
      type: 'date',
      name: 'expiresAt',
      title: '过期时间'
    },
    {
      type: 'boolean',
      name: 'enabled',
      title: '启用',
      defaultValue: true
    }
  ]
};

// 项目级别的 API 密钥服务
export class ProjectApiKeyService {
  async createProjectKey(projectId: number, options: any) {
    const token = this.generateToken();
    
    return await this.db.getRepository('projectApiKeys').create({
      values: {
        ...options,
        token: this.hashToken(token),
        project: projectId
      }
    });
  }
  
  async validateProjectKey(token: string, projectId: number) {
    const hashedToken = this.hashToken(token);
    const apiKey = await this.db.getRepository('projectApiKeys').findOne({
      filter: {
        token: hashedToken,
        project: projectId,
        enabled: true
      }
    });
    
    if (apiKey && (!apiKey.expiresAt || new Date() < apiKey.expiresAt)) {
      return apiKey;
    }
    
    return null;
  }
  
  private generateToken() {
    return require('crypto').randomBytes(32).toString('hex');
  }
  
  private hashToken(token: string) {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }
}
```

### 2. IP 白名单控制

```ts
// src/server/ip-whitelist.ts
import { ApiKey } from '@nocobase/plugin-api-keys';

class IpRestrictedApiKey extends ApiKey {
  constructor(options) {
    super(options);
    this.allowedIps = options.allowedIps || [];
  }
  
  async validateRequest(ctx) {
    // 首先执行标准验证
    const isValid = await super.validateRequest(ctx);
    if (!isValid) {
      return false;
    }
    
    // 检查 IP 白名单
    if (this.allowedIps.length > 0) {
      const clientIp = this.getClientIp(ctx);
      return this.allowedIps.includes(clientIp);
    }
    
    return true;
  }
  
  private getClientIp(ctx) {
    return ctx.headers['x-forwarded-for'] || 
           ctx.headers['x-real-ip'] || 
           ctx.ip;
  }
}

// 使用 IP 限制的 API 密钥
export async function createIpRestrictedKey(apiKeyManager) {
  const apiKey = await apiKeyManager.create({
    name: 'IP Restricted Key',
    description: '仅允许特定 IP 访问',
    userId: 1,
    permissions: ['posts:*'],
    allowedIps: ['192.168.1.100', '10.0.0.5']
  });
  
  return apiKey;
}
```

### 3. 使用统计和限制

```ts
// src/server/api-key-analytics.ts
export const apiKeyUsageCollection: CollectionOptions = {
  name: 'apiKeyUsage',
  title: 'API 密钥使用统计',
  fields: [
    {
      type: 'belongsTo',
      name: 'apiKey',
      title: 'API 密钥',
      target: 'apiKeys'
    },
    {
      type: 'string',
      name: 'endpoint',
      title: '访问端点'
    },
    {
      type: 'string',
      name: 'method',
      title: 'HTTP 方法'
    },
    {
      type: 'date',
      name: 'timestamp',
      title: '访问时间'
    },
    {
      type: 'string',
      name: 'ipAddress',
      title: 'IP 地址'
    },
    {
      type: 'integer',
      name: 'responseTime',
      title: '响应时间(ms)'
    }
  ]
};

// 使用限制中间件
export function rateLimitMiddleware(options: { maxRequests: number, windowMs: number }) {
  const usageMap = new Map();
  
  return async (ctx, next) => {
    const authHeader = ctx.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const key = `${token}:${Math.floor(Date.now() / options.windowMs)}`;
      
      const current = usageMap.get(key) || 0;
      if (current >= options.maxRequests) {
        ctx.status = 429;
        ctx.body = { error: 'Too many requests' };
        return;
      }
      
      usageMap.set(key, current + 1);
    }
    
    await next();
  };
}
```

## 常见问题

### 1. 密钥安全存储

```ts
// src/server/secure-key-storage.ts
import { createCipheriv, createDecipheriv } from 'crypto';

export class SecureApiKeyStorage {
  private encryptionKey: Buffer;
  
  constructor(encryptionKey: string) {
    this.encryptionKey = Buffer.from(encryptionKey, 'hex');
  }
  
  encryptToken(token: string): string {
    const iv = Buffer.from(process.env.API_KEY_IV, 'hex');
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }
  
  decryptToken(encryptedToken: string): string {
    const iv = Buffer.from(process.env.API_KEY_IV, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 2. 密钥轮换

```ts
// src/server/key-rotation.ts
export class ApiKeyRotation {
  async rotateKey(oldKeyId: number) {
    // 获取旧密钥信息
    const oldKey = await this.db.getRepository('apiKeys').findById(oldKeyId);
    
    // 创建新密钥
    const newToken = this.generateToken();
    const newKey = await this.db.getRepository('apiKeys').create({
      values: {
        ...oldKey,
        token: this.hashToken(newToken),
        createdAt: new Date(),
        lastRotatedAt: new Date()
      }
    });
    
    // 禁用旧密钥
    await this.db.getRepository('apiKeys').update({
      filter: { id: oldKeyId },
      values: { enabled: false }
    });
    
    // 设置新旧密钥并存期（用于平滑过渡）
    await this.setGracePeriod(oldKeyId, newKey.id);
    
    return newToken;
  }
  
  private async setGracePeriod(oldKeyId: number, newKeyId: number) {
    // 实现新旧密钥并存期逻辑
    // 在此期间，两个密钥都可以使用
  }
}
```

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/api-keys)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/api-keys)
- [认证插件](https://github.com/nocobase/nocobase/tree/main/packages/plugins/auth)
