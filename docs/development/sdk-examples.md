# NocoBase SDK 使用示例

本文档提供了 NocoBase SDK (`@nocobase/sdk`) 的详细使用示例，帮助开发者更好地理解和使用 SDK 进行开发。

## 1. 基础使用示例

### 1.1 创建 API 客户端

```typescript
import { APIClient } from '@nocobase/sdk';

// 基本配置
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 带自定义配置
const apiWithConfig = new APIClient({
  baseURL: 'http://localhost:13000/api',
  timeout: 10000,
  storageType: 'localStorage',
  storagePrefix: 'MYAPP_'
});
```

### 1.2 基本资源操作

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 列表查询
async function listPosts() {
  try {
    const response = await api.resource('posts').list({
      page: 1,
      pageSize: 20,
      filter: { status: 'published' },
      sort: ['-createdAt'],
      fields: ['id', 'title', 'content', 'createdAt']
    });
    
    console.log('Posts:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to list posts:', error);
    throw error;
  }
}

// 获取单个资源
async function getPost(id: number) {
  try {
    const response = await api.resource('posts').get({
      filterByTk: id,
      fields: ['id', 'title', 'content', 'createdAt', 'author']
    });
    
    console.log('Post:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to get post:', error);
    throw error;
  }
}

// 创建资源
async function createPost(data: any) {
  try {
    const response = await api.resource('posts').create({
      values: data
    });
    
    console.log('Created post:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create post:', error);
    throw error;
  }
}

// 更新资源
async function updatePost(id: number, data: any) {
  try {
    const response = await api.resource('posts').update({
      filterByTk: id,
      values: data
    });
    
    console.log('Updated post:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to update post:', error);
    throw error;
  }
}

// 删除资源
async function deletePost(id: number) {
  try {
    const response = await api.resource('posts').destroy({
      filterByTk: id
    });
    
    console.log('Deleted post:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to delete post:', error);
    throw error;
  }
}
```

## 2. 认证管理示例

### 2.1 用户登录

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 基本登录
async function login(username: string, password: string) {
  try {
    const response = await api.auth.signIn({
      username,
      password
    });
    
    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// 使用特定认证器登录
async function loginWithAuthenticator(username: string, password: string, authenticator: string) {
  try {
    const response = await api.auth.signIn(
      { username, password },
      authenticator
    );
    
    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

### 2.2 用户注册

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

async function register(userData: any) {
  try {
    const response = await api.auth.signUp(userData);
    
    console.log('Registration successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}
```

### 2.3 密码重置

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 请求密码重置
async function requestPasswordReset(email: string) {
  try {
    const response = await api.auth.lostPassword({ email });
    
    console.log('Password reset request sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Password reset request failed:', error);
    throw error;
  }
}

// 重置密码
async function resetPassword(token: string, newPassword: string) {
  try {
    const response = await api.auth.resetPassword({
      token,
      password: newPassword
    });
    
    console.log('Password reset successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Password reset failed:', error);
    throw error;
  }
}
```

### 2.4 认证状态管理

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 检查认证状态
function isAuthenticated() {
  return !!api.auth.token;
}

// 获取当前用户信息
async function getCurrentUser() {
  if (!isAuthenticated()) {
    throw new Error('User not authenticated');
  }
  
  try {
    const response = await api.request({
      url: 'users:profile',
      method: 'get'
    });
    
    console.log('Current user:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to get current user:', error);
    throw error;
  }
}

// 登出
async function logout() {
  try {
    await api.auth.signOut();
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}
```

## 3. 高级使用示例

### 3.1 自定义存储

```typescript
import { APIClient, Storage } from '@nocobase/sdk';

// 自定义存储类
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

// 使用自定义存储
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
  storageClass: CustomStorage
});
```

### 3.2 自定义认证类

```typescript
import { APIClient, Auth } from '@nocobase/sdk';

// 自定义认证类
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

// 使用自定义认证类
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
  authClass: CustomAuth
});
```

### 3.3 请求拦截器

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 添加请求拦截器
api.axios.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    console.log('Request:', config);
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
api.axios.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    console.log('Response:', response);
    return response;
  },
  (error) => {
    // 对响应错误做点什么
    console.error('Response error:', error);
    return Promise.reject(error);
  }
);
```

## 4. 错误处理示例

### 4.1 基本错误处理

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

async function handleApiError() {
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
}
```

### 4.2 自定义错误处理

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

