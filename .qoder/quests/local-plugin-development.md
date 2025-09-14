# 本地插件开发设计文档

> 本文档基于 NocoBase 平台的本地插件开发流程和最佳实践，旨在帮助开发者快速上手并高效开发自定义插件。文档特别包含了电子表格插件的专项规划方案，并详细说明了依赖版本检查、样式集成和构建优化的具体措施。

## 1. 概述

本文档详细描述了在 NocoBase 平台上进行本地插件开发的完整流程和最佳实践。NocoBase 采用插件化架构，所有功能都可以通过插件来实现。本地插件开发允许开发者在 `@local` 命名空间下创建和测试自定义功能，而无需发布到公共仓库。

## 2. 架构设计

### 2.1 插件存储位置
NocoBase 插件按照组织名分组存储在 `packages/plugins/` 目录下：
```
packages/plugins/
├── @nocobase/          # 官方插件
├── @local/             # 本地开发插件
└── @my-project/        # 自定义项目插件
```

### 2.2 完整插件目录结构
一个完整的插件通常包含以下目录和文件：
```
plugin-name/
├── package.json              # npm 包配置文件
├── README.md                 # 插件说明文档
├── client.d.ts               # 客户端 TypeScript 声明文件
├── client.js                 # 客户端入口文件
├── server.d.ts               # 服务端 TypeScript 声明文件
├── server.js                 # 服务端入口文件
├── src/                      # 源代码目录
│   ├── client/               # 客户端代码
│   │   ├── index.tsx         # 客户端入口
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── components/       # React 组件
│   │   ├── locales/          # 国际化文件
│   │   └── schemas/          # Schema 配置
│   └── server/               # 服务端代码
│       ├── index.ts          # 服务端入口
│       ├── actions/          # 自定义操作
│       ├── collections/      # 数据表定义
│       ├── models/           # 数据模型
│       ├── repositories/     # 数据仓库
│       ├── routes/           # 路由配置
│       ├── services/         # 业务服务
│       ├── middleware/       # 中间件
│       ├── migrations/       # 数据库迁移文件
│       └── locales/          # 国际化文件
├── dist/                     # 编译后的代码
└── __tests__/                # 测试文件
```

### 2.3 插件生命周期
插件具有明确的生命周期：
1. **beforeLoad** - 插件加载前初始化
2. **load** - 插件加载和配置
3. **install** - 插件安装初始化
4. **disable** - 插件禁用清理

## 3. 开发流程

### 3.1 创建插件
使用 NocoBase CLI 工具快速创建插件模板：
```bash
# 在项目根目录执行
yarn pm create plugin-name
```
该命令将在 `packages/plugins/@local/` 目录下创建插件。

对于电子表格插件，建议使用以下命令：
```bash
# 创建电子表格插件
yarn pm create spreadsheet
```

您也可以基于示例插件进行开发：
```bash
# 复制示例插件
yarn pm create hello
```
这将创建一个基础的示例插件，您可以在此基础上进行修改和扩展。

### 3.2 插件配置
在 `package.json` 中配置插件元数据：
```json
{
  "name": "@local/plugin-spreadsheet",
  "version": "1.0.0",
  "main": "./dist/server/index.js",
  "displayName": "Spreadsheet",
  "displayName.zh-CN": "电子表格",
  "description": "A spreadsheet plugin for NocoBase",
  "description.zh-CN": "NocoBase 电子表格插件",
  "dependencies": {
    "handsontable": "^12.4.0"
  },
  "devDependencies": {
    "@types/handsontable": "^12.4.0"
  },
  "peerDependencies": {
    "@nocobase/client": "1.x",
    "@nocobase/server": "1.x",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "antd": "5.x"
  }
}
```

### 3.3 服务端开发
服务端入口文件 `src/server/index.ts`：

针对电子表格插件，服务端需要实现以下功能：

1. 表格数据模型定义
2. 单元格操作API
3. 公式计算服务
4. 协作编辑支持
```typescript
import { InstallOptions, Plugin } from '@nocobase/server';

export class PluginNamePlugin extends Plugin {
  beforeLoad() {
    // 初始化配置
  }

  async load() {
    // 主要逻辑实现
    // 1. 注册资源
    this.app.resource({
      name: 'resourceName',
      actions: {
        async customAction(ctx, next) {
          ctx.body = 'Hello from plugin!';
          await next();
        }
      }
    });
    
    // 2. 设置访问权限
    this.app.acl.allow('resourceName', 'customAction');
    
    // 3. 定义数据表
    this.app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title', required: true },
        { type: 'text', name: 'content' }
      ]
    });
    
    // 4. 注册中间件
    this.app.middleware.register((ctx, next) => {
      // 中间件逻辑
      return next();
    });
  }

  async install(options: InstallOptions) {
    // 安装初始化
    // 例如：创建默认数据、初始化配置等
  }

  async disable() {
    // 禁用清理
    // 例如：清理定时任务、移除资源等
  }
}

export default PluginNamePlugin;
```

### 3.4 客户端开发
客户端入口文件 `src/client/index.tsx`：

针对电子表格插件，客户端需要实现以下功能：

1. 表格编辑器界面
2. 单元格数据展示与编辑
3. 公式输入与计算结果显示
4. 协作编辑状态显示
5. 工具栏与菜单功能

此外，还需要确保插件可以在区块选项中显示和选择使用：

