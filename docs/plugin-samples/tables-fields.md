# 表和字段示例

本文档将详细介绍如何在 NocoBase 插件中定义数据表结构和字段类型。

## 基础表定义

### 简单表结构

```typescript
import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'posts',
  title: '文章',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题',
      required: true,
    },
    {
      type: 'text',
      name: 'content',
      title: '内容',
    },
    {
      type: 'string',
      name: 'status',
      title: '状态',
      defaultValue: 'draft',
    },
  ],
} as CollectionOptions;
```

### 注册表结构

在插件中注册表结构：

```typescript
class PostsPlugin extends Plugin {
  async load() {
    this.app.db.collection({
      name: 'posts',
      title: '文章',
      fields: [
        {
          type: 'string',
          name: 'title',
          title: '标题',
          required: true,
        },
        {
          type: 'text',
          name: 'content',
          title: '内容',
        },
      ],
    });
  }
}
```

## 字段类型示例

### 基础字段类型

```typescript
const fields = [
  // 字符串字段
  {
    type: 'string',
    name: 'name',
    title: '名称',
  },
  
  // 文本字段
  {
    type: 'text',
    name: 'description',
    title: '描述',
  },
  
  // 整数字段
  {
    type: 'integer',
    name: 'age',
    title: '年龄',
  },
  
  // 浮点数字段
  {
    type: 'float',
    name: 'price',
    title: '价格',
  },
  
  // 布尔字段
  {
    type: 'boolean',
    name: 'published',
    title: '已发布',
  },
  
  // 日期时间字段
  {
    type: 'date',
    name: 'createdAt',
    title: '创建时间',
  },
  
  // JSON 字段
  {
    type: 'json',
    name: 'metadata',
    title: '元数据',
  },
];
```

### 关系字段类型

```typescript
const relationFields = [
  // 一对一关系
  {
    type: 'hasOne',
    name: 'profile',
    target: 'profiles',
  },
  
  // 一对多关系
  {
    type: 'hasMany',
    name: 'comments',
    target: 'comments',
  },
  
  // 多对一关系
  {
    type: 'belongsTo',
    name: 'author',
    target: 'users',
  },
  
  // 多对多关系
  {
    type: 'belongsToMany',
    name: 'tags',
    target: 'tags',
  },
  
  // 多对多关系（带中间表）
  {
    type: 'belongsToMany',
    name: 'categories',
    target: 'categories',
    through: 'postsCategories',
  },
];
```

### 特殊字段类型

```typescript
const specialFields = [
  // 邮箱字段
  {
    type: 'email',
    name: 'email',
    title: '邮箱',
  },
  
  // URL 字段
  {
    type: 'url',
    name: 'website',
    title: '网站',
  },
  
  // 密码字段
  {
    type: 'password',
    name: 'password',
    title: '密码',
  },
  
  // 附件字段
  {
    type: 'attachment',
    name: 'avatar',
    title: '头像',
  },
  
  // 序号字段
  {
    type: 'sequence',
    name: 'sn',
    title: '序号',
  },
];
```

## 字段配置选项

### 基础配置

```typescript
{
  type: 'string',
  name: 'title',
  title: '标题',
  required: true,          // 必填字段
  unique: true,            // 唯一约束
  defaultValue: '默认标题', // 默认值
  description: '文章标题',  // 字段描述
  hidden: false,           // 是否隐藏
}
```

### 验证配置

```typescript
{
  type: 'string',
  name: 'email',
  title: '邮箱',
  required: true,
  validate: {
    email: true,           // 邮箱格式验证
    min: 5,                // 最小长度
    max: 100,              // 最大长度
    pattern: '^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$', // 正则表达式
  },
}
```

### 索引配置

```typescript
{
  type: 'string',
  name: 'sku',
  title: 'SKU',
  index: true,             // 普通索引
  unique: true,            // 唯一索引
}
```

## 完整示例

### 博客系统表结构

```typescript
// posts 表
export const postsCollection = {
  name: 'posts',
  title: '文章',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题',
      required: true,
      index: true,
    },
    {
      type: 'text',
      name: 'content',
      title: '内容',
    },
    {
      type: 'string',
      name: 'status',
      title: '状态',
      defaultValue: 'draft',
    },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
    },
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
    },
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
    },
  ],
};

// tags 表
export const tagsCollection = {
  name: 'tags',
  title: '标签',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '名称',
      required: true,
      unique: true,
    },
    {
      type: 'belongsToMany',
      name: 'posts',
      target: 'posts',
    },
  ],
};

// comments 表
export const commentsCollection = {
  name: 'comments',
  title: '评论',
  fields: [
    {
      type: 'text',
      name: 'content',
      title: '内容',
      required: true,
    },
    {
      type: 'belongsTo',
      name: 'post',
      target: 'posts',
    },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
    },
  ],
};
```

### 注册表结构

```typescript
class BlogPlugin extends Plugin {
  async load() {
    // 注册表结构
    this.app.db.collection(postsCollection);
    this.app.db.collection(tagsCollection);
    this.app.db.collection(commentsCollection);
    
    // 注册模型（可选）
    this.app.db.registerModels({
      PostModel,
      TagModel,
      CommentModel,
    });
  }
}
```

## 高级用法

### 动态字段

```typescript
class DynamicFieldsPlugin extends Plugin {
  async load() {
    this.app.db.collection({
      name: 'dynamicForms',
      title: '动态表单',
      fields: [
        {
          type: 'string',
          name: 'formName',
          title: '表单名称',
        },
        {
          type: 'json',
          name: 'fields',
          title: '字段定义',
        },
      ],
    });
    
    // 根据字段定义动态创建表
    this.app.db.on('dynamicForms.afterCreate', async (instance) => {
      const fields = instance.get('fields');
      this.app.db.collection({
        name: `form_${instance.id}`,
        title: instance.get('formName'),
        fields: fields.map(field => ({
          type: field.type,
          name: field.name,
          title: field.title,
        })),
      });
    });
  }
}
```

### 字段继承

```typescript
// 基础字段
const baseFields = [
  {
    type: 'string',
    name: 'createdAt',
    title: '创建时间',
  },
  {
    type: 'string',
    name: 'updatedAt',
    title: '更新时间',
  },
];

// 扩展字段
const extendedFields = [
  ...baseFields,
  {
    type: 'string',
    name: 'title',
    title: '标题',
  },
];
```

## 最佳实践

1. **命名规范**：使用清晰的字段名称和标题
2. **索引优化**：为经常查询的字段添加索引
3. **关系设计**：合理设计表间关系
4. **默认值**：为字段设置合理的默认值
5. **验证规则**：添加适当的验证规则
6. **文档说明**：为复杂字段添加描述信息

## 下一步

- 学习 [资源和操作](./resources-actions.md) 示例
- 掌握 [数据库使用](./database-usage.md) 示例
