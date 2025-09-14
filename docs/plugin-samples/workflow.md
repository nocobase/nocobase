# 工作流插件示例

## 概述

工作流插件 (`@nocobase/plugin-workflow`) 是一个强大的 BPM 工具，为业务自动化提供基础支持，并且可任意扩展更多的触发器和节点。

## 功能特性

- 提供基础的工作流引擎
- 支持多种触发器（记录创建、更新、删除等）
- 可扩展的节点系统
- 支持条件分支和并行执行
- 与 NocoBase 数据表无缝集成
- 提供工作流监控和日志功能

## 安装和启用

```bash
yarn add @nocobase/plugin-workflow
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(WorkflowPlugin);
  }
}
```

## 基本使用

### 1. 创建简单的工作流

```ts
// src/server/simple-workflow.ts
import { Workflow } from '@nocobase/plugin-workflow';

export const simpleWorkflow: Workflow = {
  title: '订单处理流程',
  type: 'collection',
  config: {
    mode: 1, // 创建时触发
    collection: 'orders'
  },
  nodes: [
    {
      type: 'echo',
      config: {
        message: '新订单已创建: {{data.title}}'
      }
    }
  ]
};
```

### 2. 在客户端管理流程

```tsx
// src/client/components/WorkflowManager.tsx
import React from 'react';
import { WorkflowProvider, WorkflowList } from '@nocobase/plugin-workflow/client';

export default function WorkflowManager() {
  return (
    <WorkflowProvider>
      <WorkflowList />
    </WorkflowProvider>
  );
}
```

## 高级用法

### 1. 条件分支

```ts
// src/server/conditional-workflow.ts
export const conditionalWorkflow: Workflow = {
  title: '审批流程',
  type: 'collection',
  config: {
    mode: 2, // 更新时触发
    collection: 'requests'
  },
  nodes: [
    {
      type: 'condition',
      config: {
        condition: '{{$context.data.amount > 1000}}'
      },
      branches: [
        {
          condition: 'true',
          nodes: [
            {
              type: 'notification',
              config: {
                title: '大额申请需要审批',
                content: '申请金额: {{$context.data.amount}}'
              }
            }
          ]
        },
        {
          condition: 'false',
          nodes: [
            {
              type: 'update',
              config: {
                collection: 'requests',
                params: {
                  filter: {
                    id: '{{$context.data.id}}'
                  },
                  values: {
                    status: 'approved'
                  }
                }
              }
            }
          ]
        }
      ]
    }
  ]
};
```

### 2. 并行执行

```ts
// src/server/parallel-workflow.ts
export const parallelWorkflow: Workflow = {
  title: '并行处理流程',
  type: 'collection',
  config: {
    mode: 1, // 创建时触发
    collection: 'tasks'
  },
  nodes: [
    {
      type: 'parallel',
      branches: [
        {
          nodes: [
            {
              type: 'notification',
              config: {
                title: '任务已分配',
                content: '新任务: {{$context.data.title}}'
              }
            }
          ]
        },
        {
          nodes: [
            {
              type: 'create',
              config: {
                collection: 'taskLogs',
                params: {
                  values: {
                    taskId: '{{$context.data.id}}',
                    action: 'created',
                    timestamp: '{{$date.now}}'
                  }
                }
              }
            }
          ]
        }
      ]
    }
  ]
};
```

## 最佳实践

1. **流程设计**：
   - 保持流程简洁明了
   - 合理使用条件分支
   - 避免过深的嵌套结构

2. **错误处理**：
   - 为关键节点添加错误处理
   - 记录流程执行日志
   - 实现失败重试机制

3. **性能优化**：
   - 避免在流程中执行耗时操作
   - 使用异步处理长时间任务
   - 合理设置流程执行超时

## 扩展示例

### 1. 自定义节点类型

```ts
// src/server/custom-node.ts
import { Node } from '@nocobase/plugin-workflow';

export class CustomNode extends Node {
  async run(context) {
    // 自定义节点逻辑
    console.log('Custom node executed with data:', context.data);
    
    // 返回结果供后续节点使用
    return {
      result: 'Custom processing completed'
    };
  }
}

// 注册自定义节点
import { WorkflowPlugin } from '@nocobase/plugin-workflow';

export class CustomWorkflowPlugin extends WorkflowPlugin {
  async load() {
    await super.load();
    this.registerNode('custom', CustomNode);
  }
}
```

### 2. 集成外部服务

```ts
// src/server/external-service-workflow.ts
export const externalServiceWorkflow: Workflow = {
  title: '外部服务集成',
  type: 'collection',
  config: {
    mode: 1, // 创建时触发
    collection: 'leads'
  },
  nodes: [
    {
      type: 'request',
      config: {
        url: 'https://api.example.com/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer {{config.apiToken}}'
        },
        body: JSON.stringify({
          lead: '{{$context.data}}'
        })
      }
    },
    {
      type: 'condition',
      config: {
        condition: '{{$context.result.status === 200}}'
      },
      branches: [
        {
          condition: 'true',
          nodes: [
            {
              type: 'update',
              config: {
                collection: 'leads',
                params: {
                  filter: {
                    id: '{{$context.data.id}}'
                  },
                  values: {
                    status: 'sent'
                  }
                }
              }
            }
          ]
        }
      ]
    }
  ]
};
```

### 3. 定时任务工作流

```ts
// src/server/scheduled-workflow.ts
export const scheduledWorkflow: Workflow = {
  title: '每日报告',
  type: 'schedule',
  config: {
    mode: 0, // 定时触发
    cron: '0 9 * * *' // 每天上午9点执行
  },
  nodes: [
    {
      type: 'query',
      config: {
        collection: 'orders',
        params: {
          filter: {
            createdAt: {
              $gte: '{{$date.startOfDay}}'
            }
          }
        }
      }
    },
    {
      type: 'aggregation',
      config: {
        collection: 'orders',
        params: {
          aggregation: {
            total: {
              $sum: '$amount'
            },
            count: {
              $sum: 1
            }
          }
        }
      }
    },
    {
      type: 'email',
      config: {
        to: 'manager@example.com',
        subject: '每日订单报告',
        html: `
          <h1>每日订单报告</h1>
          <p>日期: {{$date.format($date.now, 'YYYY-MM-DD')}}</p>
          <p>订单数量: {{$context.result.count}}</p>
          <p>订单总额: {{$context.result.total}}</p>
        `
      }
    }
  ]
};
```

## 常见问题

### 1. 流程调试

```ts
// src/server/debug-workflow.ts
export const debugWorkflow: Workflow = {
  title: '调试流程',
  type: 'collection',
  config: {
    mode: 1, // 创建时触发
    collection: 'debug'
  },
  nodes: [
    {
      type: 'echo',
      config: {
        message: '流程开始执行，数据: {{JSON.stringify($context.data)}}'
      }
    },
    {
      type: 'debug',
      config: {
        // 调试节点，用于输出中间结果
      }
    }
  ]
};
```

### 2. 性能监控

```ts
// src/server/workflow-monitoring.ts
import { Workflow } from '@nocobase/plugin-workflow';

export class WorkflowMonitoring {
  static async monitorExecution(workflow: Workflow, executionTime: number) {
    // 记录流程执行时间
    if (executionTime > 5000) { // 超过5秒
      console.warn(`Workflow ${workflow.title} execution time: ${executionTime}ms`);
    }
  }
}
```

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/workflow)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/workflow)
- [工作流节点插件](https://github.com/nocobase/nocobase/tree/main/packages/plugins/workflow-nodes)