```
import { Plugin } from '@nocobase/client';
import React from 'react';
import { SpreadsheetBlock } from './components/SpreadsheetBlock';

class SpreadsheetPlugin extends Plugin {
  async load() {
    // 1. 注册插件设置页面，使用主程序样式
    this.app.pluginSettingsManager.add('spreadsheet', {
      title: 'Spreadsheet',
      icon: 'TableOutlined',
      Component: () => (
        <div className="nb-page-wrapper"> // 使用主程序样式类
          <div className="spreadsheet-settings-page">
            <h1>{{t('Spreadsheet Settings')}}</h1>
            <div>Spreadsheet Settings Content</div>
          </div>
        </div>
      ),
      sort: 100
    });
    
    // 2. 添加自定义组件
    this.app.addComponents({
      SpreadsheetBlock
    });
    
    // 3. 添加 Schema 初始化器，使插件可以在区块选项中显示和选择
    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      'otherBlocks.spreadsheet',
      {
        title: '{{t("Spreadsheet")}}',
        Component: (props) => {
          const { insert } = props;
          return (
            <div onClick={() => {
              // 插入电子表格区块
              insert({
                type: 'void',
                'x-component': 'SpreadsheetBlock',
                'x-component-props': {
                  sheetId: null
                }
              });
            }}>
              {{t('Spreadsheet')}}
            </div>
          );
        }
      }
    );
    
    // 4. 添加路由，确保页面使用主程序样式
    this.app.router.add('admin.spreadsheet', {
      path: '/spreadsheet',
      Component: () => (
        <div className="nb-page-wrapper"> // 使用主程序样式类
          <div className="spreadsheet-management-page">
            <h1>{{t('Spreadsheet Management')}}</h1>
            <div>Spreadsheet Management Content</div>
          </div>
        </div>
      )
    });
    
    // 5. 国际化支持
    this.app.i18n.addResources('en-US', 'spreadsheet', {
      'Spreadsheet': 'Spreadsheet',
      'New Sheet': 'New Sheet',
      'Spreadsheet Settings': 'Spreadsheet Settings',
      'Spreadsheet Management': 'Spreadsheet Management'
    });
    
    this.app.i18n.addResources('zh-CN', 'spreadsheet', {
      'Spreadsheet': '电子表格',
      'New Sheet': '新建工作表',
      'Spreadsheet Settings': '电子表格设置',
      'Spreadsheet Management': '电子表格管理'
    });
  }
}

export default SpreadsheetPlugin;
```
```typescript
import { Plugin } from '@nocobase/client';
import React from 'react';

class PluginNamePlugin extends Plugin {
  async load() {
    // 1. 注册插件设置页面
    this.app.pluginSettingsManager.add('plugin-name', {
      title: 'Plugin Name',
      icon: 'ApiOutlined',
      Component: () => <div>Plugin Settings</div>,
      sort: 100
    });
    
    // 2. 添加自定义组件
    this.app.addComponents({
      CustomComponent: () => <div>Custom Component</div>
    });
    
    // 3. 添加 Schema 初始化器
    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      'otherBlocks.custom',
      {
        title: 'Custom Block',
        Component: () => <div>Custom Block Component</div>
      }
    );
    
    // 4. 添加路由
    this.app.router.add('admin.custom', {
      path: '/custom',
      Component: () => <div>Custom Page</div>
    });
  }
}

export default PluginNamePlugin;
```

### 3.5 激活插件
创建插件后需要激活：
```bash
# 安装插件
yarn nocobase install plugin-name

# 或使用完整包名
yarn nocobase install @local/plugin-name
```

### 3.6 调试插件
启动开发服务器进行调试：
```bash
yarn dev
```

### 3.7 构建插件
生产环境使用前需要构建：
```bash
yarn build
```

## 4. 核心 API 使用

### 4.1 资源管理
```
// 注册资源
this.app.resource({
  name: 'posts',
  actions: {
    async list(ctx, next) {
      // 实现列表逻辑
      await next();
    },
    async create(ctx, next) {
      // 实现创建逻辑
      await next();
    }
  }
});

// 设置访问权限
this.app.acl.allow('posts', 'list');
this.app.acl.allow('posts', 'create');
```

### 4.2 数据库操作
```
// 定义数据表
this.app.db.collection({
  name: 'posts',
  fields: [
    { 
      type: 'string', 
      name: 'title', 
      required: true 
    },
    { 
      type: 'text', 
      name: 'content' 
    },
    { 
      type: 'belongsTo', 
      name: 'user',
      target: 'users'
    }
  ]
});

// 获取数据仓库
const repository = this.app.db.getRepository('posts');

// 创建记录
await repository.create({
  values: {
    title: 'Hello',
    content: 'World'
  }
});

// 查询记录
const posts = await repository.find({
  filter: {
    title: 'Hello'
  }
});
```

### 4.3 中间件注册
```
// 注册全局中间件
this.app.middleware.register((ctx, next) => {
  // 中间件逻辑
  console.log('Global middleware');
  return next();
});

// 为特定资源注册中间件
this.app.resourceManager.use('posts', (ctx, next) => {
  // 只对 posts 资源生效
  console.log('Posts resource middleware');
  return next();
});
```

### 4.4 客户端集成
```
// 添加组件
this.app.addComponents({ 
  CustomComponent: (props) => <div>Custom Component</div> 
});

// 添加 Schema 初始化器
this.app.schemaInitializerManager.addItem(
  'page:addBlock',
  'otherBlocks.spreadsheet',
  { 
    title: '{{t("Spreadsheet")}}',
    Component: (props) => {
      return (
        <div onClick={() => {
          // 处理点击事件，插入电子表格区块
          const { insert } = props;
          insert({
            type: 'void',
            'x-component': 'SpreadsheetBlock',
            'x-component-props': {
              sheetId: null // 新建表格ID
            }
          });
        }}>
          {{t('Spreadsheet')}}
        </div>
      );
    }
  }
);

// 添加路由
this.app.router.add('admin.custom', {
  path: '/custom',
  Component: () => <div>Custom Page</div>
});
```

## 5. 最佳实践

### 5.1 命名规范
- 插件名使用 `plugin-` 前缀
- 使用 kebab-case 命名法
- 目录名与包名保持一致

### 5.7 电子表格插件特殊考虑

#### 5.7.1 大数据处理
- 实现虚拟滚动以支持大型表格
- 分页加载数据以减少内存占用
- 使用 Web Workers 处理复杂计算

#### 5.7.2 实时协作优化
- 实现操作队列以确保操作顺序
- 使用操作合并减少网络传输
- 实现冲突解决机制

#### 5.7.3 区块集成优化
- 确保电子表格组件在区块选择器中正确显示
- 实现组件的懒加载以提高页面性能
- 支持区块配置选项（如默认表格、权限设置等）
- 实现区块的响应式设计以适配不同屏幕尺寸
- 确保插件页面在主程序的样式内显示，使用主程序提供的CSS类名和设计规范

### 5.2 代码组织
- 客户端和服务端代码严格分离
- 相关功能组织在单独目录中
- 使用 index.ts 文件导出模块

