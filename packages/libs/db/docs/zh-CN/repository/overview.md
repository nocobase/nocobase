---
title: Repository：基于 Collection 的数据访问
description: 使用 Repository 查询和修改 Collection 记录，按任务选择 Filter、Select、Sort、Values、关系和聚合接口，了解返回结果及使用边界。
---

# Repository：基于 Collection 的数据访问

Repository 基于解析后的 Collection 定义访问记录，识别逻辑字段、关系和命名映射。这是当前公开 API 的使用文档，不需要先阅读设计提案。

服务端 [`writePolicy`](./write-policy.md) 可限制普通字段、每种关系操作、嵌套 create/update/upsert 字段和 through payload。内部 Repository 默认 `true`；API routes 默认 `false`，须显式配置白名单。前端不接受该参数。

要限制**能碰哪些行**而不只是写入形状，见 [Policy 快速开始](./policy-quick-start.md)：`withPolicy` / `withPolicies` 把行范围与读写白名单绑在实例上，读写两侧一起生效。

## 选择正确入口

| 任务                                     | 使用                                                        |
| ---------------------------------------- | ----------------------------------------------------------- |
| Collection 记录 CRUD、关系读取、嵌套写入 | Repository                                                  |
| 数据库层 join、子查询和查询组合          | [Query](../query/overview.md)                               |
| 创建或修改表、字段、索引、约束           | Migration 中的 [Collection Builder](../builder/overview.md) |
| 检查已有物理数据库结构                   | [Schema Inspector](../schema-inspector/overview.md)         |

Repository 不创建 Schema，也不替代业务权限、租户隔离或输入授权。调用方必须明确允许访问的 Collection、字段和记录范围。

Collection 不要求存在 `id`，也不要求存在主键。字段名称不决定类型：`id` 可以是 string、uuid、integer 等声明类型，甚至不是唯一字段。基础查询和不带 select 的批量标量操作不要求主键；需要定位或重读记录的单条写入要求可用的完整非空主键或无条件唯一选择器。没有可用标识时不会猜测 id，见[写入限制](./values.md)。

## 获取 Repository

以下示例假设 `db` 是已配置的 `DatabaseManager`，Collection 已存在且能由 `connection.collections` 解析。

```ts
const projects = db.repository('projects');
const mainProjects = db.connection('main').repository('projects');

await db.transaction(async (connection) => {
  const transactionProjects = connection.repository('projects');
  await transactionProjects.count();
});
```

`repository()` 接受 Collection 逻辑名称，不是带前缀的物理表名。Manager 与 Connection 上的 repository 都是方法，不需要 `await`。命名连接必须已配置；事务内始终从回调 Connection 获取 Repository。

## 本组文档的示例模型

各页复用下面的模型约定。示例是独立的使用片段，不应按页面顺序反复执行创建操作。生产 Schema 应在自包含的 Migration 中声明，不能将此说明当成初始化代码。

