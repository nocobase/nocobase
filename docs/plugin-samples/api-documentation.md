# API 文档示例

本文档将详细介绍如何在 NocoBase 插件中生成和自定义 API 文档。

## API 文档基础

### OpenAPI 规范

NocoBase 使用 OpenAPI 3.0 规范来生成 API 文档，支持自动生成和手动编写两种方式。

### 文档结构

```yaml
openapi: 3.0.0
info:
  title: NocoBase API
  version: 1.0.0
  description: NocoBase 应用程序 API 文档
paths:
  /api/users:
    get:
      summary: 获取用户列表
      description: 获取所有用户的列表
      responses:
        '200':
          description: 成功响应
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string
        email:
          type: string
```

## 自动生成 API 文档

### 资源文档生成

```typescript
// src/server/resources/UserResource.ts
import { Resource } from '@nocobase/server';

export class UserResource extends Resource {
  constructor() {
    super({
      name: 'users',
      actions: {
        list: {
          summary: '获取用户列表',
          description: '获取所有用户的列表，支持分页和筛选',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: '页码',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'pageSize',
              in: 'query',
              description: '每页条数',
              schema: { type: 'integer', default: 20 }
            }
          ],
          responses: {
            '200': {
              description: '用户列表',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      },
                      meta: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          page: { type: 'integer' },
                          pageSize: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  }
}
```

### 操作文档生成

```typescript
// src/server/actions/UserActions.ts
export class UserActions {
  /**
   * @summary 获取用户详情
   * @description 根据用户ID获取用户详细信息
   * @param {string} id - 用户ID
   * @returns {User} 用户信息
   * @throws {404} 用户不存在
   */
  async getUser(ctx) {
    const { id } = ctx.params;
    const user = await ctx.db.getRepository('users').findById(id);
    
    if (!user) {
      ctx.throw(404, '用户不存在');
    }
    
    ctx.body = user;
  }
  
  /**
   * @summary 创建用户
   * @description 创建一个新的用户账户
   * @requestBody {
   *   content: {
   *     "application/json": {
   *       schema: {
   *         type: "object",
   *         required: ["username", "email", "password"],
   *         properties: {
   *           username: { type: "string", description: "用户名" },
   *           email: { type: "string", format: "email", description: "邮箱地址" },
   *           password: { type: "string", format: "password", description: "密码" }
   *         }
   *       }
   *     }
   *   }
   * }
   * @response 201 - 用户创建成功
   * @response 400 - 请求参数错误
   */
  async createUser(ctx) {
    const { username, email, password } = ctx.request.body;
    
    // 验证参数
    if (!username || !email || !password) {
      ctx.throw(400, '缺少必要参数');
    }
    
    // 创建用户
    const user = await ctx.db.getRepository('users').create({
      values: { username, email, password }
    });
    
    ctx.status = 201;
    ctx.body = user;
  }
}
```

## 自定义文档组件

### 扩展 OpenAPI 定义

```typescript
// src/server/swagger/CustomSwagger.ts
import { SwaggerBuilder } from '@nocobase/plugin-api-doc';

export class CustomSwagger extends SwaggerBuilder {
  build() {
    // 调用父类方法构建基础文档
    super.build();
    
    // 添加自定义组件
    this.addCustomComponents();
    
    // 添加自定义安全方案
    this.addCustomSecuritySchemes();
    
    // 添加自定义标签
    this.addCustomTags();
    
    return this.openapi;
  }
  
  private addCustomComponents() {
    // 添加自定义数据模型
    this.openapi.components.schemas.CustomResponse = {
      type: 'object',
      properties: {
        code: { type: 'integer', description: '响应码' },
        message: { type: 'string', description: '响应消息' },
        data: { type: 'object', description: '响应数据' }
      }
    };
    
    // 添加自定义参数
    this.openapi.components.parameters.PageParameter = {
      name: 'page',
      in: 'query',
      description: '页码',
      required: false,
      schema: { type: 'integer', default: 1, minimum: 1 }
    };
  }
  
  private addCustomSecuritySchemes() {
    // 添加自定义认证方案
    this.openapi.components.securitySchemes.ApiKeyAuth = {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
      description: 'API 密钥认证'
    };
  }
  
  private addCustomTags() {
    // 添加自定义标签
    this.openapi.tags.push({
      name: 'Custom',
      description: '自定义 API 端点'
    });
  }
}
```

