# 自定义字段示例

本文档将详细介绍如何在 NocoBase 插件中创建自定义字段类型。

## 自定义字段基础

### 字段类型概念

NocoBase 提供了丰富的内置字段类型，但在某些场景下，您可能需要创建自定义字段类型来满足特定的业务需求。

### 创建自定义字段类型

```typescript
// src/server/fields/CustomField.ts
import { BaseField, FieldContext, FieldOptions } from '@nocobase/database';

interface CustomFieldOptions extends FieldOptions {
  // 自定义字段选项
  customOption?: string;
}

export class CustomField extends BaseField<CustomFieldOptions> {
  get dataType() {
    // 定义字段的数据类型
    return 'JSON';
  }
  
  async beforeSave(value: any, options: FieldContext) {
    // 保存前处理
    return super.beforeSave(this.processValue(value), options);
  }
  
  async afterRead(value: any, options: FieldContext) {
    // 读取后处理
    return this.processValue(value);
  }
  
  private processValue(value: any) {
    // 处理字段值
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
}
```

### 注册自定义字段

```typescript
// src/server/index.ts
import { Plugin } from '@nocobase/server';
import { CustomField } from './fields/CustomField';

export class CustomFieldsPlugin extends Plugin {
  async load() {
    // 注册自定义字段类型
    this.app.db.registerFieldTypes({
      custom: CustomField,
    });
  }
}
```

## 地图字段示例

### 字段定义

```typescript
// src/server/fields/MapField.ts
import { BaseField, FieldContext, FieldOptions } from '@nocobase/database';

interface MapFieldOptions extends FieldOptions {
  mapType?: 'gaode' | 'google';
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export class MapField extends BaseField<MapFieldOptions> {
  get dataType() {
    return 'JSON';
  }
  
  async beforeSave(value: any, options: FieldContext) {
    // 验证地图数据格式
    if (value && typeof value === 'object') {
      if (!Array.isArray(value.center) || value.center.length !== 2) {
        throw new Error('地图中心点格式不正确');
      }
      
      if (typeof value.zoom !== 'number') {
        throw new Error('缩放级别必须是数字');
      }
    }
    
    return super.beforeSave(value, options);
  }
}
```

### 在集合中使用地图字段

```typescript
// 在集合定义中使用自定义字段
const locationsCollection = {
  name: 'locations',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '位置名称',
    },
    {
      type: 'custom', // 使用自定义字段类型
      name: 'location',
      title: '地理位置',
      dataType: 'map',
      mapType: 'gaode',
      defaultCenter: [116.397428, 39.90923],
      defaultZoom: 12,
    },
  ],
};
```

## 富文本字段示例

### 字段实现

```typescript
// src/server/fields/RichTextField.ts
import { BaseField, FieldContext, FieldOptions } from '@nocobase/database';

interface RichTextFieldOptions extends FieldOptions {
  maxLength?: number;
  minLength?: number;
  allowHtml?: boolean;
}

export class RichTextField extends BaseField<RichTextFieldOptions> {
  get dataType() {
    return 'TEXT';
  }
  
  async beforeSave(value: any, options: FieldContext) {
    // 验证和清理HTML内容
    if (value && typeof value === 'string') {
      // 长度验证
      if (this.options.maxLength && value.length > this.options.maxLength) {
        throw new Error(`内容长度不能超过 ${this.options.maxLength} 个字符`);
      }
      
      if (this.options.minLength && value.length < this.options.minLength) {
        throw new Error(`内容长度不能少于 ${this.options.minLength} 个字符`);
      }
      
      // 清理HTML（如果需要）
      if (!this.options.allowHtml) {
        value = this.stripHtml(value);
      }
    }
    
    return super.beforeSave(value, options);
  }
  
  private stripHtml(html: string): string {
    // 简单的HTML清理
    return html.replace(/<[^>]*>/g, '');
  }
}
```

## 客户端自定义字段组件

### 创建字段组件

