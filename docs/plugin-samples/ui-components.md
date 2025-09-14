# UI 组件示例

本文档将详细介绍如何在 NocoBase 插件中开发自定义 UI 组件和页面。

## 客户端基础

### 插件结构

NocoBase 客户端插件基于 React 构建，使用 Ant Design 作为 UI 库。

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

class UIComponentsPlugin extends Plugin {
  async load() {
    // 插件加载逻辑
  }
}

export default UIComponentsPlugin;
```

### 组件注册

```typescript
class UIComponentsPlugin extends Plugin {
  async load() {
    // 注册自定义组件
    this.app.addComponents({
      MyCustomComponent,
      AnotherComponent,
    });
  }
}
```

## 基础组件开发

### 简单展示组件

```typescript
// src/client/components/HelloWorld.tsx
import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const HelloWorld: React.FC = () => {
  return (
    <Card>
      <Title level={3}>Hello World 组件</Title>
      <Paragraph>
        这是一个简单的展示组件示例。
      </Paragraph>
    </Card>
  );
};
```

### 带状态的交互组件

```typescript
// src/client/components/Counter.tsx
import React, { useState } from 'react';
import { Card, Button, Space, Typography } from 'antd';

const { Title, Text } = Typography;

export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);
  
  return (
    <Card title="计数器组件">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={2}>{count}</Title>
        <Space>
          <Button onClick={() => setCount(count + 1)}>增加</Button>
          <Button onClick={() => setCount(count - 1)}>减少</Button>
          <Button onClick={() => setCount(0)}>重置</Button>
        </Space>
        <Text type="secondary">当前计数: {count}</Text>
      </Space>
    </Card>
  );
};
```

## 表单组件

### 基础表单

```typescript
// src/client/components/UserForm.tsx
import React from 'react';
import { Form, Input, Button, Space } from 'antd';
import { useAPIClient } from '@nocobase/client';

export const UserForm: React.FC = () => {
  const [form] = Form.useForm();
  const api = useAPIClient();
  
  const onFinish = async (values) => {
    try {
      await api.resource('users').create({ values });
      form.resetFields();
    } catch (error) {
      console.error('创建用户失败:', error);
    }
  };
  
  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item
        name="name"
        label="姓名"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input placeholder="请输入姓名" />
      </Form.Item>
      
      <Form.Item
        name="email"
        label="邮箱"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input placeholder="请输入邮箱" />
      </Form.Item>
      
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            创建用户
          </Button>
          <Button htmlType="button" onClick={() => form.resetFields()}>
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
```

### 自定义表单控件

```typescript
// src/client/components/CustomInput.tsx
import React from 'react';
import { Input, Space, Typography } from 'antd';
import { useFieldSchema } from '@formily/react';

const { Text } = Typography;

export const CustomInput: React.FC = (props) => {
  const fieldSchema = useFieldSchema();
  const [value, setValue] = React.useState(props.value || '');
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    props.onChange?.(newValue);
  };
  
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        placeholder={fieldSchema?.['x-placeholder'] || '请输入'}
      />
      {fieldSchema?.description && (
        <Text type="secondary">{fieldSchema.description}</Text>
      )}
    </Space>
  );
};
```

## 数据展示组件

### 列表组件

```typescript
// src/client/components/UserList.tsx
import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space } from 'antd';
import { useAPIClient } from '@nocobase/client';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const api = useAPIClient();
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.resource('users').list();
      setUsers(data);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString(),
    },
  ];
  
  return (
    <Card
      title="用户列表"
      extra={
        <Space>
          <Button onClick={fetchUsers} loading={loading}>
            刷新
          </Button>
        </Space>
      }
    >
      <Table
        dataSource={users}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
        }}
      />
    </Card>
  );
};
```

### 图表组件

```typescript
// src/client/components/ChartComponent.tsx
import React, { useState, useEffect } from 'react';
import { Card, Spin } from 'antd';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAPIClient } from '@nocobase/client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const ChartComponent: React.FC = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const api = useAPIClient();
  
  const fetchChartData = async () => {
    setLoading(true);
    try {
      const { data } = await api.request({
        url: 'analytics/getStats',
      });
      
      setData({
        labels: data.labels,
        datasets: [
          {
            label: '用户统计',
            data: data.values,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      });
    } catch (error) {
      console.error('获取图表数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchChartData();
  }, []);
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '用户统计图表',
      },
    },
  };
  
  return (
    <Card title="数据图表">
      <Spin spinning={loading}>
        {data ? (
          <Bar options={options} data={data} />
        ) : (
          <div>暂无数据</div>
        )}
      </Spin>
    </Card>
  );
};
```

## 页面组件

### 自定义页面

```typescript
// src/client/pages/DashboardPage.tsx
import React from 'react';
import { Page, Grid, GridItem } from '@nocobase/client';
import { Counter } from '../components/Counter';
import { UserList } from '../components/UserList';
import { ChartComponent } from '../components/ChartComponent';