class ApiErrorHandler {
  private maxRetries = 3;
  
  async requestWithRetry(config: any, retryCount = 0) {
    try {
      return await api.request(config);
    } catch (error) {
      // 检查是否应该重试
      if (this.shouldRetry(error) && retryCount < this.maxRetries) {
        // 等待一段时间后重试
        await this.wait(1000 * Math.pow(2, retryCount)); // 指数退避
        return this.requestWithRetry(config, retryCount + 1);
      }
      
      // 记录错误并重新抛出
      console.error('API request failed:', error);
      throw this.handleApiError(error);
    }
  }
  
  private shouldRetry(error: any) {
    // 网络错误或服务器错误时重试
    return (
      error.code === 'NETWORK_ERROR' ||
      (error.response && error.response.status >= 500)
    );
  }
  
  private handleApiError(error: any) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未认证，可能需要重新登录
          return new Error('请先登录');
        case 403:
          // 无权限
          return new Error('权限不足');
        case 404:
          // 资源不存在
          return new Error('请求的资源不存在');
        case 422:
          // 验证错误
          return new Error('数据验证失败');
        default:
          return new Error(`请求失败: ${error.response.status}`);
      }
    } else if (error.request) {
      return new Error('网络连接失败，请检查网络设置');
    } else {
      return new Error(`请求错误: ${error.message}`);
    }
  }
  
  private wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const errorHandler = new ApiErrorHandler();