```typescript
// src/client/components/CustomFieldComponent.tsx
import React, { useState, useEffect } from 'react';
import { Input, Form, Space, Button } from 'antd';
import { useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';

export const CustomFieldComponent: React.FC = (props) => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const [value, setValue] = useState(props.value || {});
  
  const handleChange = (field, fieldValue) => {
    const newValue = { ...value, [field]: fieldValue };
    setValue(newValue);
    props.onChange?.(newValue);
  };
  
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input
        placeholder={t('请输入自定义值')}
        value={value.customValue}
        onChange={(e) => handleChange('customValue', e.target.value)}
      />
      {fieldSchema?.description && (
        <div style={{ fontSize: '12px', color: '#888' }}>
          {fieldSchema.description}
        </div>
      )}
    </Space>
  );
};
```

### 注册客户端组件

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import { CustomFieldComponent } from './components/CustomFieldComponent';

class CustomFieldsClientPlugin extends Plugin {
  async load() {
    // 注册自定义字段组件
    this.app.addComponents({
      CustomFieldComponent,
    });
    
    // 注册字段类型到表单设计器
    this.app.schemaInitializerManager.addItem(
      'form:configureFields',
      'custom.customField',
      {
        title: '自定义字段',
        Component: () => {
          // 字段初始化逻辑
        },
      }
    );
  }
}
```

## 复杂自定义字段示例

### JSON Schema 字段

```typescript
// src/server/fields/JsonSchemaField.ts
import { BaseField, FieldContext, FieldOptions } from '@nocobase/database';
import Ajv from 'ajv';

interface JsonSchemaFieldOptions extends FieldOptions {
  schema: any; // JSON Schema 验证规则
}

export class JsonSchemaField extends BaseField<JsonSchemaFieldOptions> {
  private ajv: Ajv;
  
  constructor(options: JsonSchemaFieldOptions) {
    super(options);
    this.ajv = new Ajv();
  }
  
  get dataType() {
    return 'JSON';
  }
  
  async beforeSave(value: any, options: FieldContext) {
    // 使用 JSON Schema 验证数据
    if (value && this.options.schema) {
      const validate = this.ajv.compile(this.options.schema);
      const valid = validate(value);
      
      if (!valid) {
        throw new Error(`数据格式验证失败: ${validate.errors?.map(e => e.message).join(', ')}`);
      }
    }
    
    return super.beforeSave(value, options);
  }
}
```

### 使用 JSON Schema 字段

```typescript
// 在集合中使用 JSON Schema 字段
const usersCollection = {
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '姓名',
    },
    {
      type: 'jsonSchema',
      name: 'profile',
      title: '用户资料',
      schema: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 0, maximum: 150 },
          gender: { type: 'string', enum: ['male', 'female', 'other'] },
          interests: { type: 'array', items: { type: 'string' } }
        },
        required: ['age', 'gender']
      }
    }
  ]
};
```

## 字段验证和错误处理

### 自定义验证规则

```typescript
// src/server/fields/ValidatedField.ts
import { BaseField, FieldContext, FieldOptions } from '@nocobase/database';

interface ValidatedFieldOptions extends FieldOptions {
  validators?: Array<(value: any) => string | null>;
}

export class ValidatedField extends BaseField<ValidatedFieldOptions> {
  get dataType() {
    return 'STRING';
  }
  
  async beforeSave(value: any, options: FieldContext) {
    // 执行自定义验证器
    if (this.options.validators && value !== undefined && value !== null) {
      for (const validator of this.options.validators) {
        const error = validator(value);
        if (error) {
          throw new Error(error);
        }
      }
    }
    
    return super.beforeSave(value, options);
  }
}

// 使用示例
const emailValidator = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return '请输入有效的邮箱地址';
  }
  return null;
};

