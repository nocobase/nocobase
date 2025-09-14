# NocoBase SDK 使用指南

## 概述

NocoBase SDK (`@nocobase/sdk`) 是一个基于 axios 封装的客户端库，用于在 NocoBase 应用中进行 HTTP 请求和资源操作。它提供了便捷的 API 客户端和认证管理功能。

## 安装

NocoBase SDK 通常作为 NocoBase 项目的一部分自动安装。如果需要单独安装，可以使用以下命令：

```bash
yarn add @nocobase/sdk
# 或
npm install @nocobase/sdk
```

## 核心组件

### APIClient

APIClient 是 SDK 的核心类，基于 axios 封装，提供了便捷的 HTTP 请求方法和资源操作接口。

#### 基本用法

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 常规请求
const response = await api.request({
  url: 'users:list',
  method: 'get'
});

// 资源操作
const response = await api.resource('users').list();
```

#### 配置选项

APIClient 支持所有 axios 配置选项，以及以下扩展选项：

```typescript
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
  timeout: 5000,
  storageType: 'localStorage', // 'localStorage' | 'sessionStorage' | 'memory'
  storagePrefix: 'MYAPP_' // 存储键前缀
});
```

#### 资源操作

APIClient 提供了便捷的资源操作方法：

```typescript
// 列表查询
const response = await api.resource('posts').list({
  pageSize: 20,
  page: 1,
  filter: { status: 'published' }
});

// 创建资源
const response = await api.resource('posts').create({
  values: {
    title: 'New Post',
    content: 'Post content'
  }
});

// 获取单个资源
const response = await api.resource('posts').get({
  filterByTk: 1
});

// 更新资源
const response = await api.resource('posts').update({
  filterByTk: 1,
  values: {
    title: 'Updated Title'
  }
});

// 删除资源
const response = await api.resource('posts').destroy({
  filterByTk: 1
});
```

### Auth 认证管理

Auth 类用于管理用户认证信息，包括令牌、角色、语言等。

#### 基本用法

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api'
});

// 用户登录
await api.auth.signIn({
  username: 'admin',
  password: 'admin'
});

// 用户登出
await api.auth.signOut();

// 获取当前用户信息
const token = api.auth.token;
const role = api.auth.role;
const locale = api.auth.locale;
```

#### 认证相关方法

```typescript
// 登录
const response = await api.auth.signIn({
  username: 'user@example.com',
  password: 'password'
}, 'password'); // 认证器类型

// 注册
const response = await api.auth.signUp({
  username: 'newuser',
  email: 'user@example.com',
  password: 'password'
}, 'password');

// 忘记密码
const response = await api.auth.lostPassword({
  email: 'user@example.com'
});

// 重置密码
const response = await api.auth.resetPassword({
  token: 'reset_token',
  password: 'new_password'
});
```

## 实际应用示例

### 1. 创建数据管理客户端

```typescript
import { APIClient } from '@nocobase/sdk';

class DataManager {
  private api: APIClient;
  
  constructor(baseURL: string) {
    this.api = new APIClient({
      baseURL: `${baseURL}/api`
    });
  }
  
  async getPosts(page = 1, pageSize = 20) {
    try {
      const response = await this.api.resource('posts').list({
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
      const response = await this.api.resource('posts').create({
        values: data
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
        values: data
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
        filterByTk: id
      });
      return response.data;
    } catch (error) {
      console.error('删除文章失败:', error);
      throw error;
    }
  }
}

// 使用示例
const dataManager = new DataManager('http://localhost:13000');

// 获取文章列表
const posts = await dataManager.getPosts(1, 10);

// 创建新文章
const newPost = await dataManager.createPost({
  title: '新文章',
  content: '文章内容'
});
```

### 2. 用户认证管理

