# SDK 高级使用示例

本文档展示了 NocoBase SDK 的高级功能和最佳实践。

## 1. 自定义存储实现

### 1.1 内存存储

```typescript
import { Storage } from '@nocobase/sdk';

class MemoryStorage extends Storage {
  private data: Map<string, string> = new Map();
  
  clear(): void {
    this.data.clear();
  }
  
  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }
  
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

// 使用内存存储
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
  storageClass: MemoryStorage
});
```

### 1.2 Session Storage

```typescript
import { Storage } from '@nocobase/sdk';

class SessionStorage extends Storage {
  clear(): void {
    window.sessionStorage.clear();
  }
  
  getItem(key: string): string | null {
    return window.sessionStorage.getItem(key);
  }
  
  setItem(key: string, value: string): void {
    window.sessionStorage.setItem(key, value);
  }
  
  removeItem(key: string): void {
    window.sessionStorage.removeItem(key);
  }
}

// 使用 Session Storage
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
  storageClass: SessionStorage,
  storageType: 'sessionStorage'
});
```

## 2. 自定义认证类

### 2.1 基础自定义认证

```typescript
import { Auth, APIClient } from '@nocobase/sdk';

class CustomAuth extends Auth {
  constructor(api: APIClient) {
    super(api);
  }
  
  // 自定义中间件
  middleware(config: any) {
    config = super.middleware(config);
    
    // 添加自定义头部
    config.headers['X-App-Version'] = '1.0.0';
    config.headers['X-Device-ID'] = this.getDeviceId();
    
    return config;
  }
  
  private getDeviceId(): string {
    // 获取设备ID的逻辑
    return 'device-id-123';
  }
}

// 使用自定义认证类
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
  authClass: CustomAuth
});
```

### 2.2 多因素认证

```typescript
import { Auth, APIClient } from '@nocobase/sdk';

class MFAAuth extends Auth {
  private mfaToken: string | null = null;
  
  constructor(api: APIClient) {
    super(api);
  }
  
  // 重写登录方法支持MFA
  async signIn(credentials: any, authenticator?: string) {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:signIn',
      data: {
        ...credentials,
        authenticator
      }
    });
    
    const data = response.data.data;
    
    // 检查是否需要MFA
    if (data.mfaRequired) {
      // 需要MFA验证
      throw new Error('MFA_REQUIRED');
    }
    
    // 设置令牌
    this.setToken(data.token);
    return response;
  }
  
  // MFA验证方法
  async verifyMFA(mfaCode: string) {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:verifyMFA',
      data: {
        mfaCode
      }
    });
    
    const data = response.data.data;
    this.setToken(data.token);
    return response;
  }
  
  // 获取MFA状态
  isMFARequired(): boolean {
    return !!this.mfaToken;
  }
}

// 使用MFA认证
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
  authClass: MFAAuth
});
```

## 3. 请求缓存机制

### 3.1 基础缓存实现

```typescript
import { APIClient } from '@nocobase/sdk';

class ApiCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5分钟
  
  constructor(private apiClient: APIClient) {}
  
  async getWithCache(key: string, requestFn: () => Promise<any>, ttl?: number): Promise<any> {
    const cacheEntry = this.cache.get(key);
    const now = Date.now();
    
    // 检查缓存是否有效
    if (cacheEntry && (now - cacheEntry.timestamp) < (ttl || this.defaultTTL)) {
      return cacheEntry.data;
    }
    
    // 获取新数据
    const data = await requestFn();
    
    // 存储到缓存
    this.cache.set(key, {
      data,
      timestamp: now
    });
    
    return data;
  }
  
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  
  // 清除过期缓存
  cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= this.defaultTTL) {
        this.cache.delete(key);
      }
    }
  }
}

// 使用缓存
const api = new APIClient({
  baseURL: 'http://localhost:13000/api'
});

const cache = new ApiCache(api);

// 缓存获取用户列表
const users = await cache.getWithCache(
  'users:list',
  () => api.resource('users').list(),
  10 * 60 * 1000 // 10分钟缓存
);
```

