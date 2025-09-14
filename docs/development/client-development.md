# NocoBase 客户端开发

NocoBase 客户端基于 React 和 Ant Design，提供了丰富的 UI 组件和开发工具。

## 1. 客户端架构

NocoBase 客户端采用模块化设计，主要包括以下核心概念：

- **插件系统**：通过插件扩展功能
- **Schema 驱动**：通过 JSON Schema 定义界面
- **组件系统**：可复用的 UI 组件
- **数据绑定**：与服务端数据自动同步

## 2. 插件客户端入口

每个插件的客户端入口文件通常如下：

```typescript
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    // 插件加载逻辑
  }
}

export default MyPlugin;
```

## 3. 组件开发

### 3.1 基础组件

创建一个简单的 React 组件：

```typescript
import React from 'react';
import { Card, Button } from 'antd';

export const MyComponent = (props) => {
  return (
    <Card title="我的组件">
      <p>这是一个自定义组件</p>
      <Button type="primary">点击我</Button>
    </Card>
  );
};
```

### 3.2 数据绑定组件

使用 NocoBase 提供的 Hooks 进行数据绑定：

```typescript
import React from 'react';
import { useCollectionRecord, useRecord } from '@nocobase/client';
import { Card, Button } from 'antd';

export const DataBoundComponent = (props) => {
  const record = useCollectionRecord(); // 获取当前记录
  const { data, loading, refresh } = useRecord(); // 获取记录数据
  
  const handleRefresh = () => {
    refresh(); // 刷新数据
  };
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  return (
    <Card title={`记录: ${record.id}`}>
      <p>数据: {JSON.stringify(data)}</p>
      <Button onClick={handleRefresh}>刷新</Button>
    </Card>
  );
};
```

### 3.3 表单组件

创建带有表单功能的组件：

```typescript
import React from 'react';
import { Form, Input, Button } from 'antd';
import { useActionContext, useCollectionRecord } from '@nocobase/client';

export const CustomForm = (props) => {
  const { setVisible } = useActionContext();
  const record = useCollectionRecord();
  
  const [form] = Form.useForm();
  
  const onFinish = async (values) => {
    // 提交表单数据
    await props.service.emit('submit', {
      filterByTk: record.id,
      values,
    });
    setVisible(false);
  };
  
  return (
    <Form
      form={form}
      initialValues={record.data}
      onFinish={onFinish}
    >
      <Form.Item
        name="title"
        label="标题"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form.Item>
    </Form>
  );
};
```

## 4. Schema 配置

### 4.1 基础 Schema

通过 JSON Schema 定义界面：

```typescript
const schema = {
  type: 'void',
  'x-component': 'CardItem',
  'x-settings': 'MySettings',
  properties: {
    myBlock: {
      type: 'void',
      'x-component': 'MyComponent',
      'x-content': 'Hello World',
    },
  },
};
```

### 4.2 表单 Schema

定义表单界面：

```typescript
const formSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      title: '标题',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      required: true,
    },
    content: {
      type: 'string',
      title: '内容',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
};
```

## 5. 初始化器开发

### 5.1 页面区块初始化器

``typescript
import React from 'react';
import { useSchemaInitializer } from '@nocobase/client';
import { TableOutlined } from '@ant-design/icons';

export const MyBlockInitializer = (props) => {
  const { insert } = useSchemaInitializer();
  
  return (
    <SchemaInitializerItem
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CardItem',
          'x-settings': 'MyBlockSettings',
          properties: {
            myBlock: {
              type: 'void',
              'x-component': 'MyComponent',
            },
          },
        });
      }}
      title="我的区块"
    />
  );
};
```

### 5.2 注册初始化器

在插件入口中注册初始化器：

```typescript
class MyPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      'otherBlocks.myBlock',
      {
        title: '{{t("My Block")}}',
        Component: MyBlockInitializer,
      }
    );
  }
}
```

## 6. 设置面板开发

### 6.1 设置项定义

``typescript
import { SchemaSettings } from '@nocobase/client';

const myBlockSettings = new SchemaSettings({
  name: 'MyBlockSettings',
  items: [
    {
      name: 'edit',
      type: 'modal',
      title: '编辑',
      component: 'EditComponent',
    },
    {
      name: 'delete',
      type: 'remove',
      title: '删除',
    },
  ],
});
```

### 6.2 注册设置面板