| Collection    | 字段和关系前提                                                                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects`    | `id`：调用方提供的非空 string 主键；`name`：string；`status`：默认 draft 的非空 string；`country/role`：可空 string；`budget`：默认 0 的 decimal；`metadata`：可空 JSON；`version`：启用乐观锁的 integer；`ownerId`：可空 string |
| `users`       | string 主键 `id`、`name`、唯一 string `email`                                                                                                                                                                                    |
| `tasks`       | 非空 string 主键 `id`、string `title`、默认 draft 的非空 string `status`、可空 integer `priority`、默认 0 的 integer `points`、可空 string `projectId`                                                                           |
| `tags`        | string 主键 `id`、string `label`                                                                                                                                                                                                 |
| `projectTags` | `projectId/tagId`：string 关系键；`role`：可空 string payload；为关系键组合声明唯一约束                                                                                                                                          |

`projects.owner` 是指向 users 的 belongsTo，foreignKey 为 ownerId，targetKey 为 id；`projects.tasks` 是指向 tasks 的 hasMany，sourceKey 为 id，foreignKey 为 projectId；`projects.tags` 是经 projectTags 的 belongsToMany，sourceKey/targetKey 均为 id，foreignKey 为 projectId，otherKey 为 tagId。这里的 id 是示例显式声明的字段，不是默认值；其他模型必须填各自真实的关系键。除字段本身外，必须保留这些 Relation Metadata。

其他必填字段应由调用方提供或在 Schema 中定义默认值。示例中 version 由 Repository 初始化，不手动写入。

### 在隔离数据库中准备示例模型

下面代码只在空的开发／测试数据库执行一次；它提供方法页的最小 Schema 前提。生产环境应将固定定义写进自包含 Migration，不能从文档或运行时模型动态导入迁移。

```ts
await db.connection().builder.createCollections([
  {
    name: 'users',
    definition: (c) => {
      c.string('id').primary().notNull();
      c.string('name').notNull();
      c.string('email').unique().notNull();
    },
  },
  {
    name: 'tasks',
    definition: (c) => {
      c.string('id').primary().notNull();
      c.string('title').notNull();
      c.string('status').notNull().defaultTo('draft');
      c.integer('priority').nullable();
      c.integer('points').notNull().defaultTo(0);
      c.string('projectId').nullable();
    },
  },
  {
    name: 'tags',
    definition: (c) => {
      c.string('id').primary().notNull();
      c.string('label').notNull();
    },
  },
  {
    name: 'projectTags',
    definition: (c) => {
      c.string('projectId').notNull();
      c.string('tagId').notNull();
      c.string('role').nullable();
      c.unique(['projectId', 'tagId']);
    },
  },
  {
    name: 'projects',
    definition: (c) => {
      c.string('id').primary().notNull();
      c.string('name').notNull();
      c.string('status').notNull().defaultTo('draft');
      c.string('country').nullable();
      c.string('role').nullable();
      c.decimal('budget').notNull().defaultTo(0);
      c.json('metadata').nullable();
      c.integer('version').notNull();
      c.optimisticLock('version');
      c.string('ownerId').nullable();
      c.belongsTo('owner', 'users').foreignKey('ownerId').targetKey('id');
      c.hasMany('tasks', 'tasks').sourceKey('id').foreignKey('projectId');
      c.belongsToMany('tags', 'tags')
        .sourceKey('id')
        .targetKey('id')
        .through('projectTags')
        .foreignKey('projectId')
        .otherKey('tagId');
    },
  },
]);
```

示例中的所有 id 都是显式声明的 string 字段。非 id 自增主键见 [createOne](./methods/create-one.md#非-id-主键)；无主键、复合身份和 nullable unique 的执行边界见 [Values](./values.md#身份与受管理字段)及 [身份测试目录](../../../tests/integration/repository/identity)。

## 最小读写示例

```ts
const projects = db.repository('projects');
const created = await projects.createOne({
  values: {
    id: 'project-1',
    name: 'Repository',
    status: 'draft',
    country: 'CN',
    role: 'internal',
    budget: '100.00',
  },
  select: (select) => select.fields('id', 'name', 'version'),
});

const rows = await projects.findMany({
  filter: { status: 'draft' },
  select: (select) => select.fields('id', 'name'),
  sort: (sort) => sort.field('id').asc(),
});

