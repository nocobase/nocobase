# 公式字段插件示例

## 概述

公式字段插件 (`@nocobase/plugin-field-formula`) 提供了公式字段类型，可以配置并存储同一条记录的多字段值之间的计算结果。支持 Math.js 和 Excel formula functions 两种计算引擎。

## 功能特性

- 支持 Math.js 和 Excel 两种计算引擎
- 实时计算字段值
- 支持多种数据类型的计算
- 与 NocoBase 数据表无缝集成
- 支持复杂的数学表达式和函数

## 安装和启用

```bash
yarn add @nocobase/plugin-field-formula
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import FormulaFieldPlugin from '@nocobase/plugin-field-formula';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(FormulaFieldPlugin);
  }
}
```

## 基本使用

### 1. 在数据表中使用公式字段

```ts
// src/server/product-collection.ts
import { CollectionOptions } from '@nocobase/database';

export const productCollection: CollectionOptions = {
  name: 'products',
  title: '产品',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '产品名称'
    },
    {
      type: 'float',
      name: 'price',
      title: '单价'
    },
    {
      type: 'integer',
      name: 'quantity',
      title: '数量'
    },
    {
      type: 'formula',
      name: 'total',
      title: '总价',
      // 配置公式字段
      engine: 'math.js', // 或 'excel'
      expression: '{{price}} * {{quantity}}' // 表达式
    }
  ]
};
```

### 2. 在表单中使用公式字段

```tsx
// src/client/components/ProductForm.tsx
import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { ISchema } from '@formily/react';

const productSchema: ISchema = {
  type: 'object',
  properties: {
    form: {
      type: 'void',
      'x-component': 'Form',
      properties: {
        name: {
          type: 'string',
          title: '产品名称',
          'x-decorator': 'FormItem',
          'x-component': 'Input'
        },
        price: {
          type: 'number',
          title: '单价',
          'x-decorator': 'FormItem',
          'x-component': 'NumberPicker'
        },
        quantity: {
          type: 'integer',
          title: '数量',
          'x-decorator': 'FormItem',
          'x-component': 'NumberPicker'
        },
        total: {
          type: 'number',
          title: '总价',
          'x-decorator': 'FormItem',
          'x-component': 'Formula.Result',
          'x-component-props': {
            expression: '{{price}} * {{quantity}}',
            engine: 'math.js'
          },
          'x-read-pretty': true
        },
        submit: {
          type: 'void',
          'x-component': 'Submit'
        }
      }
    }
  }
};

export default function ProductForm() {
  return <SchemaComponent schema={productSchema} />;
}
```

## 高级用法

### 1. 使用复杂表达式

```ts
// src/server/complex-formula.ts
export const orderCollection: CollectionOptions = {
  name: 'orders',
  title: '订单',
  fields: [
    {
      type: 'float',
      name: 'subtotal',
      title: '小计'
    },
    {
      type: 'float',
      name: 'taxRate',
      title: '税率'
    },
    {
      type: 'formula',
      name: 'tax',
      title: '税额',
      engine: 'math.js',
      expression: '{{subtotal}} * {{taxRate}} / 100'
    },
    {
      type: 'formula',
      name: 'total',
      title: '总计',
      engine: 'math.js',
      expression: '{{subtotal}} + {{tax}}'
    }
  ]
};
```

### 2. 使用 Excel 函数

```ts
// src/server/excel-formula.ts
export const excelCollection: CollectionOptions = {
  name: 'excelExamples',
  title: 'Excel 函数示例',
  fields: [
    {
      type: 'float',
      name: 'score1',
      title: '成绩1'
    },
    {
      type: 'float',
      name: 'score2',
      title: '成绩2'
    },
    {
      type: 'float',
      name: 'score3',
      title: '成绩3'
    },
    {
      type: 'formula',
      name: 'average',
      title: '平均分',
      engine: 'excel',
      expression: 'AVERAGE({{score1}}, {{score2}}, {{score3}})'
    },
    {
      type: 'formula',
      name: 'maxScore',
      title: '最高分',
      engine: 'excel',
      expression: 'MAX({{score1}}, {{score2}}, {{score3}})'
    }
  ]
};
```

## 最佳实践

1. **表达式设计**：
   - 使用清晰的字段引用 `{{fieldName}}`
   - 避免过于复杂的表达式，影响性能
   - 合理选择计算引擎（Math.js 更适合数学计算，Excel 更适合业务函数）