### 3.2 智能缓存策略

```typescript
import { APIClient } from '@nocobase/sdk';

class SmartCache {
  private cache: Map<string, { data: any; timestamp: number; dependencies: string[] }> = new Map();
  private dependencyMap: Map<string, string[]> = new Map(); // resource -> keys
  
  constructor(private apiClient: APIClient) {}
  
  async getWithCache(
    key: string, 
    requestFn: () => Promise<any>, 
    dependencies: string[] = [],
    ttl: number = 5 * 60 * 1000
  ): Promise<any> {
    const cacheEntry = this.cache.get(key);
    const now = Date.now();
    
    // 检查缓存是否有效
    if (cacheEntry && (now - cacheEntry.timestamp) < ttl) {
      return cacheEntry.data;
    }
    
    // 获取新数据
    const data = await requestFn();
    
    // 存储到缓存
    this.cache.set(key, {
      data,
      timestamp: now,
      dependencies
    });
    
    // 更新依赖关系
    dependencies.forEach(dep => {
      const keys = this.dependencyMap.get(dep) || [];
      if (!keys.includes(key)) {
        keys.push(key);
        this.dependencyMap.set(dep, keys);
      }
    });
    
    return data;
  }
  
  // 当资源发生变化时，清除相关缓存
  invalidateResource(resource: string): void {
    const keys = this.dependencyMap.get(resource) || [];
    keys.forEach(key => {
      this.cache.delete(key);
    });
    
    // 清除依赖关系
    this.dependencyMap.delete(resource);
  }
  
  // 清除特定缓存
  clearCache(key: string): void {
    this.cache.delete(key);
  }
}

// 使用智能缓存
const api = new APIClient({
  baseURL: 'http://localhost:13000/api'
});

const smartCache = new SmartCache(api);

// 缓存获取文章列表，依赖于posts资源
const posts = await smartCache.getWithCache(
  'posts:list:page1',
  () => api.resource('posts').list({ page: 1, pageSize: 20 }),
  ['posts'], // 依赖posts资源
  5 * 60 * 1000 // 5分钟缓存
);

// 当创建新文章时，清除相关缓存
await api.resource('posts').create({
  values: { title: 'New Post', content: 'Content' }
});

// 清除posts相关的缓存
smartCache.invalidateResource('posts');
```

## 4. 请求重试机制

### 4.1 基础重试实现

```typescript
import { APIClient } from '@nocobase/sdk';

class RetryableApiClient extends APIClient {
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1秒
  
  constructor(config: any) {
    super(config);
    this.setupRetryInterceptor();
  }
  
  private setupRetryInterceptor() {
    this.axios.interceptors.response.use(
      response => response,
      async (error) => {
        const config = error.config;
        
        // 检查是否应该重试
        if (this.shouldRetry(error) && this.canRetry(config)) {
          config.retryCount = config.retryCount || 0;
          
          if (config.retryCount < this.maxRetries) {
            config.retryCount++;
            
            // 等待后重试
            await this.wait(this.retryDelay * config.retryCount);
            return this.axios(config);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  private shouldRetry(error: any): boolean {
    // 网络错误或服务器错误时重试
    return (
      error.code === 'NETWORK_ERROR' ||
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  }
  
  private canRetry(config: any): boolean {
    // 某些请求不应该重试
    return !['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase());
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用可重试的API客户端
const api = new RetryableApiClient({
  baseURL: 'http://localhost:13000/api'
});
```

### 4.2 指数退避重试