const updated = await projects.updateOne({
  filter: { id: 'project-1' },
  ifVersion: created.version,
  values: { status: 'active' },
  select: (select) => select.fields('id', 'status'),
});
console.log(created.record, rows, updated.record);
```

创建和更新返回结果对象，记录位于 `record`；查询直接返回记录或数组。`findOne()` 取匹配结果中的第一条，并不是唯一查询；单条更新和删除则校验实际命中数量。

## 方法导航

| 任务                    | 方法页                                                                  | 返回                                         |
| ----------------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| 读取一条                | [findOne](./methods/find-one.md)                                        | 记录或 undefined                             |
| Read a list             | [findMany](./methods/find-many.md)                                      | `RepositoryQuery<T>`; await returns an array |
| 统计行数                | [count](./methods/count.md)                                             | number                                       |
| 判断存在                | [exists](./methods/exists.md)                                           | boolean                                      |
| Incremental consumption | [findMany asynchronous iteration](./methods/stream.md)                  | `RepositoryQuery<T>` via for-await           |
| 创建一条                | [createOne](./methods/create-one.md)                                    | record/createdTargets/version                |
| 批量创建                | [createMany](./methods/create-many.md)                                  | createdCount，可选 records                   |
| 更新一条                | [updateOne](./methods/update-one.md)                                    | record/createdTargets/version                |
| 批量更新                | [updateMany](./methods/update-many.md)                                  | updatedCount，可选 records                   |
| 唯一条件创建或更新      | [upsertOne](./methods/upsert-one.md)                                    | record/createdTargets/version                |
| 删除一条                | [deleteOne](./methods/delete-one.md)                                    | deleted，可选 record                         |
| 批量删除                | [deleteMany](./methods/delete-many.md)                                  | deletedCount，可选 records                   |
| 计算统计量              | [aggregate](./methods/aggregate.md)                                     | 聚合别名对象                                 |
| 分组统计                | [groupBy](./methods/group-by.md)                                        | 分组结果数组                                 |
| 能力描述、输入预校验    | [describeMutation / validateMutation](./methods/mutation-validation.md) | 能力描述／valid 与 errors                    |

14 个数据方法各有一页，两个辅助方法合为一页，共 16 个公开方法。方法页包含数据前提、参数、返回、代表性示例和错误边界；纯类型速查见 [API 参考](../reference/repository-api.md)。

### 按场景选择，不按名称猜测

| 需要完成的事情           | 应选入口                                  | 不应替换成                                 |
| ------------------------ | ----------------------------------------- | ------------------------------------------ |
| 从多条候选记录中读取一条 | findOne + 显式稳定 sort                   | 假定 findOne 会校验唯一性                  |
| 修改／删除准确匹配的一条 | updateOne / deleteOne                     | 先 findOne，再用原来的宽泛 Filter 写入     |
| 有则更新、无则创建       | upsertOne + 完整唯一条件                  | exists 后分别 create/update 并假定没有竞争 |
| 修改／删除所有匹配记录   | updateMany / deleteMany                   | 用 One 方法隐式挑选一条                    |
| 只判断存在               | exists                                    | 读取全部记录后检查数组长度                 |
| 列表和总数               | findMany + count，显式复用 filter/context | 假定 count 自动继承分页或 distinct         |
| 每个父记录的子列表和统计 | Select 的 relation combine                | 重复 include 同一关系                      |
| 无唯一身份的日志批量写入 | 不带 select 的 createMany                 | createOne 或批量 returning                 |

### 匹配数量与空结果

下表只描述有效输入的匹配结果；输入、字段能力、身份或数据库约束错误仍会报错。

| 方法                    | 无匹配                                     | 多条匹配                               |
| ----------------------- | ------------------------------------------ | -------------------------------------- |
| findOne                 | undefined                                  | 取一条；需要确定结果时显式排序         |
| findMany                | []                                         | 返回符合分页条件的数组                 |
| count / exists          | 0 / false                                  | 行数 / true                            |
| updateOne / deleteOne   | RECORD_NOT_FOUND                           | MULTIPLE_RECORDS_MATCHED，不挑一条写入 |
| updateMany / deleteMany | 对应计数为 0；请求 select 时 records 为 [] | 操作全部匹配记录                       |
| upsertOne               | 执行 create 分支                           | 合法唯一条件由约束保证最多一条         |

空 Filter 对象 `{}` 不是“全部记录”的缩写。无条件读取可省略 filter；批量更新／删除必须显式使用 `all: true`。findOne 的无筛选读取必须提供非空 sort。

## 共享能力导航

| 能力                               | 文档                                          |
| ---------------------------------- | --------------------------------------------- |
| 条件、关系量词、JSON 路径与数组    | [Filter](./filter.md)                         |
| 赋值、变量、literal、原子更新      | [Values](./values.md)                         |
| 标量、关系、关系聚合和 combine     | [Select](./select.md)                         |
| 字段、关系与聚合排序               | [Sort](./sort.md)                             |
| offset、cursor、方向与关系局部页面 | [Pagination](./pagination.md)                 |
| 每组代表记录与关系去重             | [Distinct](./distinct.md)                     |
| 变量解析与支持范围                 | [Context](./context.md)                       |
| 七种关系操作和 through payload     | [Relation mutations](./relation-mutations.md) |
| 原子多步执行、版本冲突             | [Transactions](./transactions.md)             |
| 订阅写入改动的行、提交后通知       | [变更事件](./events.md)                       |

Agent 从[任务指南](../agent/implement-repository-data-access.md)定位方法，再按需阅读共享能力，避免把提案当成当前契约。

## 四类输入

| 输入   | 含义                     | 可用形式                                                       |
| ------ | ------------------------ | -------------------------------------------------------------- |
| filter | 选择记录                 | 等值简写、Builder、JSON AST                                    |
| values | 创建或修改数据           | 对象或根级 callback；标量变量、关系和原子操作可用 Builder/JSON |
| select | 选择字段、关系、关系聚合 | Builder、JSON AST                                              |
| sort   | 定义结果顺序             | Builder、JSON AST                                              |

根级条件名是 `filter`，不是 Prisma 的 `where`。简单 Filter 对象仅表示等值 AND，不支持任意 Prisma 操作符对象。JSON 不能携带 callback；普通值本身也不一定可 JSON 序列化，例如 bigint、Date。

## 关系与结果

```ts
const rows = await db.repository('projects').findMany({
  select: (select) =>
    select.fields('id').include('tasks', (tasks) =>
      tasks.combine({
        records: tasks
          .fields('id', 'title')
          .sort((sort) => sort.field('id').asc())
          .limit(10),
        count: tasks.count(),
      }),
    ),
});
```

四种关系均支持 include；关系聚合只面向 to-many。上述 `tasks` 返回 `{ records: [...], count: number }`，记录分支的 limit 不限制 count 分支。

嵌套写入支持 create/connect/disconnect/set/update/upsert/delete，允许操作取决于关系类型和外键约束。disconnect 不删除目标，delete 会删除目标；根级 createMany/updateMany 不支持嵌套关系写入。

## 正确性和当前边界

- updateOne/deleteOne 必须实际命中一条；upsertOne 使用唯一条件，create 分支必须携带相同唯一值。
- 批量更新、删除需要非空 filter，或明确 `all: true`，不能依赖省略条件表达全表操作。
- 嵌套写入在事务中执行；多个独立调用要共同回滚时使用显式事务。
- View Collection 只读。validateMutation 是预校验，不是权限检查，也不能保证执行时记录仍存在。
- Cursor/Distinct 需要稳定排序；JSON Filter 和 Streaming 有数据库限制，见对应主题。
- 标量 Select 与关系聚合 Builder 有返回类型推导；普通关系记录 include 和 JSON AST 保留动态类型边界。
- 不存在 findUnique/findFirst/connectOrCreate；不支持 native scalar-list、distinctOn、countDistinct、GroupBy 分页。不要由其他 ORM 的习惯推断这些接口。

精确签名以包根入口的 TypeScript 声明为准；设计提案不是当前用法来源。

## 失败后如何处理

| 错误或场景                                   | 建议处理                                                    | 不要做                                    |
| -------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| VARIABLE_NOT_FOUND / INVALID_CONTEXT         | 核对变量路径和调用 context                                  | 把缺失变量替换成 undefined 后继续写入     |
| INVALID_FILTER / INVALID_MUTATION 等输入错误 | 根据 path 修正输入；需要时用 validateMutation 预校验        | 用类型断言跳过运行时限制                  |
| MULTIPLE_RECORDS_MATCHED                     | 收紧条件；业务确实需要批量时再选择 Many                     | 自动取第一条或自动扩大写入范围            |
| VERSION_CONFLICT                             | 重新读取，处理业务冲突                                      | 去掉 ifVersion 后盲目重试                 |
| INVALID_STORED_VALUE                         | Inspect and explicitly repair invalid stored boolean values | Coerce arbitrary values to true/false     |
| 缺失关系目标或目标不在当前关系范围           | 核对目标存在性、唯一键及归属                                | 自动新建目标或把其他父记录的目标抢过来    |
| 数据库唯一／外键／非空约束错误               | 让异常传播到事务边界，再处理业务反馈                        | 假定全部驱动错误都有 RepositoryError.code |

每个 `RepositoryError` 都带有由 `repositoryErrorStatuses` 决定的 `status`。`INTERNAL` 表示服务端自己的问题，如 Policy 或 writePolicy 不合法、库中存储值不合法，调用方改请求无法修复，`/api` 路由按不透明的 500 返回；其余错误按 status 返回 400、403、404 或 409，并携带 `path` 和 `details`。详见 [Repository API 的常见错误](../reference/repository-api.md#常见错误)和 `packages/app/app-skills/skills/nocobase-app-development/references/http-api.md`。

`path`、`details` 和 `retryable` 用于辅助诊断，不等同于重试授权。多个步骤需要共同回滚时，使用[同一个事务 Connection](./transactions.md)，不要在失败后继续提交事务。