2. **错误处理**：
   - 处理除零等数学错误
   - 验证字段引用的有效性
   - 提供友好的错误提示

3. **性能优化**：
   - 避免循环引用
   - 对复杂计算进行缓存
   - 合理设置计算时机

## 扩展示例

### 1. 财务计算

```ts
// src/server/finance-collection.ts
export const financeCollection: CollectionOptions = {
  name: 'financialRecords',
  title: '财务记录',
  fields: [
    {
      type: 'float',
      name: 'principal',
      title: '本金'
    },
    {
      type: 'float',
      name: 'interestRate',
      title: '利率 (%)'
    },
    {
      type: 'integer',
      name: 'months',
      title: '月数'
    },
    {
      type: 'formula',
      name: 'interest',
      title: '利息',
      engine: 'math.js',
      expression: '{{principal}} * {{interestRate}} / 100 * {{months}} / 12'
    },
    {
      type: 'formula',
      name: 'totalAmount',
      title: '本息合计',
      engine: 'math.js',
      expression: '{{principal}} + {{interest}}'
    }
  ]
};
```

### 2. 库存管理

```ts
// src/server/inventory-collection.ts
export const inventoryCollection: CollectionOptions = {
  name: 'inventory',
  title: '库存',
  fields: [
    {
      type: 'string',
      name: 'productName',
      title: '产品名称'
    },
    {
      type: 'integer',
      name: 'openingStock',
      title: '期初库存'
    },
    {
      type: 'integer',
      name: 'purchases',
      title: '采购数量'
    },
    {
      type: 'integer',
      name: 'sales',
      title: '销售数量'
    },
    {
      type: 'formula',
      name: 'closingStock',
      title: '期末库存',
      engine: 'math.js',
      expression: '{{openingStock}} + {{purchases}} - {{sales}}'
    },
    {
      type: 'formula',
      name: 'stockValue',
      title: '库存价值',
      engine: 'math.js',
      expression: '{{closingStock}} * {{unitCost}}'
    }
  ]
};
```

### 3. 项目进度计算

```tsx
// src/client/components/ProjectProgress.tsx
import React from 'react';
import { SchemaComponent } from '@nocobase/client';

const projectSchema: ISchema = {
  type: 'object',
  properties: {
    form: {
      type: 'void',
      'x-component': 'Form',
      properties: {
        totalTasks: {
          type: 'integer',
          title: '总任务数',
          'x-decorator': 'FormItem',
          'x-component': 'NumberPicker'
        },
        completedTasks: {
          type: 'integer',
          title: '已完成任务数',
          'x-decorator': 'FormItem',
          'x-component': 'NumberPicker'
        },
        progress: {
          type: 'number',
          title: '完成进度 (%)',
          'x-decorator': 'FormItem',
          'x-component': 'Formula.Result',
          'x-component-props': {
            expression: '({{completedTasks}} / {{totalTasks}}) * 100',
            engine: 'math.js'
          },
          'x-read-pretty': true
        },
        progressBar: {
          type: 'void',
          'x-component': 'ProgressBar',
          'x-component-props': {
            percent: '{{$form.values.progress}}'
          }
        }
      }
    }
  }
};

export default function ProjectProgress() {
  return <SchemaComponent schema={projectSchema} />;
}
```

## 常见问题

### 1. 循环引用检测

```ts
// src/server/circular-reference-check.ts
export function checkCircularReference(collection) {
  // 实现循环引用检测逻辑
  // 防止公式字段之间形成循环依赖
}
```

### 2. 错误处理

```tsx
// src/client/components/FormulaWithErrorHandling.tsx
import React from 'react';
import { FormulaResult } from '@nocobase/plugin-field-formula/client';

export default function FormulaWithErrorHandling() {
  return (
    <FormulaResult
      expression="{{price}} * {{quantity}}"
      engine="math.js"
      onError={(error) => {
        console.error('Formula calculation error:', error);
        // 显示友好的错误提示
      }}
    />
  );
}
```

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/field-formula)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/field-formula)
- [Math.js 文档](https://mathjs.org/)
- [Excel 函数参考](https://support.microsoft.com/zh-cn/office/excel-%E5%87%BD%E6%95%B0%EF%BC%88%E6%8C%89%E5%AD%97%E6%AF%8D%E9%A1%BA%E5%BA%8F%EF%BC%89-b3944572-255d-4efb-bb96-c6d90033e188)