// 使用错误处理
async function fetchPosts() {
  try {
    const response = await errorHandler.requestWithRetry({
      url: 'posts:list',
      method: 'get'
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch posts:', error.message);
    throw error;
  }
}
```

## 5. 实际应用场景示例

### 5.1 数据管理服务

```typescript
import { APIClient } from '@nocobase/sdk';

class DataManager {
  private api: APIClient;
  
  constructor(baseURL: string) {
    this.api = new APIClient({
      baseURL: `${baseURL}/api`
    });
  }
  
  // 获取文章列表
  async getPosts(options: { 
    page?: number; 
    pageSize?: number; 
    filter?: any;
    sort?: string[];
  } = {}) {
    const { page = 1, pageSize = 20, filter, sort } = options;
    
    try {
      const response = await this.api.resource('posts').list({
        page,
        pageSize,
        filter,
        sort
      });
      
      return {
        data: response.data.data,
        meta: response.data.meta
      };
    } catch (error) {
      console.error('获取文章列表失败:', error);
      throw error;
    }
  }
  
  // 创建文章
  async createPost(data: any) {
    try {
      const response = await this.api.resource('posts').create({
        values: data
      });
      
      return response.data.data;
    } catch (error) {
      console.error('创建文章失败:', error);
      throw error;
    }
  }
  
  // 更新文章
  async updatePost(id: number, data: any) {
    try {
      const response = await this.api.resource('posts').update({
        filterByTk: id,
        values: data
      });
      
      return response.data.data;
    } catch (error) {
      console.error('更新文章失败:', error);
      throw error;
    }
  }
  
  // 删除文章
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
  
  // 批量操作
  async batchDeletePost(ids: number[]) {
    try {
      const promises = ids.map(id => 
        this.api.resource('posts').destroy({ filterByTk: id })
      );
      
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    } catch (error) {
      console.error('批量删除文章失败:', error);
      throw error;
    }
  }
}

// 使用数据管理服务
const dataManager = new DataManager('http://localhost:13000');

// 获取文章列表
dataManager.getPosts({ 
  page: 1, 
  pageSize: 10, 
  filter: { status: 'published' },
  sort: ['-createdAt']
}).then(result => {
  console.log('Posts:', result.data);
  console.log('Total:', result.meta.count);
});
```

### 5.2 认证服务

```typescript
import { APIClient } from '@nocobase/sdk';

class AuthService {
  private api: APIClient;
  
  constructor(baseURL: string) {
    this.api = new APIClient({
      baseURL: `${baseURL}/api`
    });
  }
  
  // 登录
  async login(credentials: { username: string; password: string }) {
    try {
      const response = await this.api.auth.signIn(credentials);
      
      // 存储用户信息
      localStorage.setItem('user', JSON.stringify(response.data.data));
      
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }
  
  // 登出
  async logout() {
    try {
      await this.api.auth.signOut();
      
      // 清除本地存储
      localStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    }
  }
  
  // 检查认证状态
  isAuthenticated() {
    return !!this.api.auth.token;
  }
  
  // 获取当前用户
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  
  // 刷新认证令牌
  async refreshToken() {
    try {
      const response = await this.api.request({
        url: 'auth:refresh',
        method: 'post'
      });
      
      const { token } = response.data.data;
      this.api.auth.setToken(token);
      
      return response.data;
    } catch (error) {
      console.error('刷新令牌失败:', error);
      throw error;
    }
  }
}

// 使用认证服务
const authService = new AuthService('http://localhost:13000');

// 登录
authService.login({ 
  username: 'admin', 
  password: 'admin' 
}).then(result => {
  console.log('登录成功:', result.data);
});

// 检查认证状态
if (authService.isAuthenticated()) {
  console.log('用户已登录');
  const user = authService.getCurrentUser();
  console.log('当前用户:', user);
}
```

### 5.3 文件上传服务

```typescript
import { APIClient } from '@nocobase/sdk';

class FileUploadService {
  private api: APIClient;
  
  constructor(baseURL: string) {
    this.api = new APIClient({
      baseURL: `${baseURL}/api`
    });
  }
  
  // 上传单个文件
  async uploadFile(file: File, options: { 
    collectionName?: string;
    fieldName?: string;
  } = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.collectionName) {
      formData.append('collectionName', options.collectionName);
    }
    
    if (options.fieldName) {
      formData.append('fieldName', options.fieldName);
    }
    
    try {
      const response = await this.api.request({
        url: 'attachments:upload',
        method: 'post',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }
  
  // 批量上传文件
  async uploadFiles(files: File[], options: { 
    collectionName?: string;
    fieldName?: string;
  } = {}) {
    try {
      const promises = files.map(file => 
        this.uploadFile(file, options)
      );
      
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('批量文件上传失败:', error);
      throw error;
    }
  }
  
  // 删除文件
  async deleteFile(id: number) {
    try {
      const response = await this.api.resource('attachments').destroy({
        filterByTk: id
      });
      
      return response.data;
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }
}

// 使用文件上传服务
const fileService = new FileUploadService('http://localhost:13000');

// 上传文件
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
if (fileInput && fileInput.files) {
  fileService.uploadFile(fileInput.files[0], {
    collectionName: 'posts',
    fieldName: 'cover'
  }).then(result => {
    console.log('文件上传成功:', result);
  });
}
```

## 6. 最佳实践

### 6.1 统一管理 API 客户端实例

```typescript
// api/client.ts
import { APIClient } from '@nocobase/sdk';

class ApiClientManager {
  private static instance: APIClient;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new APIClient({
        baseURL: process.env.API_BASE_URL || 'http://localhost:13000/api',
        timeout: 10000
      });
      
      // 添加全局错误处理
      this.instance.axios.interceptors.response.use(
        response => response,
        error => {
          if (error.response?.status === 401) {
            // 处理未认证错误
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );
    }
    
    return this.instance;
  }
}

export default ApiClientManager.getInstance();
```

### 6.2 封装资源操作

```typescript
// api/resources/posts.ts
import api from '../client';

export const posts = {
  list: (params?: any) => api.resource('posts').list(params),
  create: (values: any) => api.resource('posts').create({ values }),
  get: (id: number) => api.resource('posts').get({ filterByTk: id }),
  update: (id: number, values: any) => api.resource('posts').update({ filterByTk: id, values }),
  destroy: (id: number) => api.resource('posts').destroy({ filterByTk: id }),
  
  // 自定义操作
  publish: (id: number) => api.request({
    url: `posts:${id}/publish`,
    method: 'post'
  }),
  
  batchPublish: (ids: number[]) => api.request({
    url: 'posts:batchPublish',
    method: 'post',
    data: { ids }
  })
};
```

### 6.3 适当的错误处理

```typescript
// utils/errorHandler.ts
export function handleApiError(error: any) {
  if (error.response?.status === 401) {
    // 处理未认证错误
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // 处理权限错误
    alert('权限不足');
  } else if (error.response?.status === 422) {
    // 处理验证错误
    const errors = error.response.data.errors;
    alert(errors.map((e: any) => e.message).join('\n'));
  } else {
    // 处理其他错误
    alert(error.response?.data?.message || '操作失败');
  }
}
```

通过这些示例，您可以更好地理解和使用 NocoBase SDK 进行开发。在实际项目中，请根据具体需求调整和扩展这些示例。