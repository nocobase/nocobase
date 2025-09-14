# NocoBase 插件示例

本文档提供了各种类型的 NocoBase 插件示例，帮助开发者理解不同场景下的插件实现方式。

## 1. 基础插件示例

### Hello World 插件

最简单的插件示例，展示插件的基本结构。

**服务端代码** (`src/server/index.ts`):

```typescript
import { Plugin } from '@nocobase/server';

export class HelloWorldPlugin extends Plugin {
  async load() {
    // 添加一个简单的 API 端点
    this.app.resource({
      name: 'hello',
      actions: {
        async sayHello(ctx, next) {
          ctx.body = { message: 'Hello, World!' };
          await next();
        },
      },
    });
    
    // 允许访问该资源
    this.app.acl.allow('hello', 'sayHello');
  }
}

export default HelloWorldPlugin;
```

**客户端代码** (`src/client/index.tsx`):

```typescript
import { Plugin } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';

const HelloWorldPage = () => (
  <Card title="Hello World">
    <p>Welcome to NocoBase plugin development!</p>
  </Card>
);

class HelloWorldPlugin extends Plugin {
  async load() {
    // 添加到插件设置菜单
    this.app.pluginSettingsManager.add('hello-world', {
      title: 'Hello World',
      icon: 'ApiOutlined',
      Component: HelloWorldPage,
    });
  }
}

export default HelloWorldPlugin;
```

## 2. 数据模型插件示例

展示如何定义数据表和相关操作。

**数据表定义** (`src/server/collections/posts.ts`):

```typescript
import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'posts',
  title: '文章',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题',
    },
    {
      type: 'text',
      name: 'content',
      title: '内容',
    },
    {
      type: 'belongsToMany',
      name: 'tags',
      title: '标签',
      target: 'tags',
    },
  ],
} as CollectionOptions;
```

**模型定义** (`src/server/models/post-model.ts`):

```typescript
import { MagicAttributeModel } from '@nocobase/database';

export class PostModel extends MagicAttributeModel {
  async publish() {
    await this.update({ status: 'published' });
  }
}
```

**插件入口** (`src/server/index.ts`):

```typescript
import { Plugin } from '@nocobase/server';
import postsCollection from './collections/posts';
import { PostModel } from './models/post-model';

export class PostsPlugin extends Plugin {
  async load() {
    // 注册数据表
    this.app.db.collection(postsCollection);
    
    // 注册模型
    this.app.db.registerModels({
      PostModel,
    });
    
    // 添加自定义操作
    this.app.resource({
      name: 'posts',
      actions: {
        async publish(ctx, next) {
          const { filterByTk } = ctx.action.params;
          const post = await ctx.db.getRepository('posts').findOne({
            filterByTk,
          });
          await post.publish();
          ctx.body = post;
          await next();
        },
      },
    });
  }
}

export default PostsPlugin;
```

## 3. UI 组件插件示例

展示如何创建自定义 UI 组件。

**自定义组件** (`src/client/components/CustomBlock.tsx`):

```typescript
import React from 'react';
import { useCollectionRecord, useRecord } from '@nocobase/client';
import { Card, Button } from 'antd';

export const CustomBlock = (props) => {
  const record = useCollectionRecord();
  const { refresh } = useRecord();
  
  const handleClick = async () => {
    // 执行自定义操作
    await props.service.emit('customAction', { id: record.id });
    refresh();
  };
  
  return (
    <Card title="自定义区块">
      <p>当前记录 ID: {record.id}</p>
      <Button onClick={handleClick}>执行操作</Button>
    </Card>
  );
};
```

**Schema 初始化器** (`src/client/components/CustomBlockInitializer.tsx`):

```typescript
import React from 'react';
import { useSchemaInitializer } from '@nocobase/client';
import { TableOutlined } from '@ant-design/icons';

export const CustomBlockInitializer = (props) => {
  const { insert } = useSchemaInitializer();
  
  return (
    <SchemaInitializerItem
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CustomBlock',
          'x-settings': 'CustomBlockSettings',
        });
      }}
      title="自定义区块"
    />
  );
};
```

**插件入口** (`src/client/index.tsx`):

```typescript
import { Plugin } from '@nocobase/client';
import { CustomBlock } from './components/CustomBlock';
import { CustomBlockInitializer } from './components/CustomBlockInitializer';

class CustomUIPlugin extends Plugin {
  async load() {
    // 注册自定义组件
    this.app.addComponents({
      CustomBlock,
    });
    
    // 添加到页面区块初始化器
    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      'otherBlocks.custom',
      {
        title: '自定义区块',
        Component: CustomBlockInitializer,
      }
    );
  }
}

export default CustomUIPlugin;
```

## 4. 工作流插件示例

展示如何创建自定义工作流节点。

**工作流节点** (`src/server/nodes/custom-node.ts`):