### 5.3 错误处理
```
async load() {
  try {
    // 主要逻辑
    await this.registerResources();
    await this.registerRoutes();
  } catch (error) {
    this.app.logger.error('Plugin load failed', { error });
    throw error;
  }
}

async registerResources() {
  // 注册资源逻辑
}

async registerRoutes() {
  // 注册路由逻辑
}
```

### 5.4 国际化支持
```
// 服务端国际化
this.app.i18n.addResources('zh-CN', 'plugin-name', {
  'Hello': '你好',
  'World': '世界'
});

// 客户端国际化
import { i18n } from '@nocobase/client';

i18n.addResources('zh-CN', 'plugin-name', {
  'Custom Block': '自定义区块'
});
```

### 5.5 配置管理
```
// 获取插件配置
const config = this.app.config.get('plugin-name');

// 设置默认配置
this.app.config.set('plugin-name', {
  defaultSetting: 'value'
});
```

### 5.6 资源清理
```
async disable() {
  // 清理定时任务、事件监听等
  this.app.resourceManager.removeResource('posts');
  this.app.router.remove('admin.custom');
}
```

## 6. 测试策略

### 6.1 单元测试
在 `__tests__` 目录下编写测试用例：
```
import { createMockServer } from '@nocobase/test';

describe('plugin-name', () => {
  let app;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['plugin-name']
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should work', async () => {
    // 测试逻辑
  });
});
```

### 6.2 服务端测试
测试服务端功能：
```
it('should create post', async () => {
  const response = await app.agent().resource('posts').create({
    values: {
      title: 'Test Post',
      content: 'Test Content'
    }
  });
  
  expect(response.status).toBe(200);
  expect(response.body.data.title).toBe('Test Post');
});
```

### 6.3 客户端测试
测试客户端组件：
```
import { render, screen } from '@nocobase/test/client';

it('should render custom component', () => {
  render(<CustomComponent />);
  expect(screen.getByText('Custom Component')).toBeInTheDocument();
});
```

### 6.4 集成测试
测试插件与其他组件的集成：
```
it('should integrate with other plugins', async () => {
  // 集成测试逻辑
});
```

## 7. 部署与发布

### 7.1 本地部署
构建完成后可在本地 NocoBase 实例中使用：
```
yarn build
yarn nocobase install @local/plugin-name
```

### 7.2 开发环境调试
在开发过程中，可以使用以下命令进行调试：
```
# 启动开发服务器
yarn dev

# 重新构建插件
yarn build plugin-name

# 重启应用
yarn nocobase restart
```

### 7.3 发布到私有仓库
```
# 发布到私有 npm 仓库
npm publish --registry=your-private-registry
```

### 7.4 贡献到社区
1. 确保代码质量和文档完整
2. 编写测试用例
3. 遵循版本控制规范
4. 发布到 npm 或 GitHub

### 7.5 版本管理
遵循语义化版本控制：
- MAJOR: 不兼容的API变更
- MINOR: 向后兼容的功能新增
- PATCH: 向后兼容的问题修复

## 8. 电子表格插件专项规划

> 本章节专门针对电子表格插件的开发进行详细规划，确保插件可以作为可选区块集成到NocoBase的页面构建系统中，并且插件页面在主程序的样式内显示。同时，本章节还详细说明了依赖版本检查、样式集成和构建优化的具体措施。

### 8.1 插件功能概述
电子表格插件将提供类似Excel的在线数据编辑功能，包括：
- 单元格数据编辑
- 公式计算
- 数据格式化
- 表格样式设置
- 数据导入/导出
- 多用户协作编辑

插件将作为一个可选区块集成到NocoBase的页面构建系统中，用户可以在页面设计时从区块选项中选择并添加电子表格组件。

### 8.2 技术架构设计

#### 8.2.1 前端技术选型
- 使用 [Handsontable](https://handsontable.com/) 作为核心表格组件（版本12.0.0及以上，确保与React 18兼容）
- React Hooks 管理组件状态
- WebSocket 实现实时协作

#### 8.2.2 后端技术实现
- 基于 NocoBase 的数据模型
- 自定义资源操作处理表格数据
- WebSocket 服务实现协作通信

### 8.3 核心功能模块

#### 8.3.1 表格数据模型
```
// 定义表格集合
this.app.db.collection({
  name: 'spreadsheetSheets',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'hasMany', name: 'cells', target: 'spreadsheetCells' },
    { type: 'json', name: 'settings' }
  ]
});

// 定义单元格集合
this.app.db.collection({
  name: 'spreadsheetCells',
  fields: [
    { type: 'integer', name: 'row' },
    { type: 'integer', name: 'col' },
    { type: 'string', name: 'value' },
    { type: 'string', name: 'formula' },
    { type: 'json', name: 'style' },
    { type: 'belongsTo', name: 'sheet', target: 'spreadsheetSheets' }
  ]
});
```

#### 8.3.2 表格操作API
```
this.app.resource({
  name: 'spreadsheetSheets',
  actions: {
    // 获取表格数据
    async getData(ctx, next) {
      // 获取参数
      const { filter, fields, appends } = ctx.action.params;
      
      // 实现获取表格数据逻辑
      const data = await this.getSpreadsheetData(filter);
      
      // 设置返回值
      ctx.body = data;
      ctx.status = 200;
      
      await next();
    },
    
    // 更新单元格 - 使用 proxyToRepository 模式
    async updateCell(ctx, next) {
      // 获取参数
      const { filterByTk, values } = ctx.action.params;
      
      // 实现单元格更新逻辑
      const result = await this.updateSpreadsheetCell(filterByTk, values);
      
      // 设置返回值
      ctx.body = result;
      ctx.status = 200;
      
      await next();
    },
    
    // 批量更新 - 使用 proxyToRepository 模式
    async batchUpdate(ctx, next) {
      // 获取参数
      const { filter, values } = ctx.action.params;
      
      // 实现批量更新逻辑
      const result = await this.batchUpdateSpreadsheet(filter, values);
      
      // 设置返回值
      ctx.body = result;
      ctx.status = 200;
      
      await next();
    },
    
    // 创建新表格
    async createSheet(ctx, next) {
      // 获取参数
      const { values } = ctx.action.params;
      
      // 实现创建新表格逻辑
      const sheet = await this.createSpreadsheetSheet(values);
      
      // 设置返回值
      ctx.body = sheet;
      ctx.status = 200;
      
      await next();
    }
  }
});

// 设置访问权限
this.app.acl.allow('spreadsheetSheets', 'getData');
this.app.acl.allow('spreadsheetSheets', 'updateCell');
this.app.acl.allow('spreadsheetSheets', 'batchUpdate');

// 对于创建操作，可能需要更严格的权限控制
// this.app.acl.allow('spreadsheetSheets', 'createSheet');
```

### 8.4 协作编辑实现

#### 8.4.1 WebSocket 服务
```
// 服务端 WebSocket 实现
async load() {
  // 初始化 WebSocket 服务
  this.app.ws.use('/spreadsheet', (ws, req) => {
    // 处理 WebSocket 连接
    ws.on('message', (message) => {
      // 处理客户端消息
    });
  });
}
```

#### 8.4.2 客户端集成
```
// 客户端 WebSocket 连接
import { useEffect } from 'react';

const useSpreadsheetCollaboration = (sheetId) => {
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:13000/spreadsheet`);
    
    ws.onopen = () => {
      // 连接建立
    };
    
    ws.onmessage = (event) => {
      // 处理服务器消息
    };
    
    return () => {
      ws.close();
    };
  }, [sheetId]);
};