export const DashboardPage: React.FC = () => {
  return (
    <Page>
      <Grid>
        <GridItem span={12}>
          <Counter />
        </GridItem>
        <GridItem span={12}>
          <ChartComponent />
        </GridItem>
        <GridItem span={24}>
          <UserList />
        </GridItem>
      </Grid>
    </Page>
  );
};
```

### 路由配置

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import { DashboardPage } from './pages/DashboardPage';

class UIComponentsPlugin extends Plugin {
  async load() {
    // 添加路由
    this.app.router.add('dashboard', {
      path: '/dashboard',
      Component: DashboardPage,
    });
    
    // 添加导航菜单项
    this.app.router.addRoute({
      path: '/dashboard',
      element: <DashboardPage />,
    });
  }
}
```

## 区块组件

### 可拖拽区块

```typescript
// src/client/blocks/CustomBlock.tsx
import React from 'react';
import { Card, Typography } from 'antd';
import { useSchemaInitializer } from '@nocobase/client';

const { Title } = Typography;

export const CustomBlock: React.FC = (props) => {
  return (
    <Card {...props}>
      <Title level={4}>自定义区块</Title>
      <p>这是一个可拖拽的自定义区块组件。</p>
    </Card>
  );
};

// 区块初始化器
export const CustomBlockInitializer: React.FC = (props) => {
  const { insert } = useSchemaInitializer();
  
  return (
    <div
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CustomBlock',
          'x-designer': 'CustomBlock.Designer',
        });
      }}
      {...props}
    >
      自定义区块
    </div>
  );
};

// 区块设计器
export const CustomBlockDesigner: React.FC = (props) => {
  // 实现区块设计器逻辑
  return <div {...props}>区块设计器</div>;
};
```

### 注册区块组件

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import {
  CustomBlock,
  CustomBlockInitializer,
  CustomBlockDesigner,
} from './blocks/CustomBlock';

class UIComponentsPlugin extends Plugin {
  async load() {
    // 注册组件
    this.app.addComponents({
      CustomBlock,
      'CustomBlock.Designer': CustomBlockDesigner,
    });
    
    // 添加到区块初始化器
    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      'otherBlocks.custom',
      {
        title: '自定义区块',
        Component: CustomBlockInitializer,
      }
    );
  }
}
```

## 表格列组件

### 自定义表格列

```typescript
// src/client/columns/StatusColumn.tsx
import React from 'react';
import { Tag } from 'antd';

export const StatusColumn: React.FC<{ value: string }> = ({ value }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'red';
      case 'pending':
        return 'orange';
      default:
        return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'inactive':
        return '非活跃';
      case 'pending':
        return '待处理';
      default:
        return status;
    }
  };
  
  return (
    <Tag color={getStatusColor(value)}>
      {getStatusText(value)}
    </Tag>
  );
};
```

### 注册表格列组件

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import { StatusColumn } from './columns/StatusColumn';

class UIComponentsPlugin extends Plugin {
  async load() {
    // 注册表格列组件
    this.app.addComponents({
      StatusColumn,
    });
  }
}
```

## 表单字段组件

### 自定义表单字段

