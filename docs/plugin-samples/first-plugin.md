# 第一个插件示例

本文档将指导您创建第一个 NocoBase 插件，这是学习插件开发的最佳起点。

## 创建插件

使用 NocoBase CLI 工具快速创建插件模板：

```bash
# 切换到项目根目录
cd nocobase

# 创建插件
yarn pm create hello
```

这将在 `packages/plugins/@local/` 目录下创建一个名为 `plugin-hello` 的插件。

## 插件目录结构

创建的插件将具有以下目录结构：

```
plugin-hello/
├── package.json
├── src/
│   ├── client/
│   │   └── index.tsx
│   └── server/
│       └── index.ts
└── README.md
```

## 服务端代码分析

服务端入口文件 `src/server/index.ts` 包含插件的基本结构：

```typescript
import { InstallOptions, Plugin } from '@nocobase/server';

export class HelloPlugin extends Plugin {
  beforeLoad() {
    // 在插件加载前执行的逻辑
  }

  async load() {
    // 插件加载时执行的主要逻辑
    this.app.resource({
      name: 'testHello',
      actions: {
        async getInfo(ctx, next) {
          ctx.body = `Hello hello!`;
          next();
        },
      },
    });
    this.app.acl.allow('testHello', 'getInfo');
  }

  async disable() {
    // 插件禁用时执行的清理逻辑
  }

  async install(options: InstallOptions) {
    // 插件安装时执行的初始化逻辑
  }
}

export default HelloPlugin;
```

### 代码解析

1. **Plugin 类**：所有插件都必须继承自 `Plugin` 基类
2. **beforeLoad()**：在插件加载前执行，用于初始化配置
3. **load()**：插件加载时执行的主要逻辑
4. **disable()**：插件禁用时执行的清理逻辑
5. **install()**：插件安装时执行的初始化逻辑

## 客户端代码分析

客户端入口文件 `src/client/index.tsx` 包含前端组件：

```typescript
import { Plugin } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';

class HelloPlugin extends Plugin {
  async load() {
    // 插件加载逻辑
    this.app.pluginSettingsManager.add('hello', {
      title: 'Hello',
      icon: 'ApiOutlined',
      Component: () => (
        <Card bordered={false}>
          <div>Hello plugin setting page</div>
        </Card>
      ),
      sort: 100,
    });
  }
}

export default HelloPlugin;
```

### 代码解析

1. **Plugin 类**：客户端插件也继承自 `Plugin` 基类
2. **load()**：插件加载时执行的主要逻辑
3. **pluginSettingsManager.add()**：添加插件设置页面

## 激活插件

创建插件后，需要激活它：

```bash
# 安装插件
yarn nocobase install hello

# 或者使用完整包名
yarn nocobase install @local/plugin-hello
```

## 调试插件

启动开发服务器以调试插件：

```bash
yarn dev
```

访问 `http://localhost:13000/api/testHello:getInfo` 可以看到插件提供的 API 接口。

## 扩展示例

### 添加更多 API 接口

```typescript
async load() {
  this.app.resource({
    name: 'testHello',
    actions: {
      async getInfo(ctx, next) {
        ctx.body = `Hello hello!`;
        next();
      },
      async greet(ctx, next) {
        const { name = 'World' } = ctx.action.params;
        ctx.body = `Hello, ${name}!`;
        next();
      },
    },
  });
  this.app.acl.allow('testHello', 'getInfo');
  this.app.acl.allow('testHello', 'greet');
}
```

### 添加 UI 组件

```typescript
import { Plugin, SchemaInitializerItem, useSchemaInitializer } from '@nocobase/client';
import { Card, Button } from 'antd';
import React from 'react';

const HelloBlock = () => {
  const [message, setMessage] = React.useState('Hello World');
  
  return (
    <Card title="Hello Block">
      <p>{message}</p>
      <Button onClick={() => setMessage('Hello NocoBase!')}>
        Click Me
      </Button>
    </Card>
  );
};

const HelloBlockInitializer = (props) => {
  const { insert } = useSchemaInitializer();
  
  return (
    <SchemaInitializerItem
      {...props}
      title="Hello Block"
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'HelloBlock',
        });
      }}
    />
  );
};

class HelloPlugin extends Plugin {
  async load() {
    this.app.addComponents({ HelloBlock });
    
    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      'otherBlocks.hello',
      {
        title: 'Hello Block',
        Component: HelloBlockInitializer,
      }
    );
  }
}

export default HelloPlugin;
```

## 最佳实践

1. **命名规范**：插件名使用 `plugin-` 前缀
2. **代码组织**：将相关功能组织在单独的目录中
3. **错误处理**：合理处理异常情况
4. **日志记录**：记录重要操作和错误信息
5. **测试覆盖**：为插件编写测试用例

## 下一步

- 学习 [表和字段](./tables-fields.md) 示例
- 掌握 [资源和操作](./resources-actions.md) 示例
- 查看其他高级示例