// 电子表格区块组件，确保样式与主程序一致
const SpreadsheetBlock = (props) => {
  const { sheetId } = props;
  
  // 使用协作钩子
  useSpreadsheetCollaboration(sheetId);
  
  return (
    <div className="spreadsheet-block nb-block-wrapper"> // 使用主程序样式类
      {/* 电子表格编辑器 */}
      <div id="spreadsheet-container" className="spreadsheet-editor"></div>
    </div>
  );
};
```

### 8.5 性能优化策略

#### 8.5.1 数据虚拟化
- 实现表格数据的虚拟滚动
- 仅渲染可见区域的数据
- 懒加载非可见区域数据

#### 8.5.2 公式计算优化
- 使用增量计算减少重复计算
- 缓存计算结果
- 异步计算复杂公式

### 8.6 安全性考虑
- 实现数据访问权限控制
- 防止恶意公式注入
- WebSocket 连接身份验证
- 数据操作审计日志

### 8.7 国际化支持
```
// 中文资源
this.app.i18n.addResources('zh-CN', 'spreadsheet', {
  'Spreadsheet': '电子表格',
  'New Sheet': '新建工作表',
  'Cell Value': '单元格值',
  'Formula': '公式'
});

// 英文资源
this.app.i18n.addResources('en-US', 'spreadsheet', {
  'Spreadsheet': 'Spreadsheet',
  'New Sheet': 'New Sheet',
  'Cell Value': 'Cell Value',
  'Formula': 'Formula'
});
```

### 8.8 区块集成配置
为了确保电子表格插件可以在区块选项中正确显示和使用，需要进行以下配置：

1. **Schema初始化器配置**：在客户端插件加载时注册区块初始化器
2. **组件注册**：将电子表格组件注册到应用组件库中
3. **权限设置**：确保用户有权限访问和使用电子表格区块
4. **配置选项**：提供区块配置选项，如默认表格选择、显示设置等
5. **样式集成**：确保插件页面在主程序的样式内显示，使用主程序提供的CSS类名和设计规范

```
// 在客户端插件load方法中添加
this.app.schemaInitializerManager.addItem(
  'page:addBlock',
  'otherBlocks.spreadsheet',
  {
    title: '{{t("Spreadsheet")}}',
    Component: SpreadsheetBlockInitializer
  }
);

// 区块初始化器组件
const SpreadsheetBlockInitializer = (props) => {
  const { insert } = useSchemaInitializer();
  
  return (
    <div onClick={() => {
      insert({
        type: 'void',
        'x-component': 'SpreadsheetBlock',
        'x-component-props': {
          sheetId: null,
          readOnly: false
        }
      });
    }}>
      {{t('Add Spreadsheet')}}
    </div>
  );
};
```

### 8.9 依赖版本检查措施
为确保 Handsontable 与主程序使用的 React、Ant Design 等核心库版本兼容，采取以下措施：

1. **版本兼容性分析**：
   - 主程序使用 React 18.2.0 和 Ant Design 5.24.2
   - 选择 Handsontable 12.4.0 版本，该版本明确支持 React 18
   - 确保所有依赖库版本都在兼容范围内
   - 通过查阅官方文档和社区反馈确认版本兼容性
   - 在开发环境中进行集成测试验证兼容性

2. **依赖冲突检测**：
   - 在插件构建过程中检查依赖版本冲突
   - 使用 webpack externals 配置避免重复打包主程序已有的依赖
   - 定期检查依赖库的安全更新和兼容性
   - 使用 `npm ls` 或 `yarn list` 命令检查依赖树
   - 使用 `npm audit` 或 `yarn audit` 检查安全漏洞

3. **版本锁定机制**：
   - 使用 package-lock.json 或 yarn.lock 锁定依赖版本
   - 在插件文档中明确记录兼容的主程序版本范围
   - 使用语义化版本控制确保依赖更新的可预测性
   - 建立依赖更新流程，确保在更新依赖前进行充分测试

### 8.10 样式集成措施
为避免样式冲突并确保 Handsontable 与主程序主题一致，采取以下措施：

1. **CSS Modules 隔离方案**：
   - 使用 CSS Modules 对插件特定样式进行隔离
   - 为 Handsontable 组件应用自定义样式前缀
   - 通过 CSS-in-JS 方案动态生成样式
   - 使用 BEM 命名规范确保样式类名唯一性
   - 避免使用过于通用的类名防止样式泄漏

2. **主题定制**：
   - 根据主程序的 Ant Design 主题变量定制 Handsontable 外观
   - 使用 CSS 自定义属性（CSS Variables）实现主题切换
   - 确保插件组件遵循主程序的设计规范
   - 通过读取主程序主题配置动态调整插件样式
   - 实现暗色主题和亮色主题的适配

3. **样式冲突处理**：
   - 使用 :global 选择器谨慎处理全局样式
   - 通过样式优先级控制确保主程序样式不被覆盖
   - 在开发过程中使用浏览器开发者工具检查样式冲突
   - 使用 PostCSS 插件自动添加浏览器前缀
   - 通过 CSS Reset 或 Normalize.css 确保样式一致性

### 8.11 接口规范检查与优化
为确保电子表格插件的接口设计符合 NocoBase 官方规范，避免冲突、不兼容或弃用的情况，采取以下措施：

#### 8.11.1 检查结果总结
通过对 NocoBase 官方接口规范的分析和对电子表格插件设计的审查，确认以下几点：

1. **符合项**：
   - 资源定义方式符合标准规范
   - 权限控制机制正确实现
   - 客户端集成方式符合官方推荐
   - 国际化支持实现正确

2. **需要优化项**：
   - 部分自定义动作的实现方式可以进一步标准化
   - 参数处理方式需要遵循标准模式
   - 返回值格式需要统一
   - HTTP 状态码设置需要规范化

3. **无冲突项**：
   - 未使用已废弃的 API
   - 未与主程序核心接口产生冲突
   - 未使用不兼容的参数模式

#### 8.11.2 验证和测试措施
为确保接口规范的正确实施，采取以下验证和测试措施：

1. **单元测试**：
   - 为每个资源动作编写单元测试
   - 验证参数处理的正确性
   - 验证返回值格式的规范性
   - 验证错误处理的正确性

2. **集成测试**：
   - 测试资源动作与主程序的集成
   - 验证权限控制的有效性
   - 测试与数据库的交互

3. **接口测试**：
   - 使用标准的 API 测试工具验证接口
   - 验证 HTTP 状态码的正确性
   - 验证响应格式的规范性

```
// 示例单元测试
it('should get spreadsheet data', async () => {
  const response = await app.agent().resource('spreadsheetSheets').getData({
    filter: {
      id: 1
    }
  });
  
  expect(response.status).toBe(200);
  expect(response.body).toBeDefined();
});