```typescript
import { APIClient } from '@nocobase/sdk';

class AuthManager {
  private api: APIClient;
  
  constructor(baseURL: string) {
    this.api = new APIClient({
      baseURL: `${baseURL}/api`
    });
  }
  
  async login(username: string, password: string) {
    try {
      const response = await this.api.auth.signIn({
        username,
        password
      });
      
      // 存储用户信息
      console.log('登录成功', response.data);
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }
  
  async logout() {
    try {
      await this.api.auth.signOut();
      console.log('登出成功');
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    }
  }
  
  isAuthenticated() {
    return !!this.api.auth.token;
  }
  
  getCurrentUser() {
    // 这需要后端提供相应的接口
    return this.api.request({
      url: 'users:profile',
      method: 'get'
    });
  }
}

// 使用示例
const authManager = new AuthManager('http://localhost:13000');

// 用户登录
await authManager.login('admin', 'admin');

// 检查认证状态
if (authManager.isAuthenticated()) {
  console.log('用户已登录');
}

// 获取当前用户信息
const user = await authManager.getCurrentUser();
```

### 3. 文件上传

```typescript
import { APIClient } from '@nocobase/sdk';

class FileManager {
  private api: APIClient;
  
  constructor(baseURL: string) {
    this.api = new APIClient({
      baseURL: `${baseURL}/api`
    });
  }
  
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await this.api.request({
        url: 'attachments:upload',
        method: 'post',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }
}
```

## 高级用法

### 自定义存储

```typescript
import { APIClient, Storage } from '@nocobase/sdk';

class CustomStorage extends Storage {
  private storage: Map<string, string> = new Map();
  
  clear() {
    this.storage.clear();
  }
  
  getItem(key: string) {
    return this.storage.get(key) || null;
  }
  
  setItem(key: string, value: string) {
    this.storage.set(key, value);
  }
  
  removeItem(key: string) {
    this.storage.delete(key);
  }
}

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
  storageClass: CustomStorage
});
```

### 自定义认证类

```typescript
import { APIClient, Auth } from '@nocobase/sdk';

class CustomAuth extends Auth {
  constructor(api: APIClient) {
    super(api);
  }
  
  // 自定义中间件
  middleware(config: any) {
    // 调用父类中间件
    config = super.middleware(config);
    
    // 添加自定义头部
    config.headers['X-Custom-Header'] = 'custom-value';
    
    return config;
  }
  
  // 自定义登录方法
  async customSignIn(credentials: any) {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:customSignIn',
      data: credentials
    });
    
    const data = response.data.data;
    this.setToken(data.token);
    
    return response;
  }
}

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
  authClass: CustomAuth
});
```

## 错误处理

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api'
});

try {
  const response = await api.resource('posts').list();
  console.log(response.data);
} catch (error) {
  if (error.response) {
    // 服务器返回了错误状态码
    console.error('请求失败:', error.response.status, error.response.data);
  } else if (error.request) {
    // 请求已发出但没有收到响应
    console.error('网络错误:', error.request);
  } else {
    // 其他错误
    console.error('错误:', error.message);
  }
}
```

## 最佳实践

1. **统一管理 API 客户端实例**：
   ```typescript
   // api/client.ts
   import { APIClient } from '@nocobase/sdk';
   
   const api = new APIClient({
     baseURL: process.env.API_BASE_URL || 'http://localhost:13000/api'
   });
   
   export default api;
   ```

2. **封装资源操作**：
   ```typescript
   // api/resources/posts.ts
   import api from '../client';
   
   export const posts = {
     list: (params?: any) => api.resource('posts').list(params),
     create: (values: any) => api.resource('posts').create({ values }),
     get: (id: number) => api.resource('posts').get({ filterByTk: id }),
     update: (id: number, values: any) => api.resource('posts').update({ filterByTk: id, values }),
     destroy: (id: number) => api.resource('posts').destroy({ filterByTk: id })
   };
   ```

3. **适当的错误处理**：
   ```typescript
   // utils/errorHandler.ts
   export function handleApiError(error: any) {
     if (error.response?.status === 401) {
       // 处理未认证错误
       window.location.href = '/login';
     } else if (error.response?.status === 403) {
       // 处理权限错误
       alert('权限不足');
     } else {
       // 处理其他错误
       alert(error.response?.data?.message || '操作失败');
     }
   }
   ```

## 参考资源

- [NocoBase 官方文档](https://docs.nocobase.com)
- [Axios 文档](https://axios-http.com)
- [NocoBase GitHub 仓库](https://github.com/nocobase/nocobase)