```typescript
import { Processor, Instruction } from '@nocobase/plugin-workflow';

export default class CustomInstruction extends Instruction {
  async run(node, input, processor: Processor) {
    const { message } = node.config;
    
    // 执行自定义逻辑
    console.log(`Custom instruction executed: ${message}`);
    
    return {
      result: `Processed: ${message}`,
      status: 1, // 成功
    };
  }
}
```

**插件入口** (`src/server/index.ts`):

```typescript
import { Plugin } from '@nocobase/server';
import CustomInstruction from './nodes/custom-node';

export class CustomWorkflowPlugin extends Plugin {
  async load() {
    // 注册工作流节点
    this.app.workflow.registerInstruction(
      'custom-instruction',
      CustomInstruction
    );
  }
}

export default CustomWorkflowPlugin;
```

**客户端配置** (`src/client/index.tsx`):

```typescript
import { Plugin } from '@nocobase/client';
import { CustomInstruction } from './components/CustomInstruction';

class CustomWorkflowPlugin extends Plugin {
  async load() {
    // 注册工作流节点配置组件
    this.app.workflow.registerInstructionComponent(
      'custom-instruction',
      CustomInstruction
    );
  }
}

export default CustomWorkflowPlugin;
```

## 5. 中间件插件示例

展示如何创建自定义中间件。

**中间件实现** (`src/server/middleware/logging-middleware.ts`):

```typescript
import { Context, Next } from '@nocobase/server';

export async function loggingMiddleware(ctx: Context, next: Next) {
  const start = Date.now();
  
  try {
    await next();
  } finally {
    const ms = Date.now() - start;
    ctx.app.logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
  }
}
```

**插件入口** (`src/server/index.ts`):

```typescript
import { Plugin } from '@nocobase/server';
import { loggingMiddleware } from './middleware/logging-middleware';

export class LoggingPlugin extends Plugin {
  async load() {
    // 注册中间件
    this.app.middleware.register(loggingMiddleware);
  }
}

export default LoggingPlugin;
```

## 6. 国际化插件示例

展示如何为插件添加多语言支持。

**英文翻译** (`src/client/locales/en-US.ts`):

```typescript
export default {
  'custom-plugin.title': 'Custom Plugin',
  'custom-plugin.description': 'A custom plugin for NocoBase',
  'custom-plugin.button.submit': 'Submit',
  'custom-plugin.button.cancel': 'Cancel',
};
```

**中文翻译** (`src/client/locales/zh-CN.ts`):

```typescript
export default {
  'custom-plugin.title': '自定义插件',
  'custom-plugin.description': '一个 NocoBase 的自定义插件',
  'custom-plugin.button.submit': '提交',
  'custom-plugin.button.cancel': '取消',
};
```

**插件入口** (`src/client/index.tsx`):

```typescript
import { Plugin } from '@nocobase/client';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

class I18nPlugin extends Plugin {
  async load() {
    // 注册国际化资源
    this.app.i18n.addResources('zh-CN', 'custom-plugin', zhCN);
    this.app.i18n.addResources('en-US', 'custom-plugin', enUS);
  }
}

export default I18nPlugin;
```

## 7. 数据验证插件示例

展示如何添加数据验证逻辑。

**验证规则** (`src/server/validators/custom-validator.ts`):

```typescript
import { ValidationError } from '@nocobase/database';

export function customValidator(value, validator) {
  if (!value || value.length < 5) {
    throw new ValidationError('字段长度必须大于等于5个字符');
  }
  return value;
}
```

**插件入口** (`src/server/index.ts`):

```typescript
import { Plugin } from '@nocobase/server';
import { customValidator } from './validators/custom-validator';

export class ValidationPlugin extends Plugin {
  async load() {
    // 注册自定义验证器
    this.app.db.validators.register('custom', customValidator);
  }
}

export default ValidationPlugin;
```

## 使用示例

在数据表字段中使用自定义验证器：

``typescript
{
  type: 'string',
  name: 'customField',
  title: '自定义字段',
  validate: {
    custom: true
  }
}
```

## 8. SDK 集成插件示例

展示如何在插件中集成和使用 NocoBase SDK。

### 内部 API 调用插件

**插件入口** (`src/server/index.ts`):

```typescript
import { Plugin } from '@nocobase/server';
import { APIClient } from '@nocobase/sdk';

export class InternalApiPlugin extends Plugin {
  private internalClient: APIClient;
  
  async load() {
    // 创建内部 API 客户端
    this.internalClient = new APIClient({
      baseURL: this.app.url + '/api',
    });
    
    // 注册定时任务，定期同步数据
    this.app.schedule.register('data-sync', '0 */30 * * * *', async () => {
      await this.syncData();
    });
    
    // 添加管理命令
    this.app.command('sync-posts').action(async () => {
      await this.syncData();
    });
  }
  