```typescript
import { APIClient } from '@nocobase/sdk';

class ExponentialBackoffApiClient extends APIClient {
  private maxRetries: number = 5;
  private baseDelay: number = 1000; // 1秒
  private maxDelay: number = 30000; // 30秒
  
  constructor(config: any) {
    super(config);
    this.setupExponentialBackoff();
  }
  
  private setupExponentialBackoff() {
    this.axios.interceptors.response.use(
      response => response,
      async (error) => {
        const config = error.config;
        
        if (this.shouldRetry(error) && this.canRetry(config)) {
          config.retryCount = config.retryCount || 0;
          
          if (config.retryCount < this.maxRetries) {
            config.retryCount++;
            
            // 计算延迟时间（指数退避）
            const delay = Math.min(
              this.baseDelay * Math.pow(2, config.retryCount - 1),
              this.maxDelay
            );
            
            // 添加随机抖动
            const jitter = Math.random() * 1000;
            const finalDelay = delay + jitter;
            
            await this.wait(finalDelay);
            return this.axios(config);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  private shouldRetry(error: any): boolean {
    // 只对特定错误重试
    return (
      error.code === 'NETWORK_ERROR' ||
      !error.response ||
      error.response.status === 429 || // 限流
      error.response.status >= 500 // 服务器错误
    );
  }
  
  private canRetry(config: any): boolean {
    // 幂等请求可以重试
    return ['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase());
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用指数退避API客户端
const api = new ExponentialBackoffApiClient({
  baseURL: 'http://localhost:13000/api'
});
```

## 5. 批量请求处理

### 5.1 批量资源操作

```typescript
import { APIClient } from '@nocobase/sdk';

class BatchOperations {
  constructor(private apiClient: APIClient) {}
  
  // 批量创建
  async batchCreate(resource: string, items: any[]): Promise<any[]> {
    const promises = items.map(item => 
      this.apiClient.resource(resource).create({ values: item })
    );
    
    try {
      const responses = await Promise.all(promises);
      return responses.map(response => response.data.data);
    } catch (error) {
      console.error('批量创建失败:', error);
      throw error;
    }
  }
  
  // 批量更新
  async batchUpdate(resource: string, updates: { id: number; values: any }[]): Promise<any[]> {
    const promises = updates.map(update => 
      this.apiClient.resource(resource).update({
        filterByTk: update.id,
        values: update.values
      })
    );
    
    try {
      const responses = await Promise.all(promises);
      return responses.map(response => response.data.data);
    } catch (error) {
      console.error('批量更新失败:', error);
      throw error;
    }
  }
  
  // 批量删除
  async batchDelete(resource: string, ids: number[]): Promise<any[]> {
    const promises = ids.map(id => 
      this.apiClient.resource(resource).destroy({ filterByTk: id })
    );
    
    try {
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    } catch (error) {
      console.error('批量删除失败:', error);
      throw error;
    }
  }
  
  // 并行获取多个资源
  async fetchMultipleResources(resources: { name: string; params?: any }[]): Promise<any> {
    const promises = resources.map(resource => 
      this.apiClient.resource(resource.name).list(resource.params)
    );
    
    try {
      const responses = await Promise.all(promises);
      const result: any = {};
      
      resources.forEach((resource, index) => {
        result[resource.name] = responses[index].data;
      });
      
      return result;
    } catch (error) {
      console.error('获取多个资源失败:', error);
      throw error;
    }
  }
}

// 使用批量操作
const api = new APIClient({
  baseURL: 'http://localhost:13000/api'
});

const batchOps = new BatchOperations(api);

// 批量创建文章
const newPosts = [
  { title: 'Post 1', content: 'Content 1' },
  { title: 'Post 2', content: 'Content 2' },
  { title: 'Post 3', content: 'Content 3' }
];

const createdPosts = await batchOps.batchCreate('posts', newPosts);

// 并行获取多个资源
const allData = await batchOps.fetchMultipleResources([
  { name: 'posts', params: { pageSize: 10 } },
  { name: 'users', params: { pageSize: 10 } },
  { name: 'tags', params: { pageSize: 10 } }
]);
```

## 6. 进度监控和取消

### 6.1 上传进度监控

