# 数据库使用示例

本文档将详细介绍如何在 NocoBase 插件中高效使用数据库功能。

## 数据库基础操作

### 查询操作

```typescript
class DatabaseUsagePlugin extends Plugin {
  async load() {
    // 基本查询
    this.app.resource({
      name: 'posts',
      actions: {
        async list(ctx, next) {
          const { page = 1, pageSize = 20 } = ctx.action.params;
          
          const posts = await ctx.db.getRepository('posts').find({
            limit: pageSize,
            offset: (page - 1) * pageSize,
            order: [['createdAt', 'DESC']],
          });
          
          ctx.body = posts;
          await next();
        },
      },
    });
  }
}
```

### 条件查询

```typescript
class ConditionalQueryPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async search(ctx, next) {
          const { filter, sort } = ctx.action.params;
          
          const posts = await ctx.db.getRepository('posts').find({
            filter,
            sort: sort ? [sort.split(':')] : [['createdAt', 'DESC']],
          });
          
          ctx.body = posts;
          await next();
        },
      },
    });
  }
}
```

### 关联查询

```typescript
class RelationQueryPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async getWithRelations(ctx, next) {
          const { filterByTk } = ctx.action.params;
          
          const post = await ctx.db.getRepository('posts').findOne({
            filterByTk,
            appends: ['author', 'tags', 'comments'],
          });
          
          ctx.body = post;
          await next();
        },
      },
    });
  }
}
```

## 数据库写入操作

### 创建数据

```typescript
class CreateDataPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async create(ctx, next) {
          const { values } = ctx.action.params;
          
          // 验证数据
          if (!values.title) {
            ctx.throw(400, '标题不能为空');
          }
          
          // 创建数据
          const post = await ctx.db.getRepository('posts').create({
            values: {
              ...values,
              authorId: ctx.state.currentUser.id,
              createdAt: new Date(),
            },
          });
          
          ctx.body = post;
          await next();
        },
      },
    });
  }
}
```

### 批量创建

```typescript
class BatchCreatePlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async batchCreate(ctx, next) {
          const { values } = ctx.action.params;
          
          // 批量创建
          const posts = await ctx.db.getRepository('posts').create({
            values,
          });
          
          ctx.body = Array.isArray(posts) ? posts : [posts];
          await next();
        },
      },
    });
  }
}
```

### 更新数据

```typescript
class UpdateDataPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async update(ctx, next) {
          const { filterByTk, values } = ctx.action.params;
          
          // 更新数据
          const post = await ctx.db.getRepository('posts').update({
            filterByTk,
            values: {
              ...values,
              updatedAt: new Date(),
            },
          });
          
          ctx.body = post;
          await next();
        },
      },
    });
  }
}
```

### 删除数据

```typescript
class DeleteDataPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async destroy(ctx, next) {
          const { filterByTk } = ctx.action.params;
          
          // 删除数据
          await ctx.db.getRepository('posts').destroy({
            filterByTk,
          });
          
          ctx.body = { result: 'success' };
          await next();
        },
        
        async batchDestroy(ctx, next) {
          const { filter } = ctx.action.params;
          
          // 批量删除
          const count = await ctx.db.getRepository('posts').destroy({
            filter,
          });
          
          ctx.body = { count };
          await next();
        },
      },
    });
  }
}
```

## 事务处理

### 基础事务

```typescript
class TransactionPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async createWithTransaction(ctx, next) {
          const { values } = ctx.action.params;
          
          // 开启事务
          const transaction = await ctx.db.sequelize.transaction();
          
          try {
            // 创建文章
            const post = await ctx.db.getRepository('posts').create({
              values,
              transaction,
            });
            
            // 创建标签关联
            if (values.tags) {
              await ctx.db.getRepository('postsTags').create({
                values: values.tags.map(tagId => ({
                  postId: post.id,
                  tagId,
                })),
                transaction,
              });
            }
            
            // 提交事务
            await transaction.commit();
            
            ctx.body = post;
          } catch (error) {
            // 回滚事务
            await transaction.rollback();
            ctx.throw(500, error.message);
          }
          
          await next();
        },
      },
    });
  }
}
```

### 复杂事务

```typescript
class ComplexTransactionPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'orders',
      actions: {
        async createOrder(ctx, next) {
          const { values } = ctx.action.params;
          
          const transaction = await ctx.db.sequelize.transaction();
          
          try {
            // 创建订单
            const order = await ctx.db.getRepository('orders').create({
              values: {
                ...values,
                status: 'pending',
              },
              transaction,
            });
            
            // 更新库存
            for (const item of values.items) {
              const product = await ctx.db.getRepository('products').findOne({
                filter: { id: item.productId },
                transaction,
              });
              
              if (product.stock < item.quantity) {
                throw new Error(`产品 ${product.name} 库存不足`);
              }
              
              await product.update({
                stock: product.stock - item.quantity,
              }, { transaction });
            }
            
            // 创建订单项
            await ctx.db.getRepository('orderItems').create({
              values: values.items.map(item => ({
                ...item,
                orderId: order.id,
              })),
              transaction,
            });
            
            // 提交事务
            await transaction.commit();
            
            ctx.body = order;
          } catch (error) {
            // 回滚事务
            await transaction.rollback();
            ctx.throw(500, error.message);
          }
          
          await next();
        },
      },
    });
  }
}
```

## 数据库聚合操作

### 统计查询