``typescript
class MyPlugin extends Plugin {
  async load() {
    this.app.schemaSettingsManager.add(myBlockSettings);
  }
}
```

## 7. 国际化支持

### 7.1 添加翻译资源

``typescript
import { Plugin } from '@nocobase/client';

class I18nPlugin extends Plugin {
  async load() {
    this.app.i18n.addResources('zh-CN', 'my-plugin', {
      'my-plugin.title': '我的插件',
      'my-plugin.description': '这是一个自定义插件',
    });
    
    this.app.i18n.addResources('en-US', 'my-plugin', {
      'my-plugin.title': 'My Plugin',
      'my-plugin.description': 'This is a custom plugin',
    });
  }
}
```

### 7.2 使用翻译

``typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

export const TranslatedComponent = () => {
  const { t } = useTranslation('my-plugin');
  
  return (
    <div>
      <h1>{t('my-plugin.title')}</h1>
      <p>{t('my-plugin.description')}</p>
    </div>
  );
};
```

## 8. 路由和页面

### 8.1 添加路由

``typescript
class MyPlugin extends Plugin {
  async load() {
    this.app.router.add('my-page', {
      path: '/my-page',
      Component: 'MyPageComponent',
    });
  }
}
```

### 8.2 页面组件

``typescript
import React from 'react';
import { PageWrapper } from '@nocobase/client';

export const MyPageComponent = () => {
  return (
    <PageWrapper>
      <div>我的自定义页面</div>
    </PageWrapper>
  );
};
```

## 9. 主题和样式

### 9.1 使用 Ant Design 组件

``typescript
import React from 'react';
import { Card, Button, Space } from 'antd';

export const ThemedComponent = () => {
  return (
    <Card title="主题组件">
      <Space>
        <Button type="primary">主要按钮</Button>
        <Button>默认按钮</Button>
        <Button type="dashed">虚线按钮</Button>
      </Space>
    </Card>
  );
};
```

### 9.2 自定义样式

``typescript
import React from 'react';
import styled from 'styled-components';

const StyledDiv = styled.div`
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 4px;
`;

export const StyledComponent = () => {
  return (
    <StyledDiv>
      自定义样式组件
    </StyledDiv>
  );
};
```

## 10. 最佳实践

### 10.1 组件设计原则

1. **单一职责**：每个组件只负责一个功能
2. **可复用性**：设计通用组件以便复用
3. **可配置性**：通过 props 提供灵活配置
4. **性能优化**：避免不必要的重渲染

### 10.2 错误处理

``typescript
import React from 'react';
import { useRequest } from '@nocobase/client';

export const ErrorHandlingComponent = () => {
  const { data, loading, error } = useRequest({
    url: '/api/my-endpoint',
  });
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  if (error) {
    return <div>错误: {error.message}</div>;
  }
  
  return <div>数据: {JSON.stringify(data)}</div>;
};
```

### 10.3 测试

``typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('应该渲染标题', () => {
    render(<MyComponent />);
    expect(screen.getByText('我的组件')).toBeInTheDocument();
  });
});
```

## 11. 常用 API

### 11.1 Hooks

- `useCollectionRecord()` - 获取当前记录
- `useRecord()` - 获取记录数据
- `useActionContext()` - 获取操作上下文
- `useRequest()` - 发起请求
- `useTranslation()` - 国际化

### 11.2 组件

- `PageWrapper` - 页面包装器
- `CardItem` - 卡片项
- `FormItem` - 表单项装饰器
- `SchemaComponent` - Schema 组件

### 11.3 工具方法

- `this.app.addComponents()` - 添加组件
- `this.app.router.add()` - 添加路由
- `this.app.i18n.addResources()` - 添加国际化资源

### 11.4 SDK 使用

NocoBase 提供了 `@nocobase/sdk` 包，用于在客户端进行 HTTP 请求和资源操作。详细使用请参考 [SDK 使用指南](./sdk.md)。

#### APIClient 使用示例

``typescript
import { APIClient } from '@nocobase/sdk';

// 创建 API 客户端实例
const apiClient = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 资源操作
const posts = await apiClient.resource('posts').list({
  pageSize: 10,
  page: 1
});

// 常规请求
const response = await apiClient.request({
  url: 'custom-endpoint',
  method: 'post',
  data: { key: 'value' }
});
```

#### Auth 认证管理

```typescript
import { APIClient } from '@nocobase/sdk';

const apiClient = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 用户登录
await apiClient.auth.signIn({
  username: 'admin',
  password: 'admin'
});

// 检查认证状态
if (apiClient.auth.token) {
  console.log('用户已登录');
}

// 用户登出
await apiClient.auth.signOut();
```