```typescript
import { APIClient } from '@nocobase/sdk';

class UploadManager {
  constructor(private apiClient: APIClient) {}
  
  async uploadFileWithProgress(
    file: File, 
    onProgress?: (progress: number) => void,
    onCancel?: () => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    // 创建取消令牌
    const CancelToken = this.apiClient.axios.CancelToken;
    const source = CancelToken.source();
    
    try {
      const response = await this.apiClient.request({
        url: 'attachments:upload',
        method: 'post',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(progress);
          }
        },
        cancelToken: source.token
      });
      
      return response.data;
    } catch (error) {
      if (this.apiClient.axios.isCancel(error)) {
        onCancel?.();
        console.log('请求已取消');
      }
      throw error;
    }
  }
  
  // 取消上传
  cancelUpload(cancelSource: any) {
    cancelSource.cancel('用户取消上传');
  }
}

// 使用上传管理器
const api = new APIClient({
  baseURL: 'http://localhost:13000/api'
});

const uploadManager = new UploadManager(api);

// 上传文件并监控进度
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
if (fileInput && fileInput.files) {
  const file = fileInput.files[0];
  
  uploadManager.uploadFileWithProgress(
    file,
    (progress) => {
      console.log(`上传进度: ${progress}%`);
      // 更新进度条
      updateProgressBar(progress);
    },
    () => {
      console.log('上传已取消');
    }
  ).then(result => {
    console.log('上传成功:', result);
  });
}
```

## 7. 类型安全和接口定义

### 7.1 资源接口定义

```typescript
import { APIClient, IResource } from '@nocobase/sdk';

// 定义数据模型接口
interface Post {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  author?: User;
  tags?: Tag[];
}

interface User {
  id: number;
  username: string;
  email: string;
  nickname: string;
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

// 定义资源操作接口
interface PostResource extends IResource {
  list(params?: { 
    page?: number; 
    pageSize?: number; 
    filter?: any;
    sort?: string[];
    fields?: string[];
  }): Promise<{ data: Post[]; meta: any }>;
  
  get(params?: { 
    filterByTk?: number;
    fields?: string[];
  }): Promise<{ data: Post }>;
  
  create(params?: { 
    values: Partial<Post>;
    whitelist?: string[];
    blacklist?: string[];
  }): Promise<{ data: Post }>;
  
  update(params?: { 
    filterByTk?: number;
    values: Partial<Post>;
    whitelist?: string[];
    blacklist?: string[];
  }): Promise<{ data: Post }>;
  
  destroy(params?: { 
    filterByTk?: number;
  }): Promise<void>;
  
  // 自定义操作
  publish(params?: { 
    filterByTk?: number;
  }): Promise<{ data: Post }>;
  
  batchPublish(params?: { 
    filter?: any;
  }): Promise<{ data: Post[] }>;
}

// 类型安全的资源操作类
class TypedPostResource {
  private resource: PostResource;
  
  constructor(apiClient: APIClient) {
    this.resource = apiClient.resource('posts') as PostResource;
  }
  
  async listPosts(options: { 
    page?: number; 
    pageSize?: number; 
    filter?: any;
  } = {}) {
    const { page = 1, pageSize = 20, filter } = options;
    
    const response = await this.resource.list({
      page,
      pageSize,
      filter,
      fields: ['id', 'title', 'content', 'status', 'createdAt'],
      sort: ['-createdAt']
    });
    
    return response;
  }
  
  async getPost(id: number) {
    const response = await this.resource.get({
      filterByTk: id,
      fields: ['id', 'title', 'content', 'status', 'createdAt', 'author', 'tags']
    });
    
    return response;
  }
  
  async createPost(data: Partial<Post>) {
    const response = await this.resource.create({
      values: data,
      whitelist: ['title', 'content', 'status']
    });
    
    return response;
  }
  
  async updatePost(id: number, data: Partial<Post>) {
    const response = await this.resource.update({
      filterByTk: id,
      values: data,
      whitelist: ['title', 'content', 'status']
    });
    
    return response;
  }
  
  async deletePost(id: number) {
    await this.resource.destroy({
      filterByTk: id
    });
  }
}

// 使用类型安全的资源操作
const api = new APIClient({
  baseURL: 'http://localhost:13000/api'
});

const postResource = new TypedPostResource(api);

// 类型安全的操作
const posts = await postResource.listPosts({
  page: 1,
  pageSize: 10,
  filter: { status: 'published' }
});

console.log(posts.data); // TypeScript 知道这是 Post[] 类型