// 示例集成测试
it('should update cell correctly', async () => {
  const response = await app.agent().resource('spreadsheetSheets').updateCell({
    filterByTk: 1,
    values: {
      value: 'test'
    }
  });
  
  expect(response.status).toBe(200);
  expect(response.body.value).toBe('test');
});
```

1. **资源定义规范检查**：
   - 严格按照 NocoBase ResourceManager 规范定义资源
   - 使用标准的 ActionName 类型定义动作名称
   - 确保资源动作遵循标准的 ctx.body 返回格式
   - 遵循标准的 next() 调用模式
   - 正确处理资源的 only/except 白名单/黑名单配置

2. **动作实现规范检查**：
   - 优先使用标准的 proxyToRepository 模式实现数据操作动作
   - 确保自定义动作遵循标准的参数处理方式
   - 使用标准的 ctx.action.params 获取动作参数
   - 正确设置 ctx.body 返回值和 HTTP 状态码
   - 遵循标准的错误处理模式
   - 正确使用 Repository 模式进行数据操作

3. **废弃API检查**：
   - 避免使用已标记为 @deprecated 的 API
   - 替换已弃用的 resourceName、resourceIndex 等参数
   - 使用 action.resourceName.split(',')[0] 替代已弃用的 resourceName
   - 使用 filterByTk 替代已弃用的 resourceIndex
   - 使用 sourceId 替代已弃用的 associatedIndex
   - 使用 action.actionName 替代已弃用的 actionName

4. **权限控制规范**：
   - 使用标准的 ACL 控制机制
   - 正确设置资源和动作的访问权限
   - 遵循最小权限原则
   - 正确处理角色和权限的关系
   - 实现细粒度的权限控制

```
// 标准资源定义方式
this.app.resource({
  name: 'spreadsheetSheets',
  actions: {
    // 获取表格数据 - 标准实现
    async getData(ctx, next) {
      // 获取参数
      const { filter, fields, appends } = ctx.action.params;
      
      // 执行业务逻辑
      const data = await this.getSpreadsheetData(filter);
      
      // 设置返回值
      ctx.body = data;
      ctx.status = 200;
      
      await next();
    },
    
    // 更新单元格 - 使用 proxyToRepository 模式
    async updateCell(ctx, next) {
      // 使用标准参数
      const { filterByTk, values } = ctx.action.params;
      
      // 执行更新
      const result = await this.updateSpreadsheetCell(filterByTk, values);
      
      // 设置返回值
      ctx.body = result;
      ctx.status = 200;
      
      await next();
    },
    
    // 标准的 proxyToRepository 实现示例
    async standardUpdate(ctx, next) {
      // 获取 Repository
      const repository = this.app.db.getRepository('spreadsheetSheets');
      
      // 获取标准参数
      const { filterByTk, values, whitelist, blacklist } = ctx.action.params;
      
      // 执行更新操作
      const result = await repository.update({
        filterByTk,
        values,
        whitelist,
        blacklist,
        context: ctx
      });
      
      // 设置返回值
      ctx.body = result;
      ctx.status = 200;
      
      await next();
    }
  }
});

// 标准权限设置
this.app.acl.allow('spreadsheetSheets', 'getData');
this.app.acl.allow('spreadsheetSheets', 'updateCell');

