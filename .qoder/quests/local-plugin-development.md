# 本地插件开发设计文档

> 本文档基于 NocoBase 平台的本地插件开发流程和最佳实践，旨在帮助开发者快速上手并高效开发自定义插件。文档特别包含了电子表格插件的专项规划方案。

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
    "handsontable": "^12.0.0"
  },
  "devDependencies": {
    "@types/handsontable": "^12.0.0"
  },
  "peerDependencies": {
    "@nocobase/client": "1.x",
    "@nocobase/server": "1.x"
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

> 本章节专门针对电子表格插件的开发进行详细规划，确保插件可以作为可选区块集成到NocoBase的页面构建系统中。

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
- 使用 [Handsontable](https://handsontable.com/) 或 [AG-Grid](https://www.ag-grid.com/) 作为核心表格组件
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
      // 实现获取表格数据逻辑
      await next();
    },
    // 更新单元格
    async updateCell(ctx, next) {
      // 实现单元格更新逻辑
      await next();
    },
    // 批量更新
    async batchUpdate(ctx, next) {
      // 实现批量更新逻辑
      await next();
    },
    // 创建新表格
    async createSheet(ctx, next) {
      // 实现创建新表格逻辑
      await next();
    }
  }
});

// 设置访问权限
this.app.acl.allow('spreadsheetSheets', 'getData');
this.app.acl.allow('spreadsheetSheets', 'updateCell');
this.app.acl.allow('spreadsheetSheets', 'batchUpdate');
this.app.acl.allow('spreadsheetSheets', 'createSheet');
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

// 电子表格区块组件
const SpreadsheetBlock = (props) => {
  const { sheetId } = props;
  
  // 使用协作钩子
  useSpreadsheetCollaboration(sheetId);
  
  return (
    <div className="spreadsheet-block">
      {/* 电子表格编辑器 */}
      <div id="spreadsheet-container"></div>
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