```typescript
class AggregateQueryPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'analytics',
      actions: {
        async getStats(ctx, next) {
          // 统计文章数量
          const postCount = await ctx.db.getRepository('posts').count();
          
          // 按状态统计文章
          const postStats = await ctx.db.getRepository('posts').aggregate({
            groupBy: 'status',
            aggregations: {
              count: {
                func: 'count',
                field: 'id',
              },
            },
          });
          
          // 统计用户发表文章数
          const userPostStats = await ctx.db.getRepository('users').aggregate({
            groupBy: 'id',
            aggregations: {
              postCount: {
                func: 'count',
                field: 'posts.id',
              },
            },
            include: ['posts'],
          });
          
          ctx.body = {
            postCount,
            postStats,
            userPostStats,
          };
          
          await next();
        },
      },
    });
  }
}
```

## 原生SQL查询

### 执行原生SQL

```typescript
class RawSQLPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'reports',
      actions: {
        async getReport(ctx, next) {
          const { startDate, endDate } = ctx.action.params;
          
          // 执行原生SQL查询
          const [results] = await ctx.db.sequelize.query(`
            SELECT 
              DATE(createdAt) as date,
              COUNT(*) as count
            FROM posts 
            WHERE createdAt BETWEEN :startDate AND :endDate
            GROUP BY DATE(createdAt)
            ORDER BY date
          `, {
            replacements: { startDate, endDate },
            type: ctx.db.sequelize.QueryTypes.SELECT,
          });
          
          ctx.body = results;
          await next();
        },
      },
    });
  }
}
```

### 复杂SQL查询

```typescript
class ComplexSQLPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'analytics',
      actions: {
        async getComplexReport(ctx, next) {
          // 复杂的SQL查询
          const [results] = await ctx.db.sequelize.query(`
            WITH user_stats AS (
              SELECT 
                u.id,
                u.name,
                COUNT(p.id) as post_count,
                AVG(p.view_count) as avg_views
              FROM users u
              LEFT JOIN posts p ON u.id = p.author_id
              GROUP BY u.id, u.name
            )
            SELECT 
              *,
              CASE 
                WHEN post_count > 10 THEN '活跃用户'
                WHEN post_count > 0 THEN '普通用户'
                ELSE '新用户'
              END as user_type
            FROM user_stats
            ORDER BY post_count DESC
          `, {
            type: ctx.db.sequelize.QueryTypes.SELECT,
          });
          
          ctx.body = results;
          await next();
        },
      },
    });
  }
}
```

## 数据库性能优化

### 索引优化

```typescript
// 在表定义中添加索引
export const postsCollection = {
  name: 'posts',
  title: '文章',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题',
      index: true,  // 普通索引
    },
    {
      type: 'string',
      name: 'status',
      title: '状态',
      index: true,
    },
    {
      type: 'date',
      name: 'createdAt',
      title: '创建时间',
      index: true,
    },
  ],
  // 复合索引
  indexes: [
    {
      fields: ['status', 'createdAt'],
      unique: false,
    },
  ],
};
```

### 查询优化

```typescript
class OptimizedQueryPlugin extends Plugin {
  async load() {
    this.app.resource({
      name: 'posts',
      actions: {
        async optimizedList(ctx, next) {
          const { page = 1, pageSize = 20, status } = ctx.action.params;
          
          // 优化查询，只选择需要的字段
          const posts = await ctx.db.getRepository('posts').find({
            attributes: ['id', 'title', 'status', 'createdAt'],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            order: [['createdAt', 'DESC']],
            filter: status ? { status } : undefined,
            // 避免N+1查询
            appends: ['author.id', 'author.name'],
          });
          
          ctx.body = posts;
          await next();
        },
      },
    });
  }
}
```

## 数据库迁移

### 创建迁移脚本

```typescript
// src/server/migrations/20230101000000-add-post-views.ts
export default {
  up: async (db) => {
    // 添加字段
    await db.sequelize.getRepository('posts').model.addColumn('posts', 'view_count', {
      type: db.sequelize.DataTypes.INTEGER,
      defaultValue: 0,
    });
    
    // 添加索引
    await db.sequelize.getRepository('posts').model.addIndex('posts', ['view_count']);
  },
  
  down: async (db) => {
    // 回滚操作
    await db.sequelize.getRepository('posts').model.removeColumn('posts', 'view_count');
  },
};
```

### 数据迁移

```typescript
// src/server/migrations/20230102000000-migrate-post-data.ts
export default {
  up: async (db, migration) => {
    // 迁移现有数据
    const posts = await db.getRepository('posts').find({
      limit: 1000,
    });
    
    for (const post of posts) {
      // 更新数据
      await post.update({
        view_count: post.get('views') || 0,
      });
    }
  },
  
  down: async (db) => {
    // 回滚数据
    const posts = await db.getRepository('posts').find({
      limit: 1000,
    });
    
    for (const post of posts) {
      await post.update({
        views: post.get('view_count') || 0,
      });
    }
  },
};
```

## 最佳实践

1. **连接池管理**：合理配置数据库连接池大小
2. **查询优化**：避免N+1查询问题，使用适当的索引
3. **事务使用**：在需要数据一致性的场景使用事务
4. **错误处理**：正确处理数据库异常和约束错误
5. **性能监控**：监控慢查询和数据库性能指标
6. **数据安全**：防止SQL注入，验证用户输入

## 下一步

- 学习 [自定义命令行](./custom-commands.md) 示例
- 掌握 [缓存](./caching.md) 示例
