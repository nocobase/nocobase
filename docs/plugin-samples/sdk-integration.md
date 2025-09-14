# SDK 集成示例

本文档展示了如何在 NocoBase 插件中集成和使用 NocoBase SDK。

## 1. 客户端 SDK 集成

### 1.1 基本集成

在插件的客户端部分集成 SDK：

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import { APIClient } from '@nocobase/sdk';

class MyPlugin extends Plugin {
  private apiClient: APIClient;
  
  async load() {
    // 使用应用提供的 API 客户端
    this.apiClient = this.app.apiClient;
    
    // 或创建自定义客户端
    this.apiClient = new APIClient({
      baseURL: this.app.apiClient.axios.defaults.baseURL,
      // 自定义配置
    });
  }
  
  // 提供便捷方法
  getApiClient() {
    return this.apiClient;
  }
}

export default MyPlugin;
```

### 1.2 数据服务集成

创建数据服务类来管理 API 调用：

```typescript
// src/client/services/data-service.ts
import { APIClient } from '@nocobase/sdk';

export class DataService {
  constructor(private apiClient: APIClient) {}
  
  async getPosts(options: { page?: number; pageSize?: number } = {}) {
    const { page = 1, pageSize = 20 } = options;
    
    try {
      const response = await this.apiClient.resource('posts').list({
        page,
        pageSize
      });
      
      return response.data;
    } catch (error) {
      console.error('获取文章列表失败:', error);
      throw error;
    }
  }
  
  async createPost(data: any) {
    try {
      const response = await this.apiClient.resource('posts').create({
        values: data
      });
      
      return response.data;
    } catch (error) {
      console.error('创建文章失败:', error);
      throw error;
    }
  }
}

// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import { DataService } from './services/data-service';

class MyPlugin extends Plugin {
  async load() {
    // 创建数据服务实例
    const dataService = new DataService(this.app.apiClient);
    
    // 将服务添加到应用上下文
    this.app.dataService = dataService;
  }
}

export default MyPlugin;
```

## 2. 服务端 SDK 集成

### 2.1 内部 API 调用

在插件的服务端部分使用 SDK 进行内部调用：

```typescript
// src/server/index.ts
import { Plugin } from '@nocobase/server';
import { APIClient } from '@nocobase/sdk';

export class MyPlugin extends Plugin {
  private internalClient: APIClient;
  