  private async syncData() {
    try {
      // 使用内部客户端调用 API
      const response = await this.internalClient.resource('posts').list({
        pageSize: 100,
        page: 1,
      });
      
      // 处理同步逻辑
      this.app.logger.info(`Synced ${response.data.data.length} posts`);
    } catch (error) {
      this.app.logger.error('Data sync failed:', error);
    }
  }
}

export default InternalApiPlugin;
```

### 客户端数据管理插件

**数据管理服务** (`src/client/services/data-manager.ts`):

```typescript
import { APIClient } from '@nocobase/sdk';

export class DataManager {
  private api: APIClient;
  
  constructor(baseURL: string) {
    this.api = new APIClient({
      baseURL: `${baseURL}/api`,
    });
  }
  
  async getPosts(options: { page?: number; pageSize?: number } = {}) {
    const { page = 1, pageSize = 20 } = options;
    
    try {
      const response = await this.api.resource('posts').list({
        page,
        pageSize,
      });
      
      return response.data;
    } catch (error) {
      console.error('获取文章列表失败:', error);
      throw error;
    }
  }
  
  async createPost(data: any) {
    try {
      const response = await this.api.resource('posts').create({
        values: data,
      });
      
      return response.data;
    } catch (error) {
      console.error('创建文章失败:', error);
      throw error;
    }
  }
  
  async updatePost(id: number, data: any) {
    try {
      const response = await this.api.resource('posts').update({
        filterByTk: id,
        values: data,
      });
      
      return response.data;
    } catch (error) {
      console.error('更新文章失败:', error);
      throw error;
    }
  }
  
  async deletePost(id: number) {
    try {
      const response = await this.api.resource('posts').destroy({
        filterByTk: id,
      });
      
      return response.data;
    } catch (error) {
      console.error('删除文章失败:', error);
      throw error;
    }
  }
}
```

**插件入口** (`src/client/index.tsx`):

```typescript
import { Plugin } from '@nocobase/client';
import { DataManager } from './services/data-manager';

class DataManagerPlugin extends Plugin {
  async load() {
    // 创建数据管理服务实例
    const dataManager = new DataManager(this.app.apiClient.axios.defaults.baseURL);
    
    // 将服务添加到应用上下文
    this.app.dataManager = dataManager;
    
    // 添加到全局对象，方便在其他组件中使用
    if (typeof window !== 'undefined') {
      (window as any).dataManager = dataManager;
    }
  }
}

// 扩展应用类型定义
declare module '@nocobase/client' {
  interface Application {
    dataManager: DataManager;
  }
}

export default DataManagerPlugin;
```

### 认证集成插件

**认证服务** (`src/client/services/auth-service.ts`):

```typescript
import { APIClient } from '@nocobase/sdk';

export class AuthService {
  private api: APIClient;
  
  constructor(apiClient: APIClient) {
    this.api = apiClient;
  }
  
  async login(username: string, password: string, authenticator = 'password') {
    try {
      const response = await this.api.auth.signIn(
        { username, password },
        authenticator
      );
      
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }
  
  async logout() {
    try {
      await this.api.auth.signOut();
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    }
  }
  
  async register(userData: any, authenticator = 'password') {
    try {
      const response = await this.api.auth.signUp(userData, authenticator);
      return response.data;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }
  
  isAuthenticated() {
    return !!this.api.auth.token;
  }
  
  getCurrentUser() {
    return this.api.request({
      url: 'users:profile',
      method: 'get',
    });
  }
}
```

**插件入口** (`src/client/index.tsx`):

```typescript
import { Plugin } from '@nocobase/client';
import { AuthService } from './services/auth-service';

class AuthPlugin extends Plugin {
  async load() {
    // 创建认证服务实例
    const authService = new AuthService(this.app.apiClient);
    
    // 将服务添加到应用上下文
    this.app.authService = authService;
    
    // 监听认证状态变化
    this.app.apiClient.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // 处理认证失败
        if (error.response?.status === 401) {
          // 清除认证信息
          this.app.authService?.logout();
          // 重定向到登录页面
          window.location.href = '/signin';
        }
        return Promise.reject(error);
      }
    );
  }
}

// 扩展应用类型定义
declare module '@nocobase/client' {
  interface Application {
    authService: AuthService;
  }
}

export default AuthPlugin;
```

## 最佳实践

1. **代码复用**：将通用功能提取为独立模块
2. **错误处理**：合理处理异常情况并提供友好的错误信息
3. **性能优化**：避免不必要的计算和数据库查询
4. **安全性**：验证用户输入，防止安全漏洞
5. **可测试性**：编写易于测试的代码
6. **文档化**：为插件提供清晰的文档说明
7. **SDK 使用**：合理使用 SDK 进行 API 调用，注意错误处理和认证管理
