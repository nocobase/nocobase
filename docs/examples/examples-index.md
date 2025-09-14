# 示例

## Application

- [最简单的单应用](./app/single-app.ts)
- [支持多应用（子应用）](./app/multi-app.ts)
- 配置 Resources 和 Actions
  - [最简单的 resource actions](./app/resource-actions/simple.ts)
  - [带默认参数的 Action](./app/resource-actions/action-with-default-options.ts)
  - [使用全局 Action](./app/resource-actions/global-action.ts)
  - [Action 参数的多来源合并](./app/resource-actions/action-merge-params.ts)
  - 内置 Actions 的用法
- [Collection 自动转 Resource](./app/collection2resource.ts)
- [Association 自动转 Resource](./app/association2resource.ts)
- Context
  - [ctx.db 示例](./app/context/ctx.db.ts)
  - [ctx.action 的重要参数示例](./app/context/ctx.action.ts)
  - [ctx.action.mergeParams() 示例](./app/context/ctx.action.mergeParams.ts)
  - [ctx.i18n & ctx.t() 示例](./app/context/ctx.i18n.ts)
- 中间件
  - [app.use 用法](./app/middleware/app.ts)
  - [app.resourcer.use 用法](./app/middleware/resourcer.ts)
  - [app.acl.use 用法](./app/middleware/acl.ts)
- [ACL](./app/acl.ts)
- [国际化多语言](./app/i18n.ts)
- [自定义命令行](./app/custom-command.ts)
- [编写一个最简单的插件](./app/custom-plugin.ts)
- Application Migration
  - [编写一个新的 Migration 文件](./app/migrations/add-migration.ts)
- 编写 Application 测试用例
  - [最简单的测试用例](./app/__tests__/app.test.ts)
- 客户端 SDK（APIClient）示例
  - [客户端常规请求 —— api.request()](./api-client/api.request.ts)
  - [客户端资源请求 —— api.resource().action()](./api-client/api.resource.ts)

## Database

- 配置 Collections & Fields
- 通过 Repository 增删改查数据
- 通过 Model 增删改查数据
- 关系数据的增删改查
- 关系数据的关联操作
- 扩展字段
- 数据库事件
- 数据库迁移

## Client

### SDK 使用示例

NocoBase SDK (`@nocobase/sdk`) 提供了便捷的 API 客户端功能，用于与 NocoBase 应用进行交互。

#### 基础用法

```typescript
import { APIClient } from '@nocobase/sdk';

// 创建 API 客户端实例
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 常规 HTTP 请求
const response = await api.request({
  url: 'users:list',
  method: 'get'
});

// 资源操作
const users = await api.resource('users').list();
```

#### 认证管理

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 用户登录
await api.auth.signIn({
  username: 'admin',
  password: 'admin'
});

// 用户登出
await api.auth.signOut();

// 检查认证状态
if (api.auth.token) {
  console.log('用户已登录');
}
```

#### 资源操作

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 列表查询
const posts = await api.resource('posts').list({
  page: 1,
  pageSize: 20,
  filter: { status: 'published' }
});

// 创建资源
const newPost = await api.resource('posts').create({
  values: {
    title: 'New Post',
    content: 'Post content'
  }
});

// 获取单个资源
const post = await api.resource('posts').get({
  filterByTk: 1
});

// 更新资源
const updatedPost = await api.resource('posts').update({
  filterByTk: 1,
  values: {
    title: 'Updated Title'
  }
});

// 删除资源
await api.resource('posts').destroy({
  filterByTk: 1
});
```

#### 错误处理

```typescript
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
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

#### 高级用法

```typescript
import { APIClient } from '@nocobase/sdk';

// 自定义存储类型
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
  storageType: 'sessionStorage', // 'localStorage' | 'sessionStorage' | 'memory'
  storagePrefix: 'MYAPP_' // 存储键前缀
});

// 自定义认证类
class CustomAuth extends Auth {
  middleware(config) {
    config = super.middleware(config);
    // 添加自定义头部
    config.headers['X-Custom-Header'] = 'custom-value';
    return config;
  }
}

const apiWithCustomAuth = new APIClient({
  baseURL: 'http://localhost:13000/api',
  authClass: CustomAuth
});
```

详细使用请参考开发文档中的 [SDK 使用指南](../development/sdk.md) 和 [SDK 使用示例](../development/sdk-examples.md)。