  async load() {
    // 创建内部 API 客户端
    this.internalClient = new APIClient({
      baseURL: this.app.url + '/api',
    });
    
    // 注册定时任务
    this.app.schedule.register('sync-data', '0 */30 * * * *', async () => {
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

export default MyPlugin;
```

### 2.2 命令行工具集成

创建使用 SDK 的命令行工具：

```typescript
// src/server/commands/sync-command.ts
import { APIClient } from '@nocobase/sdk';

export class SyncCommand {
  constructor(private apiClient: APIClient) {}
  
  async execute() {
    try {
      const response = await this.apiClient.resource('posts').list({
        pageSize: 100
      });
      
      console.log(`同步了 ${response.data.data.length} 条记录`);
      return response.data;
    } catch (error) {
      console.error('同步失败:', error);
      throw error;
    }
  }
}

// src/server/index.ts
import { Plugin } from '@nocobase/server';
import { SyncCommand } from './commands/sync-command';
import { APIClient } from '@nocobase/sdk';

export class MyPlugin extends Plugin {
  private internalClient: APIClient;
  
  async load() {
    // 创建内部客户端
    this.internalClient = new APIClient({
      baseURL: this.app.url + '/api',
    });
    
    // 注册命令
    this.app.command('sync-posts').action(async () => {
      const syncCommand = new SyncCommand(this.internalClient);
      await syncCommand.execute();
    });
  }
}

export default MyPlugin;
```

## 3. 认证集成

### 3.1 认证服务

创建认证服务来管理用户认证：

```typescript
// src/client/services/auth-service.ts
import { APIClient } from '@nocobase/sdk';

export class AuthService {
  constructor(private apiClient: APIClient) {
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // 添加响应拦截器处理认证失败
    this.apiClient.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 处理认证失败
          this.handleAuthFailure();
        }
        return Promise.reject(error);
      }
    );
  }
  
  async login(username: string, password: string) {
    try {
      const response = await this.apiClient.auth.signIn({
        username,
        password
      });
      
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }
  
  async logout() {
    try {
      await this.apiClient.auth.signOut();
      this.handleLogout();
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    }
  }
  
  isAuthenticated() {
    return !!this.apiClient.auth.token;
  }
  
  private handleAuthFailure() {
    // 清除本地认证信息
    // 重定向到登录页面
    window.location.href = '/login';
  }
  
  private handleLogout() {
    // 清除本地状态
    // 重定向到首页
    window.location.href = '/';
  }
}
```

### 3.2 认证状态管理

在插件中管理认证状态：

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import { AuthService } from './services/auth-service';

class MyPlugin extends Plugin {
  async load() {
    // 创建认证服务实例
    const authService = new AuthService(this.app.apiClient);
    
    // 将服务添加到应用上下文
    this.app.authService = authService;
    
    // 监听认证状态变化
    this.setupAuthListeners();
  }
  
  private setupAuthListeners() {
    // 监听登录事件
    this.app.on('user:login', (userData) => {
      console.log('用户登录:', userData);
    });
    
    // 监听登出事件
    this.app.on('user:logout', () => {
      console.log('用户登出');
    });
  }
}

export default MyPlugin;
```

## 4. 错误处理集成

### 4.1 统一错误处理

创建统一的错误处理机制：

```typescript
// src/client/utils/error-handler.ts
import { APIClient } from '@nocobase/sdk';

export class ErrorHandler {
  constructor(private apiClient: APIClient) {}
  
  setupGlobalErrorHandler() {
    this.apiClient.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }
  
  private handleApiError(error: any) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          this.handleUnauthorizedError();
          break;
        case 403:
          this.handleForbiddenError();
          break;
        case 404:
          this.handleNotFoundError();
          break;
        case 422:
          this.handleValidationError(error.response.data);
          break;
        default:
          this.handleGenericError(error.response);
      }
    } else if (error.request) {
      this.handleNetworkError();
    } else {
      this.handleUnknownError(error.message);
    }
  }
  
  private handleUnauthorizedError() {
    // 未认证错误处理
    alert('请先登录');
    window.location.href = '/login';
  }
  
  private handleForbiddenError() {
    // 权限错误处理
    alert('权限不足');
  }
  
  private handleNotFoundError() {
    // 资源不存在错误处理
    alert('请求的资源不存在');
  }
  
  private handleValidationError(errorData: any) {
    // 验证错误处理
    const errors = errorData.errors || [];
    const messages = errors.map((e: any) => e.message).join('\n');
    alert(messages || '数据验证失败');
  }
  
  private handleGenericError(response: any) {
    // 通用错误处理
    const message = response.data?.message || `请求失败: ${response.status}`;
    alert(message);
  }
  
  private handleNetworkError() {
    // 网络错误处理
    alert('网络连接失败，请检查网络设置');
  }
  
  private handleUnknownError(message: string) {
    // 未知错误处理
    alert(`请求错误: ${message}`);
  }
}
```

### 4.2 在插件中使用错误处理

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import { ErrorHandler } from './utils/error-handler';

class MyPlugin extends Plugin {
  async load() {
    // 创建错误处理器
    const errorHandler = new ErrorHandler(this.app.apiClient);
    
    // 设置全局错误处理
    errorHandler.setupGlobalErrorHandler();
  }
}

export default MyPlugin;
```

## 5. 最佳实践

### 5.1 统一 API 客户端管理

```typescript
// src/client/api/client-manager.ts
import { APIClient } from '@nocobase/sdk';

class ApiClientManager {
  private static instance: APIClient;
  
  static getInstance(baseURL: string) {
    if (!this.instance) {
      this.instance = new APIClient({
        baseURL,
        timeout: 10000,
        storageType: 'localStorage'
      });
      
      // 添加通用配置
      this.setupInterceptors(this.instance);
    }
    
    return this.instance;
  }
  
  private static setupInterceptors(apiClient: APIClient) {
    // 请求拦截器
    apiClient.axios.interceptors.request.use(
      (config) => {
        // 添加通用头部
        config.headers['X-App-Version'] = '1.0.0';
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // 响应拦截器
    apiClient.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // 统一错误处理
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }
}

export default ApiClientManager;
```

### 5.2 资源操作封装

```typescript
// src/client/api/resources/posts.ts
import ApiClientManager from '../client-manager';

const apiClient = ApiClientManager.getInstance('/api');

export const posts = {
  list: (params?: any) => apiClient.resource('posts').list(params),
  get: (id: number) => apiClient.resource('posts').get({ filterByTk: id }),
  create: (values: any) => apiClient.resource('posts').create({ values }),
  update: (id: number, values: any) => apiClient.resource('posts').update({ filterByTk: id, values }),
  destroy: (id: number) => apiClient.resource('posts').destroy({ filterByTk: id }),
  
  // 自定义操作
  publish: (id: number) => apiClient.request({
    url: `posts:${id}/publish`,
    method: 'post'
  })
};
```

通过这些示例，您可以了解如何在 NocoBase 插件中有效地集成和使用 SDK，实现各种功能需求。