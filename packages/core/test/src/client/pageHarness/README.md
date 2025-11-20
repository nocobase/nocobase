# Page Test Harness

页面测试工具，用于在单元测试中快速创建和测试 NocoBase 2.0 页面。

## Running Tests

运行页面测试时，必须使用 `--client` 标志，因为这是客户端测试工具：

```bash
# 运行所有 page harness 测试
yarn test --client packages/core/test/src/pageHarness/__tests__/index.test.ts

# 运行指定的测试文件
yarn test --client path/to/your/test.test.ts
```

## 特性

- ✅ 简洁易用的 API
- ✅ 支持 stepParams 配置
- ✅ 支持多层级配置（页面、Tab、区块、字段、按钮）
- ✅ 简化写法和详细配置可混用
- ✅ 完全兼容 FlowModel
- ✅ 类型安全

## 基础用法

### 1. 创建空页面

```typescript
import { createPageTestHarness } from '@nocobase/test/client';

const harness = await createPageTestHarness();
await harness.render();
const page = harness.getRootPageModel();
```

### 2. 创建带 Table 区块的页面

```typescript
const harness = await createPageTestHarness({
  blocks: [
    { 
      type: 'Table', 
      collection: 'users' 
    }
  ]
});
```

### 3. 带模拟数据

```typescript
const harness = await createPageTestHarness({
  blocks: [
    { 
      type: 'Table', 
      collection: 'users' 
    }
  ],
  data: {
    users: [
      { id: 1, name: 'Alice', email: 'alice@test.com' },
      { id: 2, name: 'Bob', email: 'bob@test.com' }
    ]
  }
});
```

## stepParams 配置

### 区块级别的 stepParams

```typescript
const harness = await createPageTestHarness({
  blocks: [
    { 
      type: 'Table', 
      collection: 'users',
      stepParams: {
        default: {
          step1: {
            dataSourceKey: 'main',
            collectionName: 'users'
          }
        },
        tableSettings: {
          showIndex: true,
          pageSize: 20
        }
      }
    }
  ]
});
```

### 页面和 Tab 级别的 stepParams

```typescript
const harness = await createPageTestHarness({
  // 页面级别
  stepParams: {
    pageSettings: {
      hidePageTitle: false,
      enablePageTabs: true
    }
  },
  tabs: [
    {
      title: 'Overview',
      // Tab 级别
      stepParams: {
        tabSettings: {
          icon: 'UserOutlined'
        }
      },
      blocks: [
        { 
          type: 'Table', 
          collection: 'users',
          // 区块级别
          stepParams: {
            tableSettings: {
              showIndex: true
            }
          }
        }
      ]
    }
  ]
});
```

### 字段级别的 stepParams

```typescript
const harness = await createPageTestHarness({
  blocks: [
    { 
      type: 'Form(Add new)', 
      collection: 'users',
      fields: [
        {
          name: 'name',
          stepParams: {
            default: {
              step1: {
                title: '用户名',
                required: true
              }
            }
          }
        },
        {
          name: 'email',
          stepParams: {
            default: {
              step1: {
                title: '邮箱地址',
                required: false
              }
            }
          }
        }
      ]
    }
  ]
});
```

### 按钮级别的 stepParams

```typescript
const harness = await createPageTestHarness({
  blocks: [
    { 
      type: 'Table', 
      collection: 'users',
      actions: [
        {
          type: 'add',
          stepParams: {
            default: {
              step1: {
                title: '添加用户'
              }
            }
          }
        },
        {
          type: 'delete',
          stepParams: {
            default: {
              step1: {
                title: '批量删除',
                confirmText: '确定要删除吗？'
              }
            }
          }
        }
      ]
    }
  ]
});
```

## 简化写法

### 简化的区块配置

```typescript
const harness = await createPageTestHarness({
  blocks: [
    { 
      type: 'Table', 
      collection: 'users',
      // 简化属性会自动转换为 stepParams
      showIndex: true,
      pageSize: 20,
      columns: ['name', 'email'],
      actions: ['add', 'delete']
    }
  ]
});
```

### 混合使用简化和详细配置

```typescript
const harness = await createPageTestHarness({
  blocks: [
    { 
      type: 'Table', 
      collection: 'users',
      // 简化配置
      showIndex: true,
      pageSize: 20,
      // 详细的 stepParams
      stepParams: {
        dataScope: {
          filter: {
            status: { $eq: 'active' }
          }
        }
      },
      columns: ['name', 'email'],
      actions: ['add', 'delete']
    }
  ]
});
```

## 完整示例

### 多 Tab 页面，包含多种区块