### 文档插件实现

```typescript
// src/server/index.ts
import { Plugin } from '@nocobase/server';
import { CustomSwagger } from './swagger/CustomSwagger';

export class ApiDocPlugin extends Plugin {
  async load() {
    // 注册自定义 Swagger 构建器
    this.app.swaggerBuilder = new CustomSwagger(this.app);
    
    // 添加自定义文档路由
    this.app.router.get('/api-docs/swagger.json', async (ctx) => {
      const swaggerDoc = this.app.swaggerBuilder.build();
      ctx.body = swaggerDoc;
    });
    
    // 添加文档 UI 路由
    this.app.router.get('/api-docs', async (ctx) => {
      await ctx.render('api-docs/index.html');
    });
  }
}
```

## 客户端文档组件

### 文档查看器组件

```typescript
// src/client/components/ApiDocViewer.tsx
import React, { useState, useEffect } from 'react';
import { Card, Tabs, Spin, Alert } from 'antd';
import { useAPIClient } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

const { TabPane } = Tabs;

export const ApiDocViewer: React.FC = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const [loading, setLoading] = useState(true);
  const [swaggerDoc, setSwaggerDoc] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchSwaggerDoc();
  }, []);
  
  const fetchSwaggerDoc = async () => {
    try {
      setLoading(true);
      const response = await api.request({
        url: '/api-docs/swagger.json',
      });
      setSwaggerDoc(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <Spin tip={t('加载中...')} />
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <Alert
          message={t('加载失败')}
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }
  
  return (
    <Card>
      <Tabs defaultActiveKey="swagger">
        <TabPane tab={t('Swagger UI')} key="swagger">
          <SwaggerUIViewer swaggerDoc={swaggerDoc} />
        </TabPane>
        <TabPane tab={t('Redoc')} key="redoc">
          <RedocViewer swaggerDoc={swaggerDoc} />
        </TabPane>
        <TabPane tab={t('原始 JSON')} key="json">
          <pre>{JSON.stringify(swaggerDoc, null, 2)}</pre>
        </TabPane>
      </Tabs>
    </Card>
  );
};

// Swagger UI 查看器
const SwaggerUIViewer: React.FC<{ swaggerDoc: any }> = ({ swaggerDoc }) => {
  // 实现 Swagger UI 渲染逻辑
  return <div>Swagger UI Viewer</div>;
};

// Redoc 查看器
const RedocViewer: React.FC<{ swaggerDoc: any }> = ({ swaggerDoc }) => {
  // 实现 Redoc 渲染逻辑
  return <div>Redoc Viewer</div>;
};
```

## 文档安全和权限

### 访问控制中间件

```typescript
// src/server/middlewares/ApiDocAuthMiddleware.ts
import { Context, Next } from '@nocobase/server';

export class ApiDocAuthMiddleware {
  private readonly allowedRoles: string[];
  
  constructor(options: { allowedRoles?: string[] }) {
    this.allowedRoles = options.allowedRoles || ['admin', 'developer'];
  }
  
  async authenticate(ctx: Context, next: Next) {
    // 只对文档路由应用认证
    if (ctx.path.startsWith('/api-docs')) {
      const user = ctx.state.currentUser;
      
      if (!user) {
        ctx.status = 401;
        ctx.body = { error: '未认证' };
        return;
      }
      
      // 检查用户角色
      const hasPermission = await this.checkUserPermission(user);
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: '权限不足' };
        return;
      }
    }
    
    await next();
  }
  
  private async checkUserPermission(user: any) {
    // 获取用户角色
    const roles = await this.getUserRoles(user.id);
    
    // 检查是否有允许的角色
    return roles.some(role => this.allowedRoles.includes(role));
  }
  
  private async getUserRoles(userId: string) {
    // 实现获取用户角色的逻辑
    return ['developer'];
  }
}
```

## 文档版本管理

### 多版本文档支持

