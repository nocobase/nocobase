# 工作流节点示例

本文档将详细介绍如何在 NocoBase 插件中创建自定义工作流节点。

## 工作流基础

### 工作流概念

工作流是 NocoBase 中用于自动化业务流程的功能模块。每个工作流由多个节点组成，节点代表特定的操作或决策。

### 节点类型

NocoBase 提供了多种内置节点类型：
- 触发器节点：启动工作流
- 操作节点：执行特定操作
- 条件节点：控制流程分支
- 审批节点：处理人工审批
- 循环节点：处理重复任务

## 创建基本节点

### 节点结构

```typescript
// src/server/nodes/CustomNode.ts
import { Processor, Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export default class CustomNode extends Instruction {
  async run(node, input, processor: Processor) {
    try {
      // 节点执行逻辑
      const result = await this.executeCustomLogic(input, node.config);
      
      return {
        status: JOB_STATUS.RESOLVED,
        result,
      };
    } catch (error) {
      return {
        status: JOB_STATUS.FAILED,
        result: error.message,
      };
    }
  }
  
  private async executeCustomLogic(input, config) {
    // 实现自定义逻辑
    return { success: true, data: 'Custom result' };
  }
}
```

### 注册节点

```typescript
// src/server/index.ts
import { Plugin } from '@nocobase/server';
import CustomNode from './nodes/CustomNode';

export class WorkflowNodesPlugin extends Plugin {
  async load() {
    // 注册自定义节点
    this.app.workflow.registerInstruction('custom-node', CustomNode);
  }
}
```

## 客户端节点组件

### 节点配置组件

```typescript
// src/client/nodes/CustomNodeComponent.tsx
import React from 'react';
import { Form, Input, Switch, Space } from 'antd';
import { useTranslation } from 'react-i18next';

export const CustomNodeComponent: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Form.Item
        name={['config', 'message']}
        label={t('消息内容')}
        rules={[{ required: true }]}
      >
        <Input.TextArea placeholder={t('请输入消息内容')} />
      </Form.Item>
      
      <Form.Item
        name={['config', 'sendNotification']}
        label={t('发送通知')}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </Space>
  );
};
```

### 节点查看组件

```typescript
// src/client/nodes/CustomNodeView.tsx
import React from 'react';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';

export const CustomNodeView: React.FC<{ node: any }> = ({ node }) => {
  const { t } = useTranslation();
  const { config } = node;
  
  return (
    <Descriptions column={1} size="small">
      <Descriptions.Item label={t('消息内容')}>
        {config.message}
      </Descriptions.Item>
      <Descriptions.Item label={t('发送通知')}>
        {config.sendNotification ? t('是') : t('否')}
      </Descriptions.Item>
    </Descriptions>
  );
};
```

### 注册客户端组件

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import { CustomNodeComponent, CustomNodeView } from './nodes/CustomNodeComponent';