// 使用标准动作的替代方案
// this.app.resource({
//   name: 'spreadsheetSheets',
//   actions: {
//     // 使用标准的 update 动作
//     update: true // 将自动使用标准的 update 实现
//   }
// });
```

1. **CSS Modules 隔离方案**：
   - 使用 CSS Modules 对插件特定样式进行隔离
   - 为 Handsontable 组件应用自定义样式前缀
   - 通过 CSS-in-JS 方案动态生成样式
   - 使用 BEM 命名规范确保样式类名唯一性
   - 避免使用过于通用的类名防止样式泄漏

2. **主题定制**：
   - 根据主程序的 Ant Design 主题变量定制 Handsontable 外观
   - 使用 CSS 自定义属性（CSS Variables）实现主题切换
   - 确保插件组件遵循主程序的设计规范
   - 通过读取主程序主题配置动态调整插件样式
   - 实现暗色主题和亮色主题的适配

3. **样式冲突处理**：
   - 使用 :global 选择器谨慎处理全局样式
   - 通过样式优先级控制确保主程序样式不被覆盖
   - 在开发过程中使用浏览器开发者工具检查样式冲突
   - 使用 PostCSS 插件自动添加浏览器前缀
   - 通过 CSS Reset 或 Normalize.css 确保样式一致性

### 8.11 构建优化措施
为减少初始加载体积并避免重复打包，采取以下构建优化措施：

1. **Webpack externals 配置**：
   - 在插件构建配置中设置 externals，排除 React、ReactDOM、Ant Design 等主程序已提供的依赖
   - 避免将主程序已包含的大型依赖库重复打包到插件中
   - 确保插件运行时正确引用主程序提供的全局变量
   - 配置 externals 时需要与主程序的全局变量名保持一致
   - 使用 NocoBase 构建系统提供的 externals 配置确保兼容性

2. **动态导入和代码分割**：
   - 对非核心功能模块使用动态导入（import()）实现按需加载
   - 将大型依赖库（如 Handsontable）分割成独立的代码块
   - 通过路由级别的代码分割优化初始加载性能
   - 使用 React.lazy 和 Suspense 实现组件懒加载
   - 对图表、编辑器等大型组件进行异步加载

3. **构建产物分析**：
   - 使用 webpack-bundle-analyzer 分析构建产物大小
   - 定期审查和优化插件的依赖树
   - 移除未使用的代码和依赖项
   - 启用 gzip 压缩减少网络传输体积
   - 使用 Tree Shaking 移除未使用的代码

## 9. 构建配置与优化

### 9.1 构建配置文件
插件的构建配置通过 `build.config.ts` 文件进行定义，该文件位于插件根目录下。以下是一个典型的构建配置示例：

``typescript
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  // 构建前执行的钩子
  beforeBuild: async (log) => {
    log('执行构建前操作');
    // 可以在这里执行一些预处理操作
    // 例如：清理临时文件、生成版本信息等
  },
  
  // 构建后执行的钩子
  afterBuild: async (log) => {
    log('执行构建后操作');
    // 可以在这里执行一些后处理操作，如复制文件、生成额外资源等
    // 例如：复制静态资源、生成 manifest 文件等
  },
  
  // 修改 tsup 配置
  modifyTsupConfig: (config) => {
    // 可以修改 tsup 的配置选项
    // 例如：添加自定义插件、修改输出目录等
    return config;
  }
});
```

### 9.2 Webpack Externals 配置
为了防止重复打包主程序已经提供的依赖库，需要在构建配置中正确设置 externals。NocoBase 的插件构建系统会自动处理大部分 externals 配置，但开发者仍需了解其原理：

1. **自动 externals**：
   - NocoBase 构建系统会自动将主程序提供的依赖设置为 externals
   - 包括 React、ReactDOM、Ant Design 等核心库
   - 这些依赖在运行时会从主程序中获取
   - 自动 externals 配置基于主程序的 package.json 依赖声明

2. **手动 externals 配置**：
   如果需要添加额外的 externals，可以在 `build.config.ts` 中进行配置：
   - 需要确保 externals 的名称与主程序中全局变量名一致
   - 可以通过查看主程序构建配置确定正确的 externals 名称

``typescript
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyTsupConfig: (config) => {
    // 添加自定义 externals
    config.external = [
      ...(config.external || []),
      'some-external-library'
    ];
    
    return config;
  }
});
```

### 9.3 代码分割与动态导入
为了优化插件的加载性能，建议使用代码分割和动态导入：

1. **路由级别分割**：
```typescript
// 在插件路由配置中使用动态导入
this.app.router.add('admin.spreadsheet', {
  path: '/spreadsheet',
  Component: React.lazy(() => import('./pages/SpreadsheetPage'))
});
```

2. **功能模块分割**：
```typescript
// 按需加载大型功能模块
const loadHandsontable = () => import('handsontable');

// 在需要时加载
const handleClick = async () => {
  const { default: Handsontable } = await loadHandsontable();
  // 使用 Handsontable
};
```

3. **条件加载**：
```typescript
// 根据条件动态加载模块
const loadChartModule = async (chartType) => {
  switch (chartType) {
    case 'line':
      return await import('./charts/LineChart');
    case 'bar':
      return await import('./charts/BarChart');
    default:
      return await import('./charts/DefaultChart');
  }
};
```

4. **组件懒加载**：
``typescript
// 使用 React.lazy 实现组件懒加载
const SpreadsheetEditor = React.lazy(() => import('./components/SpreadsheetEditor'));
const SpreadsheetToolbar = React.lazy(() => import('./components/SpreadsheetToolbar'));

// 在组件中使用 Suspense 包装懒加载组件
const SpreadsheetPage = () => {
  return (
    <div>
      <React.Suspense fallback={<div>Loading...</div>}>
        <SpreadsheetToolbar />
        <SpreadsheetEditor />
      </React.Suspense>
    </div>
  );
};
```

### 9.4 构建优化策略

1. **依赖分析**：
   - 使用 `webpack-bundle-analyzer` 分析构建产物
   - 识别和移除未使用的依赖
   - 优化依赖树结构
   - 使用 `npm ls` 或 `yarn list` 检查依赖关系

2. **Tree Shaking**：
   - 确保使用 ES 模块导入导出语法
   - 避免引入整个库，只导入需要的部分
   - 配置 sideEffects 以启用更激进的 tree shaking
   - 使用 webpack 的 optimization 配置优化代码分割

3. **压缩和优化**：
   - 启用代码压缩和混淆
   - 使用 gzip 或 brotli 压缩静态资源
   - 优化图片和其他静态资源
   - 使用 CDN 加速静态资源加载

### 9.5 构建产物检查
构建完成后，应检查以下内容确保构建质量：

1. **文件大小**：
   - 检查构建产物大小是否合理
   - 确保核心依赖没有被重复打包
   - 验证动态导入是否正常工作
   - 使用 `ls -lh` 或文件管理器检查 dist 目录大小

2. **依赖版本**：
   - 验证插件依赖与主程序依赖的兼容性
   - 检查是否存在版本冲突
   - 确认 externals 配置是否正确
   - 使用 `npm ls` 检查依赖树是否正确

3. **运行时检查**：
   - 在开发环境中测试插件功能
   - 验证所有外部依赖是否正确引用
   - 检查是否有运行时错误
   - 在生产环境中进行集成测试