```typescript
// src/server/swagger/VersionedSwagger.ts
import { SwaggerBuilder } from '@nocobase/plugin-api-doc';

interface VersionConfig {
  version: string;
  basePath: string;
  description: string;
}

export class VersionedSwagger extends SwaggerBuilder {
  private versions: VersionConfig[];
  
  constructor(app: any, versions: VersionConfig[]) {
    super(app);
    this.versions = versions;
  }
  
  build(version?: string) {
    if (version) {
      // 构建特定版本的文档
      return this.buildVersion(version);
    } else {
      // 构建所有版本的文档索引
      return this.buildVersionIndex();
    }
  }
  
  private buildVersion(version: string) {
    const versionConfig = this.versions.find(v => v.version === version);
    if (!versionConfig) {
      throw new Error(`不支持的版本: ${version}`);
    }
    
    // 设置版本特定的基础路径
    this.openapi.servers = [
      {
        url: `${this.app.url}${versionConfig.basePath}`,
        description: versionConfig.description
      }
    ];
    
    // 构建该版本的 API 文档
    super.build();
    
    // 添加版本信息
    this.openapi.info.version = version;
    
    return this.openapi;
  }
  
  private buildVersionIndex() {
    // 构建版本索引文档
    return {
      openapi: '3.0.0',
      info: {
        title: 'NocoBase API Versions',
        version: '1.0.0',
        description: 'NocoBase API 版本索引'
      },
      paths: {
        '/versions': {
          get: {
            summary: '获取 API 版本列表',
            responses: {
              '200': {
                description: '版本列表',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          version: { type: 'string' },
                          url: { type: 'string' },
                          description: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }
}
```

## 文档国际化

### 多语言支持

```typescript
// src/server/i18n/ApiDocI18n.ts
export class ApiDocI18n {
  private translations: Map<string, any>;
  
  constructor() {
    this.translations = new Map();
    this.loadTranslations();
  }
  
  translate(key: string, lang: string, params?: any) {
    const langTranslations = this.translations.get(lang);
    if (!langTranslations) {
      return key;
    }
    
    let translation = langTranslations[key] || key;
    
    // 替换参数
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
    }
    
    return translation;
  }
  
  private loadTranslations() {
    // 加载中文翻译
    this.translations.set('zh-CN', {
      'Get user list': '获取用户列表',
      'Get user details': '获取用户详情',
      'Create user': '创建用户',
      'User ID': '用户ID',
      'Username': '用户名',
      'Email': '邮箱',
      'Password': '密码'
    });
    
    // 加载英文翻译
    this.translations.set('en-US', {
      'Get user list': 'Get user list',
      'Get user details': 'Get user details',
      'Create user': 'Create user',
      'User ID': 'User ID',
      'Username': 'Username',
      'Email': 'Email',
      'Password': 'Password'
    });
  }
}
```

## 文档测试和验证

### 文档验证中间件

```typescript
// src/server/middlewares/ApiDocValidationMiddleware.ts
import { Context, Next } from '@nocobase/server';
import SwaggerParser from '@apidevtools/swagger-parser';

export class ApiDocValidationMiddleware {
  async validate(ctx: Context, next: Next) {
    if (ctx.path === '/api-docs/swagger.json') {
      try {
        // 验证 OpenAPI 文档
        const swaggerDoc = await this.getSwaggerDoc();
        await SwaggerParser.validate(swaggerDoc);
        
        ctx.logger.info('API 文档验证通过');
      } catch (error) {
        ctx.logger.error('API 文档验证失败:', error);
        // 可以选择返回错误或继续处理
      }
    }
    
    await next();
  }
  
  private async getSwaggerDoc() {
    // 获取当前的 Swagger 文档
    return {};
  }
}
```

### 文档测试用例