```typescript
const harness = await createPageTestHarness({
  pageTitle: 'User Management',
  pageConfig: {
    hidePageTitle: false,
    enablePageTabs: true
  },
  tabs: [
    {
      title: 'User List',
      icon: 'UserOutlined',
      blocks: [
        {
          type: 'Table',
          collection: 'users',
          stepParams: {
            tableSettings: {
              showIndex: true,
              pageSize: 10,
              dragSort: false
            },
            dataScope: {
              filter: {
                $and: [
                  { status: { $eq: 'active' } }
                ]
              }
            }
          },
          columns: [
            {
              name: 'name',
              stepParams: {
                default: {
                  step1: {
                    title: '姓名',
                    width: 200
                  }
                }
              }
            },
            'email'
          ],
          actions: [
            {
              type: 'add',
              stepParams: {
                default: {
                  step1: {
                    title: '添加用户'
                  }
                }
              }
            },
            'delete'
          ]
        }
      ]
    },
    {
      title: 'User Details',
      icon: 'InfoCircleOutlined',
      blocks: [
        {
          type: 'Details',
          collection: 'users',
          recordId: 1,
          layout: 'horizontal',
          stepParams: {
            detailsSettings: {
              refresh: true
            }
          },
          fields: [
            'name',
            {
              name: 'email',
              stepParams: {
                default: {
                  step1: {
                    title: '邮箱地址'
                  }
                }
              }
            }
          ]
        },
        {
          type: 'Form(Edit)',
          collection: 'users',
          recordId: 1,
          stepParams: {
            formSettings: {
              layout: 'vertical'
            }
          },
          fields: [
            {
              name: 'name',
              stepParams: {
                default: {
                  step1: {
                    title: '用户名',
                    required: true
                  }
                }
              }
            },
            {
              name: 'email',
              stepParams: {
                default: {
                  step1: {
                    title: '邮箱',
                    required: false
                  }
                }
              }
            }
          ],
          actions: ['submit', 'cancel']
        }
      ]
    }
  ],
  data: {
    users: [
      { id: 1, name: 'Alice', email: 'alice@test.com' },
      { id: 2, name: 'Bob', email: 'bob@test.com' }
    ]
  }
});
```

## 工具方法

### 查找区块

```typescript
// 通过 predicate 查找
const tableBlock = harness.findBlock(block => block.collection === 'users');

// 通过 key 查找
const block = harness.findBlock('my-block-key');
```

### 切换 Tab

```typescript
await harness.openTab('tab-key');
// 或使用 title
await harness.openTab('User Details');
```

### 触发 Flow

```typescript
await harness.dispatchFlow('block-uid', 'refresh', { param1: 'value' });
```

### 渲染页面

```typescript
const renderResult = await harness.render();
// renderResult 是 Testing Library 的 RenderResult

// 或使用钩子
await harness.render({
  beforeRender: async () => {
    // 渲染前的准备
  },
  afterRender: async () => {
    // 渲染后的验证
  }
});
```

### 清理资源

```typescript
await harness.cleanup();
```

## API 参考

### PageTestHarnessConfig

```typescript
interface PageTestHarnessConfig {
  // 页面级别的 stepParams
  stepParams?: StepParams;
  
  // 标签页配置
  tabs?: TabConfig[];
  
  // 直接配置区块（不使用 tabs）
  blocks?: BlockConfig[];
  
  // 模拟数据
  data?: Record<string, any[]>;
  
  // 自定义区块类型
  customBlocks?: Record<string, typeof FlowModel>;
  
  // API Mock 配置
  apiMocks?: ApiMockConfig[];
  
  // 插件配置
  plugins?: Plugin[];
  
  // 页面标题
  pageTitle?: string;
  
  // 页面配置
  pageConfig?: {
    hidePageTitle?: boolean;
    enablePageTabs?: boolean;
    disablePageHeader?: boolean;
  };
}
```

### BlockConfig

```typescript
interface BlockConfig {
  // 简化写法
  type?: 'Table' | 'Form(Add new)' | 'Form(Edit)' | 'Details' | ...;
  collection?: string;
  recordId?: number | string;
  
  // 完全自定义
  use?: string;  // Model 类名
  uid?: string;
  
  // stepParams - 核心配置
  stepParams?: StepParams;
  
  // 子模型
  fields?: (string | FieldConfig)[];
  columns?: (string | ColumnConfig)[];
  actions?: (string | ActionConfig)[];
  rowActions?: (string | ActionConfig)[];
  
  // 任意其他属性（会被转换为 stepParams）
  [key: string]: any;
}
```

### StepParams

```typescript
type StepParams = Record<string, Record<string, any>>;

// 例如：
{
  default: {
    step1: {
      // 默认配置
    }
  },
  tableSettings: {
    // 表格设置
  },
  dataScope: {
    // 数据范围
  }
}
```

## 支持的区块类型

- `Table` - 表格区块
- `Form(Add new)` - 新建表单
- `Form(Edit)` - 编辑表单
- `Details` - 详情区块
- `List` - 列表区块
- `Grid Card` - 网格卡片
- `Chart` - 图表区块
- `Filter form` - 筛选表单
- `JS block` - JavaScript 区块
- `Iframe` - Iframe 区块
- `Action panel` - 操作面板

## 注意事项

1. `stepParams` 的结构需要符合对应 FlowModel 的要求
2. 简化属性会自动转换到 `stepParams.default.step1`
3. 可以混合使用简化和详细配置
4. 字段、列、按钮都支持字符串简写形式
5. 测试结束后记得调用 `cleanup()` 清理资源