```typescript
// src/client/fields/PhoneNumberField.tsx
import React from 'react';
import { Input } from 'antd';

export const PhoneNumberField: React.FC = (props) => {
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    
    // 移除所有非数字字符
    const phoneNumber = value.replace(/[^\d]/g, '');
    
    // 格式化为 XXX-XXXX-XXXX
    if (phoneNumber.length >= 11) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
    }
    
    return phoneNumber;
  };
  
  const handleChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    props.onChange?.(formatted);
  };
  
  return (
    <Input
      {...props}
      onChange={handleChange}
      placeholder="请输入手机号码"
    />
  );
};
```

### 注册表单字段组件

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import { PhoneNumberField } from './fields/PhoneNumberField';

class UIComponentsPlugin extends Plugin {
  async load() {
    // 注册表单字段组件
    this.app.addComponents({
      PhoneNumberField,
    });
  }
}
```

## 国际化支持

### 多语言组件

```typescript
// src/client/components/I18nComponent.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export const I18nComponent: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('welcome')}</h2>
      <p>{t('description')}</p>
    </div>
  );
};
```

### 语言包配置

```typescript
// src/client/locale/index.ts
import { i18n } from '@nocobase/client';

i18n.addResources('zh-CN', 'my-plugin', {
  welcome: '欢迎使用',
  description: '这是一个国际化组件示例',
});

i18n.addResources('en-US', 'my-plugin', {
  welcome: 'Welcome',
  description: 'This is an internationalization component example',
});
```

## 组件状态管理

### 使用 Context 管理状态

```typescript
// src/client/contexts/AppContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  theme: string;
  setTheme: (theme: string) => void;
  user: any;
  setUser: (user: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  
  return (
    <AppContext.Provider value={{ theme, setTheme, user, setUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

### 在组件中使用状态

```typescript
// src/client/components/ThemeToggle.tsx
import React from 'react';
import { Switch, Space } from 'antd';
import { useAppContext } from '../contexts/AppContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useAppContext();
  
  const handleThemeChange = (checked) => {
    setTheme(checked ? 'dark' : 'light');
  };
  
  return (
    <Space>
      <span>浅色</span>
      <Switch
        checked={theme === 'dark'}
        onChange={handleThemeChange}
      />
      <span>深色</span>
    </Space>
  );
};
```

## 组件测试

### 编写组件测试

```typescript
// src/client/__tests__/components/Counter.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from '../../components/Counter';

describe('Counter', () => {
  it('should render with initial count 0', () => {
    render(<Counter />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
  
  it('should increase count when click add button', () => {
    render(<Counter />);
    const addButton = screen.getByText('增加');
    fireEvent.click(addButton);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
  
  it('should decrease count when click subtract button', () => {
    render(<Counter />);
    const subtractButton = screen.getByText('减少');
    fireEvent.click(subtractButton);
    expect(screen.getByText('-1')).toBeInTheDocument();
  });
  
  it('should reset count when click reset button', () => {
    render(<Counter />);
    const addButton = screen.getByText('增加');
    const resetButton = screen.getByText('重置');
    
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    expect(screen.getByText('2')).toBeInTheDocument();
    
    fireEvent.click(resetButton);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
```

## 组件最佳实践

### 1. 组件设计原则

```typescript
// 使用 TypeScript 定义组件 Props
interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
  };
  actions?: React.ReactNode;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({ user, actions, className }) => {
  return (
    <Card className={className}>
      <Card.Meta
        title={user.name}
        description={user.email}
      />
      {actions && <div>{actions}</div>}
    </Card>
  );
};
```

### 2. 性能优化

```typescript
// 使用 React.memo 优化组件
const OptimizedComponent = React.memo(({ data }) => {
  // 组件实现
  return <div>{data}</div>;
});

// 使用 useMemo 优化计算
const ExpensiveComponent: React.FC<{ items: any[] }> = ({ items }) => {
  const expensiveValue = React.useMemo(() => {
    // 昂贵的计算
    return items.reduce((acc, item) => acc + item.value, 0);
  }, [items]);
  
  return <div>{expensiveValue}</div>;
};
```

### 3. 错误边界

```typescript
// src/client/components/ErrorBoundary.tsx
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('组件错误:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>组件出现错误</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    
    return this.props.children;
  }
};
```

## 下一步

- 学习 [工作流节点](./workflow-nodes.md) 示例
- 掌握 [插件设置](./plugin-settings.md) 示例