## 10. 函数、属性、变量规范检查

为确保电子表格插件的函数、属性、变量命名和使用符合 NocoBase 官方规范，避免冲突、不兼容或弃用的情况，采取以下检查措施：

### 10.1 服务端插件规范检查

#### 10.1.1 插件类属性和方法规范
- **继承规范**：插件类必须继承自 `@nocobase/server` 的 `Plugin` 基类
- **构造函数参数**：构造函数必须接受 `app: Application` 和 `options: any` 两个参数
- **核心属性访问**：使用标准属性访问器，如 `this.app`、`this.db`、`this.resourceManager` 等
- **日志记录**：使用 `this.log` 记录日志，而非直接使用 console

```typescript
// 正确的插件类实现
import { Plugin } from '@nocobase/server';

export class SpreadsheetPlugin extends Plugin {
  async load() {
    // 正确使用 app 属性
    this.app.resource({
      name: 'spreadsheetSheets',
      actions: {
        async getData(ctx, next) {
          // 正确使用日志记录
          this.log.info('Getting spreadsheet data');
          await next();
        }
      }
    });
  }
}
```

#### 10.1.2 应用实例属性使用规范
- **数据库访问**：使用 `this.app.db` 访问数据库实例
- **资源配置**：使用 `this.app.resourceManager` 或已弃用但仍然支持的 `this.app.resourcer`
- **权限控制**：使用 `this.app.acl` 管理访问控制
- **缓存管理**：使用 `this.app.cacheManager` 和 `this.app.cache`
- **插件管理**：使用 `this.app.pm` 访问插件管理器

#### 10.1.3 已弃用API检查
- 避免使用标记为 `@deprecated` 的属性和方法
- 使用新的替代方案替换已弃用的API
- 特别注意以下已弃用的API：
  - `this.app.resourcer` → 使用 `this.app.resourceManager`
  - `this.app.collection()` → 使用 `this.app.db.collection()`
  - `this.app.resource()` → 使用 `this.app.resourceManager.define()`

### 10.2 客户端插件规范检查

#### 10.2.1 插件类属性和方法规范
- **继承规范**：客户端插件类必须继承自 `@nocobase/client` 的 `Plugin` 基类
- **构造函数参数**：构造函数必须接受 `options: T` 和 `app: Application` 两个参数
- **核心属性访问**：使用标准属性访问器，如 `this.app`、`this.router`、`this.pluginSettingsManager` 等

```typescript
// 正确的客户端插件类实现
import { Plugin } from '@nocobase/client';

export class SpreadsheetPlugin extends Plugin {
  async load() {
    // 正确使用路由管理器
    this.app.router.add('admin.spreadsheet', {
      path: '/spreadsheet',
      Component: SpreadsheetPage
    });
    
    // 正确使用插件设置管理器
    this.app.pluginSettingsManager.add('spreadsheet', {
      title: 'Spreadsheet',
      icon: 'TableOutlined',
      Component: SpreadsheetSettings
    });
  }
}
```

#### 10.2.2 应用实例属性使用规范
- **路由管理**：使用 `this.app.router` 管理路由
- **组件注册**：使用 `this.app.addComponents()` 注册组件
- **插件设置**：使用 `this.app.pluginSettingsManager` 管理插件设置
- **Schema初始化器**：使用 `this.app.schemaInitializerManager` 管理Schema初始化器
- **数据源管理**：使用 `this.app.dataSourceManager` 管理数据源

### 10.3 变量命名规范

#### 10.3.1 命名约定
- **常量**：使用全大写字母和下划线分隔，如 `MAX_RETRY_COUNT`
- **变量和函数**：使用驼峰命名法，如 `getUserData`
- **类和构造函数**：使用帕斯卡命名法，如 `SpreadsheetPlugin`
- **私有成员**：使用下划线前缀，如 `_privateMethod`

#### 10.3.2 作用域规范
- **避免全局变量**：尽量避免创建全局变量，使用模块化方式组织代码
- **变量提升**：使用 `const` 和 `let` 替代 `var`，避免变量提升问题
- **作用域隔离**：合理使用函数作用域和块级作用域

### 10.4 函数实现规范

#### 10.4.1 异步函数规范
- **async/await**：优先使用 async/await 而非 Promise 链式调用
- **错误处理**：正确使用 try/catch 处理异步错误
- **返回值**：确保异步函数有明确的返回值或Promise

