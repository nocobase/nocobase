# 中国行政区划字段插件示例

## 概述

中国行政区划字段插件 (`@nocobase/plugin-field-china-region`) 提供了中国行政区划数据和字段类型，可以用于需要处理中国地区信息的业务场景。

## 功能特性

- 提供完整的中国行政区划数据（省、市、区/县）
- 支持三级联动选择
- 支持数据存储和查询
- 与 NocoBase 数据表无缝集成
- 支持自定义行政区划数据

## 安装和启用

```bash
yarn add @nocobase/plugin-field-china-region
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import ChinaRegionPlugin from '@nocobase/plugin-field-china-region';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(ChinaRegionPlugin);
  }
}
```

## 基本使用

### 1. 在数据表中使用中国行政区划字段

```ts
// src/server/address-collection.ts
import { CollectionOptions } from '@nocobase/database';

export const addressCollection: CollectionOptions = {
  name: 'addresses',
  title: '地址',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '收货人'
    },
    {
      type: 'chinaRegion',
      name: 'region',
      title: '地区',
      // 配置字段选项
      interface: 'chinaRegion'
    },
    {
      type: 'string',
      name: 'detail',
      title: '详细地址'
    }
  ]
};
```

### 2. 在表单中使用中国行政区划字段

```tsx
// src/client/components/AddressForm.tsx
import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { ISchema } from '@formily/react';

const addressSchema: ISchema = {
  type: 'object',
  properties: {
    form: {
      type: 'void',
      'x-component': 'Form',
      properties: {
        name: {
          type: 'string',
          title: '收货人',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true
        },
        region: {
          type: 'array',
          title: '地区',
          'x-decorator': 'FormItem',
          'x-component': 'ChinaRegion',
          'x-component-props': {
            // 配置组件属性
          },
          required: true
        },
        detail: {
          type: 'string',
          title: '详细地址',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
          required: true
        },
        submit: {
          type: 'void',
          'x-component': 'Submit'
        }
      }
    }
  }
};

export default function AddressForm() {
  return <SchemaComponent schema={addressSchema} />;
}
```

## 高级用法

### 1. 自定义行政区划数据

```ts
// src/server/custom-region.ts
import { ChinaRegionPlugin } from '@nocobase/plugin-field-china-region';

class CustomChinaRegionPlugin extends ChinaRegionPlugin {
  async load() {
    await super.load();
    
    // 注入自定义行政区划数据
    this.db.import({
      // 自定义数据
    });
  }
}
```

### 2. 获取行政区划信息

```ts
// src/server/region-service.ts
import { Repository } from '@nocobase/database';

export class RegionService {
  constructor(private db) {}
  
  async getRegionInfo(code: string) {
    const repository = this.db.getRepository('chinaRegions');
    return await repository.findOne({
      filter: {
        code
      }
    });
  }
  
  async getChildren(parentCode: string) {
    const repository = this.db.getRepository('chinaRegions');
    return await repository.find({
      filter: {
        parent: parentCode
      }
    });
  }
}
```

## 最佳实践

1. **数据完整性**：
   - 确保行政区划数据的完整性和准确性
   - 定期更新行政区划数据以反映最新的行政区划调整

2. **用户体验**：
   - 提供清晰的三级联动选择界面
   - 支持搜索功能快速定位地区
   - 实现默认值设置（如根据用户IP定位）

3. **性能优化**：
   - 对行政区划数据进行缓存
   - 使用懒加载机制加载子级数据
   - 实现数据预加载

## 扩展示例

### 1. 带搜索功能的地区选择器

```tsx
// src/client/components/SearchableRegion.tsx
import React, { useState } from 'react';
import { Cascader, Input } from 'antd';
import { useChinaRegion } from '@nocobase/plugin-field-china-region/client';

export default function SearchableRegion() {
  const [searchValue, setSearchValue] = useState('');
  const { data, loading } = useChinaRegion();
  
  const filteredData = data?.filter(item => 
    item.name.includes(searchValue)
  ) || [];
  
  return (
    <div>
      <Input
        placeholder="搜索地区"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        style={{ marginBottom: '8px' }}
      />
      <Cascader
        options={filteredData}
        placeholder="请选择地区"
        showSearch
        loading={loading}
      />
    </div>
  );
}
```

### 2. 地址簿管理

```ts
// src/server/address-book.ts
export const addressBookCollection: CollectionOptions = {
  name: 'addressBook',
  title: '地址簿',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '收货人'
    },
    {
      type: 'chinaRegion',
      name: 'region',
      title: '地区'
    },
    {
      type: 'string',
      name: 'detail',
      title: '详细地址'
    },
    {
      type: 'string',
      name: 'phone',
      title: '联系电话'
    },
    {
      type: 'boolean',
      name: 'isDefault',
      title: '默认地址'
    }
  ]
};
```

```tsx
// src/client/components/AddressBook.tsx
import React from 'react';
import { SchemaComponent } from '@nocobase/client';

const addressBookSchema: ISchema = {
  type: 'object',
  properties: {
    list: {
      type: 'void',
      'x-component': 'CollectionField',
      'x-component-props': {
        collection: 'addressBook',
        field: 'list'
      }
    },
    create: {
      type: 'void',
      'x-component': 'Action',
      'x-content': '新增地址',
      properties: {
        drawer: {
          type: 'void',
          'x-component': 'Action.Drawer',
          title: '新增地址',
          properties: {
            form: {
              type: 'void',
              'x-component': 'Form',
              properties: {
                name: {
                  type: 'string',
                  title: '收货人',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  required: true
                },
                region: {
                  type: 'array',
                  title: '地区',
                  'x-decorator': 'FormItem',
                  'x-component': 'ChinaRegion',
                  required: true
                },
                detail: {
                  type: 'string',
                  title: '详细地址',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.TextArea',
                  required: true
                },
                phone: {
                  type: 'string',
                  title: '联系电话',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  required: true
                },
                isDefault: {
                  type: 'boolean',
                  title: '设为默认地址',
                  'x-decorator': 'FormItem',
                  'x-component': 'Checkbox'
                },
                submit: {
                  type: 'void',
                  'x-component': 'Submit'
                }
              }
            }
          }
        }
      }
    }
  }
};

export default function AddressBook() {
  return <SchemaComponent schema={addressBookSchema} />;
}
```

## 常见问题

### 1. 数据更新

```ts
// src/server/update-region-data.ts
import { ChinaRegionPlugin } from '@nocobase/plugin-field-china-region';

export async function updateRegionData(app) {
  const plugin = app.getPlugin(ChinaRegionPlugin);
  if (plugin) {
    // 更新行政区划数据
    await plugin.updateData();
  }
}
```

### 2. 自定义字段显示

```tsx
// src/client/components/CustomRegionDisplay.tsx
import React from 'react';
import { useChinaRegion } from '@nocobase/plugin-field-china-region/client';

export function CustomRegionDisplay({ value }) {
  const { data } = useChinaRegion();
  
  if (!value || !data) return null;
  
  // 根据编码获取完整地区名称
  const getFullRegionName = (codes) => {
    return codes.map(code => {
      const region = data.find(item => item.code === code);
      return region ? region.name : '';
    }).join(' ');
  };
  
  return <span>{getFullRegionName(value)}</span>;
}
```

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/china-region)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/field-china-region)