```typescript
// src/server/__tests__/ApiDoc.test.ts
import { createApp } from '@nocobase/server';
import request from 'supertest';

describe('API Documentation', () => {
  let app;
  let server;
  
  beforeAll(async () => {
    app = await createApp();
    server = app.listen(13000);
  });
  
  afterAll(async () => {
    await server.close();
  });
  
  it('should return valid OpenAPI document', async () => {
    const response = await request(server)
      .get('/api-docs/swagger.json')
      .expect(200);
    
    // 验证 OpenAPI 文档结构
    expect(response.body.openapi).toBe('3.0.0');
    expect(response.body.info).toBeDefined();
    expect(response.body.paths).toBeDefined();
    expect(response.body.components).toBeDefined();
  });
  
  it('should have valid paths', async () => {
    const response = await request(server)
      .get('/api-docs/swagger.json')
      .expect(200);
    
    // 验证路径定义
    Object.keys(response.body.paths).forEach(path => {
      expect(path).toMatch(/^\/api\//);
    });
  });
  
  it('should have valid schemas', async () => {
    const response = await request(server)
      .get('/api-docs/swagger.json')
      .expect(200);
    
    // 验证数据模型定义
    if (response.body.components.schemas) {
      Object.keys(response.body.components.schemas).forEach(schemaName => {
        const schema = response.body.components.schemas[schemaName];
        expect(schema.type).toBeDefined();
      });
    }
  });
});
```

## 文档最佳实践

### 1. 文档维护

```typescript
// 实现文档维护最佳实践
class ApiDocMaintenance {
  private readonly docHistory: Map<string, any[]>;
  
  constructor() {
    this.docHistory = new Map();
  }
  
  // 自动更新文档
  async autoUpdateDocumentation() {
    // 监听资源和操作的变化
    this.app.on('resource.created', this.updateResourceDoc.bind(this));
    this.app.on('resource.updated', this.updateResourceDoc.bind(this));
    this.app.on('resource.deleted', this.removeResourceDoc.bind(this));
  }
  
  // 版本控制
  async versionControl() {
    // 在每次发布时保存文档版本
    this.app.on('beforeUpgrade', this.saveDocVersion.bind(this));
  }
  
  private updateResourceDoc(resource: any) {
    // 更新资源相关文档
  }
  
  private removeResourceDoc(resource: any) {
    // 移除资源相关文档
  }
  
  private saveDocVersion() {
    // 保存文档版本
  }
}
```

### 2. 文档质量保证

```typescript
// 文档质量检查
class ApiDocQualityChecker {
  async checkDocumentationQuality() {
    const swaggerDoc = await this.getSwaggerDoc();
    
    // 检查必需字段
    this.checkRequiredFields(swaggerDoc);
    
    // 检查描述完整性
    this.checkDescriptionCompleteness(swaggerDoc);
    
    // 检查示例数据
    this.checkExampleData(swaggerDoc);
    
    // 检查错误响应
    this.checkErrorResponses(swaggerDoc);
  }
  
  private checkRequiredFields(swaggerDoc: any) {
    // 检查所有操作是否有摘要和描述
    Object.keys(swaggerDoc.paths).forEach(path => {
      Object.keys(swaggerDoc.paths[path]).forEach(method => {
        const operation = swaggerDoc.paths[path][method];
        if (!operation.summary) {
          console.warn(`操作 ${method} ${path} 缺少摘要`);
        }
        if (!operation.description) {
          console.warn(`操作 ${method} ${path} 缺少描述`);
        }
      });
    });
  }
  
  private checkDescriptionCompleteness(swaggerDoc: any) {
    // 检查参数和响应是否有描述
  }
  
  private checkExampleData(swaggerDoc: any) {
    // 检查是否有示例数据
  }
  
  private checkErrorResponses(swaggerDoc: any) {
    // 检查是否定义了常见错误响应
  }
}
```

### 3. 文档发布流程

```typescript
// 文档发布流程
class ApiDocPublisher {
  async publishDocumentation() {
    // 1. 验证文档
    await this.validateDocumentation();
    
    // 2. 生成静态文档
    await this.generateStaticDocs();
    
    // 3. 部署到文档服务器
    await this.deployDocs();
    
    // 4. 通知相关人员
    await this.notifyTeam();
  }
  
  private async validateDocumentation() {
    // 验证文档完整性
  }
  
  private async generateStaticDocs() {
    // 生成 HTML、PDF 等静态文档
  }
  
  private async deployDocs() {
    // 部署文档到服务器
  }
  
  private async notifyTeam() {
    // 通知团队成员文档已更新
  }
}
```

## 下一步

- 学习 [异步任务管理](./async-task-management.md) 示例（如果创建了该文档）
- 掌握 [通知管理](./notification-management.md) 示例（如果创建了该文档）