const phoneValidator = (value: string) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(value)) {
    return '请输入有效的手机号码';
  }
  return null;
};
```

## 字段索引和性能优化

### 创建带索引的自定义字段

```typescript
// 在集合定义中为自定义字段添加索引
const productsCollection = {
  name: 'products',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '产品名称',
    },
    {
      type: 'custom',
      name: 'sku',
      title: 'SKU',
      // 为字段添加索引
      index: true,
      unique: true,
    }
  ],
  // 或者在集合级别定义复合索引
  indexes: [
    {
      fields: ['sku', 'name'],
      unique: false,
    }
  ]
};
```

## 字段迁移

### 数据迁移脚本

```typescript
// src/server/migrations/20230101000000-migrate-custom-fields.ts
export default {
  up: async (db) => {
    // 迁移现有数据以适应新的自定义字段格式
    const records = await db.getRepository('oldTable').find();
    
    for (const record of records) {
      // 转换数据格式
      const newValue = transformOldData(record.oldField);
      
      await db.getRepository('newTable').update({
        filter: { id: record.id },
        values: {
          newField: newValue,
        },
      });
    }
  },
  
  down: async (db) => {
    // 回滚迁移
    const records = await db.getRepository('newTable').find();
    
    for (const record of records) {
      const oldValue = transformNewData(record.newField);
      
      await db.getRepository('oldTable').update({
        filter: { id: record.id },
        values: {
          oldField: oldValue,
        },
      });
    }
  },
};

function transformOldData(oldValue) {
  // 实现数据转换逻辑
  return { customValue: oldValue };
}

function transformNewData(newValue) {
  // 实现数据回滚逻辑
  return newValue?.customValue || '';
}
```

## 最佳实践

### 1. 字段设计原则

```typescript
// 遵循一致的字段设计原则
class WellDesignedField extends BaseField {
  // 1. 明确的数据类型
  get dataType() {
    return 'JSON';
  }
  
  // 2. 清晰的验证逻辑
  async beforeSave(value, options) {
    this.validate(value);
    return super.beforeSave(value, options);
  }
  
  // 3. 适当的默认值处理
  get defaultValue() {
    return this.options.defaultValue ?? { default: true };
  }
  
  // 4. 良好的错误处理
  private validate(value) {
    if (value === null || value === undefined) {
      return;
    }
    
    if (typeof value !== 'object') {
      throw new Error('字段值必须是对象类型');
    }
  }
}
```

### 2. 性能优化

```typescript
// 优化字段性能
class OptimizedField extends BaseField {
  // 缓存验证规则
  private validatorCache = new Map();
  
  async beforeSave(value, options) {
    // 使用缓存避免重复编译
    const validator = this.getValidator();
    if (!validator(value)) {
      throw new Error('数据验证失败');
    }
    
    return super.beforeSave(value, options);
  }
  
  private getValidator() {
    const schemaKey = JSON.stringify(this.options.schema);
    if (!this.validatorCache.has(schemaKey)) {
      const validator = this.compileValidator(this.options.schema);
      this.validatorCache.set(schemaKey, validator);
    }
    return this.validatorCache.get(schemaKey);
  }
}
```

### 3. 测试覆盖

```typescript
// src/server/__tests__/fields/CustomField.test.ts
import { CustomField } from '../../fields/CustomField';
import { createMockDatabase } from '@nocobase/test';

describe('CustomField', () => {
  let field;
  let db;
  
  beforeEach(() => {
    db = createMockDatabase();
    field = new CustomField({
      name: 'test',
      type: 'custom',
    });
  });
  
  it('should validate correct data', async () => {
    const validData = { customValue: 'test' };
    const result = await field.beforeSave(validData, { db });
    expect(result).toEqual(validData);
  });
  
  it('should throw error for invalid data', async () => {
    const invalidData = { invalid: true };
    await expect(field.beforeSave(invalidData, { db }))
      .rejects.toThrow('数据格式不正确');
  });
});
```

## 下一步

- 学习 [文件管理](./file-management.md) 示例（如果创建了该文档）
- 掌握 [认证](./authentication.md) 示例（如果创建了该文档）