class WorkflowNodesPlugin extends Plugin {
  async load() {
    // 注册节点组件
    this.app.addComponents({
      'workflow-nodes:custom-node': CustomNodeComponent,
      'workflow-nodes:custom-node-view': CustomNodeView,
    });
  }
}
```

## 数据处理节点

### 数据转换节点

```typescript
// src/server/nodes/DataTransformNode.ts
import { Processor, Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export default class DataTransformNode extends Instruction {
  async run(node, input, processor: Processor) {
    try {
      const { data } = input;
      const { transformations } = node.config;
      
      // 执行数据转换
      const transformedData = this.transformData(data, transformations);
      
      return {
        status: JOB_STATUS.RESOLVED,
        result: transformedData,
      };
    } catch (error) {
      return {
        status: JOB_STATUS.FAILED,
        result: error.message,
      };
    }
  }
  
  private transformData(data, transformations) {
    let result = { ...data };
    
    for (const transform of transformations) {
      switch (transform.type) {
        case 'rename':
          if (result[transform.from]) {
            result[transform.to] = result[transform.from];
            delete result[transform.from];
          }
          break;
          
        case 'add':
          result[transform.field] = transform.value;
          break;
          
        case 'remove':
          delete result[transform.field];
          break;
          
        case 'format':
          if (result[transform.field]) {
            result[transform.field] = this.formatValue(
              result[transform.field],
              transform.format
            );
          }
          break;
      }
    }
    
    return result;
  }
  
  private formatValue(value, format) {
    switch (format) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'date':
        return new Date(value).toISOString();
      default:
        return value;
    }
  }
}
```

### 数据验证节点

```typescript
// src/server/nodes/DataValidationNode.ts
import { Processor, Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export default class DataValidationNode extends Instruction {
  async run(node, input, processor: Processor) {
    try {
      const { data } = input;
      const { rules } = node.config;
      
      // 执行数据验证
      const validationErrors = this.validateData(data, rules);
      
      if (validationErrors.length > 0) {
        return {
          status: JOB_STATUS.FAILED,
          result: {
            errors: validationErrors,
            data,
          },
        };
      }
      
      return {
        status: JOB_STATUS.RESOLVED,
        result: data,
      };
    } catch (error) {
      return {
        status: JOB_STATUS.FAILED,
        result: error.message,
      };
    }
  }
  
  private validateData(data, rules) {
    const errors = [];
    
    for (const rule of rules) {
      const { field, type, required, min, max } = rule;
      const value = data[field];
      
      // 必填验证
      if (required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} 是必填字段`);
        continue;
      }
      
      // 类型验证
      if (value !== undefined && !this.validateType(value, type)) {
        errors.push(`${field} 必须是 ${type} 类型`);
        continue;
      }
      
      // 范围验证
      if (value !== undefined) {
        if (min !== undefined && value < min) {
          errors.push(`${field} 不能小于 ${min}`);
        }
        if (max !== undefined && value > max) {
          errors.push(`${field} 不能大于 ${max}`);
        }
      }
    }
    
    return errors;
  }
  
  private validateType(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      default:
        return true;
    }
  }
}
```

## 外部服务集成节点

### HTTP请求节点

```typescript
// src/server/nodes/HttpRequestNode.ts
import { Processor, Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';
import axios from 'axios';

export default class HttpRequestNode extends Instruction {
  async run(node, input, processor: Processor) {
    try {
      const { url, method, headers, body } = node.config;
      
      // 发送HTTP请求
      const response = await axios({
        url,
        method,
        headers: headers || {},
        data: body || {},
      });
      
      return {
        status: JOB_STATUS.RESOLVED,
        result: {
          status: response.status,
          data: response.data,
          headers: response.headers,
        },
      };
    } catch (error) {
      return {
        status: JOB_STATUS.FAILED,
        result: {
          message: error.message,
          response: error.response?.data,
        },
      };
    }
  }
}
```

### 邮件发送节点

```typescript
// src/server/nodes/EmailNode.ts
import { Processor, Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';
import nodemailer from 'nodemailer';

export default class EmailNode extends Instruction {
  async run(node, input, processor: Processor) {
    try {
      const { to, subject, body, template } = node.config;
      const { data } = input;
      
      // 创建邮件传输器
      const transporter = nodemailer.createTransporter({
        // 邮件服务配置
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      
      // 准备邮件内容
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to,
        subject,
        html: template ? this.renderTemplate(template, data) : body,
      };
      
      // 发送邮件
      const info = await transporter.sendMail(mailOptions);
      
      return {
        status: JOB_STATUS.RESOLVED,
        result: {
          messageId: info.messageId,
          to,
          subject,
        },
      };
    } catch (error) {
      return {
        status: JOB_STATUS.FAILED,
        result: error.message,
      };
    }
  }
  
  private renderTemplate(template, data) {
    // 简单的模板渲染
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }
}
```

## 条件控制节点

### 复杂条件节点

```typescript
// src/server/nodes/ComplexConditionNode.ts
import { Processor, Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export default class ComplexConditionNode extends Instruction {
  async run(node, input, processor: Processor) {
    try {
      const { conditions, operator } = node.config;
      const { data } = input;
      
      // 评估所有条件
      const results = await Promise.all(
        conditions.map(condition => this.evaluateCondition(condition, data, processor))
      );
      
      // 根据操作符组合结果
      let conditionResult = false;
      if (operator === 'and') {
        conditionResult = results.every(result => result);
      } else if (operator === 'or') {
        conditionResult = results.some(result => result);
      }
      
      return {
        status: JOB_STATUS.RESOLVED,
        result: conditionResult,
      };
    } catch (error) {
      return {
        status: JOB_STATUS.FAILED,
        result: error.message,
      };
    }
  }
  
  private async evaluateCondition(condition, data, processor: Processor) {
    const { field, operator, value, type } = condition;
    
    // 获取字段值
    let fieldValue = data[field];
    
    // 如果是表达式，计算表达式
    if (type === 'expression') {
      fieldValue = await processor.evaluate(value, data);
    } else {
      fieldValue = value;
    }
    
    // 执行比较
    switch (operator) {
      case 'equals':
        return data[field] === fieldValue;
      case 'notEquals':
        return data[field] !== fieldValue;
      case 'greaterThan':
        return data[field] > fieldValue;
      case 'lessThan':
        return data[field] < fieldValue;
      case 'contains':
        return String(data[field]).includes(String(fieldValue));
      case 'startsWith':
        return String(data[field]).startsWith(String(fieldValue));
      case 'endsWith':
        return String(data[field]).endsWith(String(fieldValue));
      default:
        return false;
    }
  }
}
```

## 循环处理节点

### 数组遍历节点

```typescript
// src/server/nodes/ArrayLoopNode.ts
import { Processor, Instruction, JOB_STATUS, JOB_STATUS_MAP } from '@nocobase/plugin-workflow';

export default class ArrayLoopNode extends Instruction {
  async run(node, input, processor: Processor) {
    try {
      const { arrayField, itemVariable } = node.config;
      const arrayData = input.data[arrayField];
      
      if (!Array.isArray(arrayData)) {
        return {
          status: JOB_STATUS.FAILED,
          result: '指定字段不是数组类型',
        };
      }
      
      // 为数组中的每个元素创建子任务
      const jobs = [];
      for (let i = 0; i < arrayData.length; i++) {
        const item = arrayData[i];
        const job = await processor.saveJob({
          status: JOB_STATUS.PENDING,
          nodeId: node.id,
          nodeKey: node.key,
          upstreamId: processor.currentJob?.id ?? null,
          input: {
            ...input,
            [itemVariable]: item,
            index: i,
          },
        });
        
        jobs.push(job);
      }
      
      // 启动第一个子任务
      if (jobs.length > 0) {
        await processor.run(jobs[0], node.downstream);
      }
      
      return {
        status: JOB_STATUS.RESOLVED,
        result: {
          count: arrayData.length,
          jobs: jobs.map(job => job.id),
        },
      };
    } catch (error) {
      return {
        status: JOB_STATUS.FAILED,
        result: error.message,
      };
    }
  }
  
  async resume(node, job, processor: Processor) {
    const { dataArray, currentIndex } = job.input;
    
    // 检查所有子任务是否完成
    const subJobs = await processor.getRepository().find({
      filter: {
        parentId: job.id,
      },
    });
    
    const allCompleted = subJobs.every(
      subJob => subJob.status === JOB_STATUS.RESOLVED || subJob.status === JOB_STATUS.FAILED
    );
    
    if (allCompleted) {
      // 收集所有子任务的结果
      const results = subJobs
        .filter(subJob => subJob.status === JOB_STATUS.RESOLVED)
        .map(subJob => subJob.result);
      
      return {
        status: JOB_STATUS.RESOLVED,
        result: results,
      };
    }
    
    // 继续处理下一个元素
    const nextIndex = currentIndex + 1;
    if (nextIndex < dataArray.length) {
      const nextJob = await processor.saveJob({
        status: JOB_STATUS.PENDING,
        nodeId: node.id,
        nodeKey: node.key,
        parentId: job.id,
        input: {
          ...job.input,
          currentItem: dataArray[nextIndex],
          currentIndex: nextIndex,
        },
      });
      
      await processor.run(nextJob, node.downstream);
    }
    
    return null;
  }
}
```

## 定时任务节点

### 延迟执行节点

```typescript
// src/server/nodes/DelayNode.ts
import { Processor, Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export default class DelayNode extends Instruction {
  async run(node, input, processor: Processor) {
    try {
      const { delay, unit } = node.config;
      
      // 计算延迟时间（毫秒）
      let delayMs = delay;
      switch (unit) {
        case 'seconds':
          delayMs *= 1000;
          break;
        case 'minutes':
          delayMs *= 60 * 1000;
          break;
        case 'hours':
          delayMs *= 60 * 60 * 1000;
          break;
        case 'days':
          delayMs *= 24 * 60 * 60 * 1000;
          break;
      }
      
      // 设置定时器
      setTimeout(async () => {
        // 延迟执行完成后，继续工作流
        await processor.exit();
      }, delayMs);
      
      return {
        status: JOB_STATUS.PENDING,
        result: `延迟 ${delay} ${unit}`,
      };
    } catch (error) {
      return {
        status: JOB_STATUS.FAILED,
        result: error.message,
      };
    }
  }
}
```

## 节点配置界面

### 动态配置组件

```typescript
// src/client/nodes/DynamicConfigComponent.tsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export const DynamicConfigComponent: React.FC = () => {
  const { t } = useTranslation();
  const [fieldTypes, setFieldTypes] = useState([]);
  
  useEffect(() => {
    // 获取可用字段类型
    setFieldTypes([
      { value: 'string', label: t('字符串') },
      { value: 'number', label: t('数字') },
      { value: 'boolean', label: t('布尔值') },
      { value: 'date', label: t('日期') },
    ]);
  }, []);
  
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Form.List name={['config', 'fields']}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Card
                key={key}
                size="small"
                title={`${t('字段')} ${name + 1}`}
                extra={
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    label={t('字段名')}
                    rules={[{ required: true }]}
                  >
                    <Input placeholder={t('请输入字段名')} />
                  </Form.Item>
                  
                  <Form.Item
                    {...restField}
                    name={[name, 'type']}
                    label={t('字段类型')}
                    rules={[{ required: true }]}
                  >
                    <Select options={fieldTypes} />
                  </Form.Item>
                  
                  <Form.Item
                    {...restField}
                    name={[name, 'required']}
                    label={t('必填')}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Space>
              </Card>
            ))}
            
            <Button
              type="dashed"
              onClick={() => add()}
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
            >
              {t('添加字段')}
            </Button>
          </>
        )}
      </Form.List>
    </Space>
  );
};
```

## 节点测试

### 编写节点测试

```typescript
// src/server/__tests__/nodes/CustomNode.test.ts
import CustomNode from '../../nodes/CustomNode';
import { MockProcessor } from '@nocobase/plugin-workflow/test-utils';

describe('CustomNode', () => {
  let node;
  let processor;
  
  beforeEach(() => {
    node = new CustomNode();
    processor = new MockProcessor();
  });
  
  it('should execute custom logic successfully', async () => {
    const input = { data: { test: 'value' } };
    const nodeConfig = {
      id: 1,
      type: 'custom-node',
      config: {
        message: 'Test message',
      },
    };
    
    const result = await node.run(nodeConfig, input, processor);
    
    expect(result.status).toBe(1); // RESOLVED
    expect(result.result.success).toBe(true);
  });
  
  it('should handle errors properly', async () => {
    const input = { data: { test: 'value' } };
    const nodeConfig = {
      id: 1,
      type: 'custom-node',
      config: {
        // 配置会导致错误的参数
      },
    };
    
    // 模拟错误情况
    jest.spyOn(node, 'executeCustomLogic').mockRejectedValue(new Error('Test error'));
    
    const result = await node.run(nodeConfig, input, processor);
    
    expect(result.status).toBe(-1); // FAILED
    expect(result.result).toBe('Test error');
  });
});
```

## 节点最佳实践

### 1. 错误处理

```typescript
// 始终正确处理错误
async run(node, input, processor: Processor) {
  try {
    // 节点逻辑
    const result = await this.executeLogic(input, node.config);
    
    return {
      status: JOB_STATUS.RESOLVED,
      result,
    };
  } catch (error) {
    // 记录错误日志
    processor.logger.error('节点执行错误:', error);
    
    return {
      status: JOB_STATUS.FAILED,
      result: {
        message: error.message,
        stack: error.stack,
      },
    };
  }
}
```

### 2. 状态管理

```typescript
// 正确管理节点状态
async run(node, input, processor: Processor) {
  // 设置初始状态
  await processor.updateJob({
    status: JOB_STATUS.PENDING,
    result: '开始处理...',
  });
  
  try {
    // 执行长时间运行的任务
    const result = await this.longRunningTask(input, node.config, processor);
    
    return {
      status: JOB_STATUS.RESOLVED,
      result,
    };
  } catch (error) {
    return {
      status: JOB_STATUS.FAILED,
      result: error.message,
    };
  }
}

private async longRunningTask(input, config, processor: Processor) {
  // 更新进度
  await processor.updateJob({
    result: '处理中... 50%',
  });
  
  // 执行任务
  const result = await someAsyncOperation();
  
  return result;
}
```

### 3. 资源清理

```typescript
// 确保资源得到正确清理
async run(node, input, processor: Processor) {
  let resource;
  
  try {
    // 获取资源
    resource = await this.acquireResource();
    
    // 使用资源
    const result = await this.processWithResource(input, resource);
    
    return {
      status: JOB_STATUS.RESOLVED,
      result,
    };
  } catch (error) {
    return {
      status: JOB_STATUS.FAILED,
      result: error.message,
    };
  } finally {
    // 清理资源
    if (resource) {
      await this.releaseResource(resource);
    }
  }
}
```

## 下一步

- 学习 [插件设置](./plugin-settings.md) 示例