``typescript
// 正确的异步函数实现
async function fetchSpreadsheetData(sheetId) {
  try {
    const response = await fetch(`/api/spreadsheet/${sheetId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching spreadsheet data:', error);
    throw error;
  }
}
```

#### 10.4.2 中间件函数规范
- **参数规范**：遵循 Koa 中间件函数签名 `(ctx, next) => Promise<void>`
- **next调用**：确保正确调用 `await next()` 以传递控制权
- **错误处理**：在中间件中正确处理错误并传递给错误处理中间件

### 10.5 检查结果总结

#### 10.5.1 符合项
- 插件类正确继承自官方基类
- 使用标准属性访问器访问应用实例
- 遵循命名规范
- 正确实现异步函数和中间件

#### 10.5.2 需要优化项
- 部分地方可能使用了已弃用的API，需要替换为新API
- 个别函数实现可能需要进一步标准化
- 变量作用域管理可以进一步优化

#### 10.5.3 无冲突项
- 未使用与主程序冲突的属性名
- 未使用不兼容的函数签名
- 未使用已废弃的变量命名方式

## 11. SDK规范优化与兼容性提升

为确保电子表格插件充分考虑到主程序的官方SDK规范和方法，提升插件的兼容性和稳定性，采取以下优化措施：

### 11.1 SDK使用规范优化

#### 11.1.1 API客户端使用优化
- **正确使用APIClient**：在客户端组件中使用标准的API客户端进行资源操作
- **资源操作规范**：遵循NocoBase SDK的资源操作模式，使用`apiClient.resource()`方法
- **错误处理**：利用SDK内置的错误处理机制，避免重复实现

``typescript
// 正确的API客户端使用方式
import { useAPIClient } from '@nocobase/client';

const SpreadsheetComponent = (props) => {
  const api = useAPIClient();
  
  const fetchSpreadsheetData = async (sheetId) => {
    try {
      const response = await api.resource('spreadsheetSheets').getData({
        filterByTk: sheetId
      });
      return response.data;
    } catch (error) {
      // SDK会自动处理错误通知
      console.error('Failed to fetch spreadsheet data:', error);
      throw error;
    }
  };
  
  // 使用silent()方法避免重复错误提示
  const silentFetch = async (sheetId) => {
    const silentApi = api.silent();
    return await silentApi.resource('spreadsheetSheets').getData({
      filterByTk: sheetId
    });
  };
  
  return (
    // 组件实现
  );
};
```

#### 11.1.2 认证和权限处理
- **认证状态管理**：利用SDK内置的认证管理器处理用户认证状态
- **权限控制**：通过SDK正确传递认证信息和权限头
- **令牌管理**：使用SDK自动管理认证令牌的刷新和存储

``typescript
// 认证相关操作
import { useAPIClient } from '@nocobase/client';

const AuthComponent = () => {
  const api = useAPIClient();
  
  const handleSignIn = async (values) => {
    try {
      await api.auth.signIn(values);
      // 登录成功后SDK会自动处理令牌存储
    } catch (error) {
      // SDK会自动显示错误信息
      throw error;
    }
  };
  
  const handleSignOut = async () => {
    await api.auth.signOut();
    // SDK会自动清理认证信息
  };
  
  return (
    // 组件实现
  );
};
```

### 11.2 兼容性提升措施

#### 11.2.1 版本兼容性处理
- **SDK版本匹配**：确保插件使用的SDK版本与主程序兼容
- **API版本控制**：在API调用中正确处理版本兼容性
- **向后兼容**：实现向后兼容的API调用方式

``typescript
// 版本兼容性处理示例
import { useAPIClient } from '@nocobase/client';

const VersionCompatibleComponent = () => {
  const api = useAPIClient();
  
  // 检查SDK版本兼容性
  const checkVersionCompatibility = () => {
    // 可以通过API获取版本信息
    return api.request({
      url: 'app:version',
      method: 'get'
    });
  };
  
  // 根据版本使用不同的API调用方式
  const fetchData = async (params) => {
    try {
      // 新版本API
      return await api.resource('spreadsheetSheets').getData(params);
    } catch (error) {
      if (error.response?.status === 404) {
        // 降级到旧版本API
        return await api.request({
          url: 'spreadsheetSheets:getData',
          method: 'get',
          params
        });
      }
      throw error;
    }
  };
  
  return (
    // 组件实现
  );
};
```

#### 11.2.2 浏览器兼容性处理
- **现代浏览器特性检测**：在使用现代浏览器特性前进行检测
- **Polyfill使用**：为不支持的特性提供Polyfill
- **渐进增强**：实现渐进增强的功能特性

``typescript
// 浏览器兼容性处理示例
const checkBrowserCompatibility = () => {
  // 检查是否支持必要的API
  if (!window.WebSocket) {
    throw new Error('WebSocket is not supported in this browser');
  }
  
  if (!window.IntersectionObserver) {
    console.warn('IntersectionObserver is not supported, virtual scrolling may not work optimally');
  }
};

// 在组件加载时检查兼容性
const SpreadsheetEditor = () => {
  useEffect(() => {
    try {
      checkBrowserCompatibility();
    } catch (error) {
      // 显示兼容性警告
      console.error('Browser compatibility issue:', error);
    }
  }, []);
  
  return (
    // 组件实现
  );
};
```

### 11.3 稳定性增强措施

#### 11.3.1 错误处理和恢复机制
- **优雅降级**：在出现错误时提供优雅降级方案
- **自动重试**：对临时性错误实现自动重试机制
- **状态恢复**：实现应用状态的持久化和恢复

``typescript
// 错误处理和恢复机制示例
import { useAPIClient } from '@nocobase/client';

const StableSpreadsheetComponent = () => {
  const api = useAPIClient();
  
  // 自动重试机制
  const retryableRequest = async (requestFn, maxRetries = 3) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        // 对于网络错误或服务器错误进行重试
        if (error.response?.status >= 500 || !error.response) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        // 其他错误直接抛出
        throw error;
      }
    }
    
    throw lastError;
  };
  
  // 数据持久化和恢复
  const saveLocalData = (data) => {
    try {
      localStorage.setItem('spreadsheet_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save local data:', error);
    }
  };
  
  const loadLocalData = () => {
    try {
      const data = localStorage.getItem('spreadsheet_data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load local data:', error);
      return null;
    }
  };
  
  return (
    // 组件实现
  );
};
```

#### 11.3.2 性能监控和优化
- **性能指标收集**：收集关键性能指标
- **内存泄漏检测**：检测和防止内存泄漏
- **资源优化**：优化资源加载和使用

``typescript
// 性能监控和优化示例
const PerformanceOptimizedComponent = () => {
  // 性能监控
  const measurePerformance = (name, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  };
  
  // 内存泄漏检测
  useEffect(() => {
    const initialMemory = performance.memory?.usedJSHeapSize;
    
    return () => {
      // 组件卸载时检查内存使用
      if (performance.memory && initialMemory) {
        const currentMemory = performance.memory.usedJSHeapSize;
        if (currentMemory - initialMemory > 10 * 1024 * 1024) { // 10MB阈值
          console.warn('Potential memory leak detected');
        }
      }
    };
  }, []);
  
  // 资源优化
  const useOptimizedData = (data) => {
    // 使用useMemo优化大数据处理
    return useMemo(() => {
      return processLargeData(data);
    }, [data]);
  };
  
  return (
    // 组件实现
  );
};
```

### 11.4 SDK最佳实践总结

#### 11.4.1 符合项
- 正确使用APIClient进行资源操作
- 利用SDK内置的认证和权限管理
- 遵循SDK的错误处理机制
- 实现版本兼容性处理

#### 11.4.2 需要优化项
- 部分组件可能需要进一步优化SDK使用方式
- 错误处理和恢复机制可以进一步完善
- 性能监控和优化措施需要持续改进

#### 11.4.3 无冲突项
- 未使用与主程序SDK冲突的API调用方式
- 未使用已废弃的SDK方法
- 未使用不兼容的SDK版本
