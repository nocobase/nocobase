---
title: Policy 参考
description: 四个节点的每个参数、scope 的完整语法与操作符表、绑定与收窄的每种写法，以及全部误用形态。
---

# Policy 参考

> 文档状态：本页保留设计与实现演进记录，不作为当前用法契约。Repository 已提供[正式使用文档](../../repository/overview.md)和 [API 参考](../../reference/repository-api.md)；本页中的候选项及旧限制需以正式文档、公开类型和实际测试核对。

> **状态：阶段 1 至阶段 3 已实现**，见 `db/src/repository/policy/`、`db-testkit/tests/integration/repository/policy/` 与 [实施清单](./policies-roadmap.md) 的逐项进度。本组文档仍在 `proposals/` 下：转为正式文档并入 `docs/zh-CN/repository/` 与消费方迁移一并进行，在那之前 [Write policy](../../repository/write-policy.md) 描述的方法级 `writePolicy` 仍然有效，两者并存。

本文回答「这种情况该怎么写」，分三部分：**节点**（四个节点各有哪些参数、每个参数的每种取值）、**Scope**（能写什么条件）、**绑定**（怎么把 policy 挂到 Repository 上）。

规则的理由在 [Policy 设计](./policies.md)，循序渐进的讲解在 [Policy 示例说明](./policies-examples.md)，实现落点在 [Policy 执行细节](./policies-internals.md)。完整的类型声明在设计文档的[结构](./policies.md)一节，本文不再复制一份。

数据沿用示例文档那套：`projects`（`id` / `title` / `status` / `tenantId` / `ownerId` / `budget`，关系 `owner` 与 `tasks`）、`tasks`、`users`，当前身份租户 `T1`、用户 `u1`。

# 第一部分：节点

## 一览

四个节点的完整类型声明见[设计文档的结构一节](./policies.md)。各自有哪些参数：

| 节点     | `scope` | `fields` | `relations`               | `defaults` |
| -------- | ------- | -------- | ------------------------- | ---------- |
| `read`   | 必填    | 可选     | 可选，递归 `ReadNode`     | —          |
| `create` | 必填    | 可选     | 可选，`RelationWriteNode` | 可选       |
| `update` | 必填    | 可选     | 可选，`RelationWriteNode` | —          |
| `delete` | 必填    | —        | —                         | —          |

`defaults` 只在 `create` 上。`update` 是 patch，省略字段是刻意的，没有「没给就填」这回事。

`delete` 没有 `fields` 和 `relations`：删除不提交任何字段，也没有"删除时顺带改关系"这回事。删除时返回的快照由 `read` 管，不由 `delete` 管。

四个节点**互不继承**。`read` 可读不蕴含 `update` 可改，`update` 能改不蕴含 `delete` 能删。

## 节点级三态

每个节点先是三选一，选了对象才谈参数。

| 取值    | 含义                     | 失败时的错误                         |
| ------- | ------------------------ | ------------------------------------ |
| 对象    | 按参数限制               | 见各节点                             |
| `true`  | 该操作完全不限制         | —                                    |
| `false` | 该操作整个被拒绝         | `READ_FORBIDDEN` / `WRITE_FORBIDDEN` |
| 省略    | **编译错误**，四节点必填 | —                                    |

`false` 在写侧的拒绝发生在 **values 求值之前**，所以连 `createOne({ values: {} })` 也会被拒——它和"空白名单"是两回事，见 `fields` 一节。

## read 节点

### read.scope

限定**能看到哪些行**，AND 进 WHERE。

| 取值    | 含义                                    |
| ------- | --------------------------------------- |
| `Scope` | 行范围                                  |
| `true`  | 不限行（`fields` / `relations` 仍生效） |

对所有读路径一视同仁，不只是 `findMany`：

```ts
const read = { scope: { tenantId: 'T1' } };
```

```ts
await projects.findMany({ filter: { status: 'draft' } });
// WHERE status='draft' AND tenant_id='T1'   → [p1]，p4 看不到

await projects.count({}); // → 3，不含 p4
await projects.exists({ filter: { id: 'p4' } }); // → false
await projects.findOne({ filter: { id: 'p4' } }); // → null
await projects.aggregate({ aggregate: (a) => ({ t: a.sum('budget') }) });
// → { t: 200000 }，不含 p4 的 8000
await projects.groupBy({
  by: ['status'],
  aggregate: (a) => ({ n: a.count() }),
});
// → draft 1 / published 1 / archived 1，p4 是 draft 但没计进去
```

`count` 和 `exists` 一个字段都不返回却能回答"p4 存在吗"，所以 scope 必须覆盖它们——只作用于 `findMany` 的 scope 等于没有 scope。

不匹配的行表现得与不存在完全一样，不产生任何错误码。

### read.fields

限定**能返回哪些标量字段**，同时限定**调用方能在查询条件里用哪些字段**。

| 取值              | 含义                                      |
| ----------------- | ----------------------------------------- |
| `['id', 'title']` | 白名单                                    |
| `false` 或 `[]`   | 一个标量字段都不返回（仍可 include 关系） |
| 省略              | 空白名单，不返回任何标量字段              |

两种请求方式的行为不同，这是有意的：

```ts
read: { scope: { tenantId: 'T1' }, fields: ['id', 'title', 'status'] }
```

```ts
// 显式请求越权字段 → 报错，不静默裁剪
await projects.findMany({ select: (s) => s.fields('id', 'budget') });
// → FIELD_READ_FORBIDDEN   path: ['select','fields',1]  field: 'budget'

// 省略 select → 按白名单裁剪
await projects.findMany({});
// → [{ id, title, status }, ...]   budget / tenantId / ownerId 都不返回
```

规则是：**省略 `select` 表示"由服务端决定返回什么"，不是"请求全部字段"。**

它还管住查询条件——否则不返回字段照样能问出字段值：

```ts
await projects.exists({ filter: (f) => f.number('budget').gt(100000) });
// → FIELD_READ_FORBIDDEN   path: ['filter','budget']
```

受约束的位置：`filter`、关系 filter、`sort`、`distinct`、`cursor`、`groupBy.by`、`aggregate`、`having`。只校验调用方写的条件，Policy 自己注入的 scope 条件不参与（靠 `origin` 标记区分）。

返回类型也跟着变。`fields` 省略不是完整字段类型，而是空白白名单：

```ts
withPolicy({ read: { scope: tenant }, ... });
await repo.findMany({}); // 不返回根级标量字段

withPolicy({ read: { scope: tenant, fields: ['id', 'title'] }, ... });
await repo.findMany({}); // Partial<Project>[]
```

### read.relations

限定**能展开哪些关系**，每个关系节点又是一个完整的 `ReadNode`。

| 取值                             | 含义                           |
| -------------------------------- | ------------------------------ |
| `{ owner: {...}, tasks: {...} }` | 逐个授权                       |
| `{ tasks: {} }`                  | 该关系可展开，但零字段零子关系 |
| `false` 或省略                   | 禁止所有关系展开               |
| `{ tasks: ref('tasks') }`        | 复用 `tasks` 自己的 read 节点  |

```ts
read: {
  scope: { tenantId: 'T1' },
  fields: ['id', 'title'],
  relations: {
    owner: { scope: true, fields: ['id', 'name'] },
    tasks: { scope: { assigneeId: 'u1' }, fields: ['id', 'title'] },
  },
}
```

**策略不会自动展开关系**，它只决定请求是否获准、最多能返回什么：

```ts
await projects.findMany({});
// → [{ id, title }]   owner 和 tasks 都不返回

await projects.findMany({
  select: (s) =>
    s.fields('id').include('tasks', (t) => t.fields('id', 'title')),
});
// → [{ id: 'p1', tasks: [{ id: 't1', title: '设计稿' }] }, ...]
//   t2 属于 p1 但 assigneeId 是 u2，被关系节点的 scope 挡住
```

关系节点的 `scope` 加在关系分支的查询上，**不减少根记录数量**——父记录照常返回，只是数组为空。

未授权的关系报错：

```ts
await projects.findMany({
  select: (s) => s.include('members', (m) => m.fields('id')),
});
// → RELATION_READ_FORBIDDEN   relation: 'members'
```

一条自动推导的规则：**关系可展开且其 `fields` 含目标主键时，视同对应外键可读**。否则"禁 `ownerId` 但准 `owner{id}`"是等价泄漏。反向不成立。

跨路径不自动继承：`projects.read.relations.tasks` 和 `tasks` 自己的 `read` 是两份独立声明，用 `ref()` 复用而不是靠继承。

## create 节点

### create.scope

`createOne` 没有 `filter`，所以这个 scope 不是 WHERE。它说的是另一句话：**新建的记录必须落在这个范围内**。执行方式是写入后重判——插入后对新记录求值，不满足则整个事务回滚。

| 取值    | 含义                                                           |
| ------- | -------------------------------------------------------------- |
| `Scope` | 新记录必须落在其中                                             |
| `true`  | 不限制。用于"确实要创建自己看不到的记录"，如向别的部门提交工单 |

scope 只做判定，**不提供值**。值由 `defaults`、`fields` 或数据库默认值给出：

```ts
create: {
  scope: { tenantId: 'T1', ownerId: 'u1' },
  defaults: { tenantId: 'T1', ownerId: 'u1' },
  fields: ['title'],
}
```

```ts
await projects.createOne({ values: { title: '新项目' } });
// 实际写入 { title:'新项目', tenantId:'T1', ownerId:'u1' }
```

看着重复，但两句话本来就不同——一个是"必须满足"，一个是"没给就填"。抽个变量即可：

```ts
const tenant = { tenantId: 'T1', ownerId: 'u1' };
create: { scope: tenant, defaults: tenant, fields: ['title'] }
```

**可满足性在配置阶段检查。** scope 引用的每个字段必须在 `defaults` 里、在 `fields` 里、或有满足条件的数据库字面量默认值，否则 `INVALID_POLICY`。没有这条，一个取不到值的字段会让这个 create 节点永远失败，而且要到第一次调用才暴露。

**没有继承。** `create.scope` 不从 `read.scope` 或 `update.scope` 借——`update.scope` 里的 `status: 'draft'` 说的是"能修改草稿状态的记录"，不是"新建的必须是草稿"，借过来会静默强制每条新记录的状态。

### create.defaults

服务端赋值，**调用方未提供该字段时**应用。

| 取值                 | 含义                 |
| -------------------- | -------------------- |
| `{ tenantId: 'T1' }` | 字段到标量常量的映射 |
| 省略                 | 不做任何赋值         |

能不能被调用方覆盖，由 `fields` 决定：

| `defaults` | 在 `fields` 里 | 效果                                                  |
| ---------- | -------------- | ----------------------------------------------------- |
| 有         | 否             | **强制赋值**，调用方无法覆盖（`tenantId` 的典型用法） |
| 有         | 是             | **真正的默认值**，调用方可覆盖，覆盖后受 scope 重判   |
| 无         | 是             | 调用方自己提供，否则走数据库默认值                    |
| 无         | 否             | 完全由数据库默认值决定                                |

`defaults` 可以设 scope 里根本没有的字段：

```ts
create: {
  scope: { tenantId: 'T1' },
  defaults: { tenantId: 'T1', createdBy: 'u1', source: 'web' },
  fields: ['title'],
}
```

值必须是标量常量，与 scope 的值位置同一套要求。赋值后的记录与调用方提交的值一视同仁，同样经过字段级 validation 和数据库约束。

### create.fields

限定**调用方能提交哪些字段**。

| 取值            | 含义                                                                                |
| --------------- | ----------------------------------------------------------------------------------- |
| `['title']`     | 白名单                                                                              |
| `false` 或 `[]` | 一个字段都不能提交，但 `createOne({ values: {} })` 仍能插入一行（触发数据库默认值） |
| 省略            | 空白名单，调用方不能提交任何字段                                                    |

```ts
await projects.createOne({ values: { title: 'X', budget: 999 } });
// → FIELD_WRITE_FORBIDDEN   path: ['values','budget']
```

注入得出来的字段不要再放进 `fields`——那等于让调用方提交一个随后会被重判挡掉的值，白撞一次 403。

### create.relations

`createOne` 的关系只支持 `create` 和 `connect`，这是 Repository 自身的能力边界，Policy 不能让不支持的操作变得可用。

```ts
create: {
  scope: { tenantId: 'T1' },
  defaults: { tenantId: 'T1' },
  fields: ['title'],
  relations: {
    tasks: {
      scope: { tenantId: 'T1' },
      create: { fields: ['title'] },
      connect: {},
    },
  },
}
```

关系节点的 `scope` 约束 `connect` 能定位到哪些既有目标；`create` 分支不受它约束，因为新目标的归属由关系键决定。

## update 节点

结构与 `create` 相同，语义不同。

### update.scope

同时做两件事：

1. **AND 进 WHERE**，决定能改哪些既有行
2. **写入后重判**，决定改完之后还允不允许

```ts
update: { scope: { tenantId: 'T1', ownerId: 'u1' }, fields: ['title', 'ownerId'] }
```

```ts
// 第一件事：越界的行改不到
await projects.updateOne({ filter: { id: 'p2' }, values: { title: 'X' } });
// p2 的 ownerId 是 u2 → WHERE 匹配 0 行 → RECORD_NOT_FOUND（404，不是 403）

// 第二件事：改到界外也不行
await projects.updateOne({ filter: { id: 'p1' }, values: { ownerId: 'u2' } });
// WHERE 命中 p1 ✓，但改完 ownerId='u2' 不满足 scope
// → SCOPE_VIOLATION（403，记录本身可见，拒的是提交的值）
```

两种失败的 HTTP 状态不同，这是有意的：404 那次记录不可见，任何可区分的响应都会泄漏存在性；403 那次记录本来就看得见、也有权改，被拒的只是值。

**松紧完全由 scope 决定，没有额外开关。** 想允许同租户内转让，把 scope 从按人改成按租户即可：

```ts
update: { scope: { tenantId: 'T1' }, fields: ['title', 'ownerId'] }
// 转让成功；跨租户改写仍被 SCOPE_VIOLATION 挡住
```

### update.fields

与 `create.fields` 相同规则，但白名单通常不同——创建时不允许提交的初始状态，更新时往往允许修改。

```ts
create: { scope: tenant, defaults: tenant, fields: ['title'] },              // 状态由默认值决定
update: { scope: mine, fields: ['title', 'status'] },      // 状态可改
```

数值字段的 `increment` / `decrement` 等原子操作按该字段整体控制，JSON 字段按整列控制，不支持子路径粒度。

### update.relations

支持全部七种关系操作，逐项声明，缺失的一律禁止。

```ts
update: {
  scope: { tenantId: 'T1', ownerId: 'u1' },
  fields: ['title'],
  relations: {
    tasks: {
      scope: { tenantId: 'T1' },       // 能定位到哪些既有 task
      create: { fields: ['title'] },
      update: { fields: ['title', 'completed'] },
      upsert: { create: { fields: ['title'] }, update: { fields: ['title'] } },
      connect: {},
      disconnect: {},
      set: {},
      delete: {},
    },
    tags: {
      scope: true,
      connect: { through: { fields: ['role'] } },   // 多对多的中间表 payload
    },
  },
}
```

| 操作         | 受关系 `scope` 约束 | 说明                                                |
| ------------ | ------------------- | --------------------------------------------------- |
| `create`     | 否                  | 新目标归属由关系键决定                              |
| `update`     | 是                  | 定位时满足，改完也必须满足                          |
| `upsert`     | 是                  | 命中但越界 → `RELATION_UPSERT_TARGET_OUTSIDE_SCOPE` |
| `connect`    | 是                  | 未命中 → `RELATION_TARGET_NOT_FOUND`                |
| `disconnect` | 是                  | 同上                                                |
| `set`        | 是                  | 同上                                                |
| `delete`     | 是                  | 同上                                                |

`through` 只用于多对多的 `create` / `connect` / `set`，独立控制中间表字段；缺失或 `false` 禁止显式 through payload。

两条容易踩的：

- **允许 `owner.connect` 不等于允许写 `ownerId`。** 若同时把 `ownerId` 放进 `fields`，调用方可以绕过关系直接写外键。
- **目标 Collection 自己的 Policy 不参与。** 调用方手上只有发起方这一个实例，给 `relations.tasks` 授权就是在替 `tasks` 表做授权决定。

## delete 节点

只有一个参数。删除不提交字段，所以没有 `fields`；也没有"删除时顺带操作关系"，关系的删除写在 `update.relations.<关系>.delete` 里。

```ts
delete: { scope: { tenantId: 'T1', ownerId: 'u1', status: 'draft' } }
```

```ts
await projects.deleteOne({ filter: { id: 'p3' } });
// p3 是 u1 的，但 status='archived' → RECORD_NOT_FOUND

await projects.deleteOne({ filter: { id: 'p1' } });
// T1 ✓ u1 ✓ draft ✓ → 删除成功

await projects.deleteMany({ all: true });
// → { count: 1 }   只有 p1 符合，不报错，数字变小而已
```

删除没有"写入后重判"——行已经没了，没有后像可判。

**删除前的快照由 `read` 管，不由 `delete` 管**：

```ts
await projects.deleteOne({
  filter: { id: 'p1' },
  select: (s) => s.fields('id', 'title', 'budget'),
});
// 能不能删 → delete.scope
// 快照能返回什么 → read.fields（budget 不在白名单里就报 FIELD_READ_FORBIDDEN）
```

删得掉不等于看得见，两个问题分开。

## 影响矩阵

哪个节点的哪个参数会影响哪些方法：

| 参数               | find\*              | count / exists | aggregate / groupBy | createOne / Many | updateOne / Many | upsertOne    | deleteOne / Many |
| ------------------ | ------------------- | -------------- | ------------------- | ---------------- | ---------------- | ------------ | ---------------- |
| `read.scope`       | 行范围              | 行范围         | 行范围              | —                | —                | —            | —                |
| `read.fields`      | 返回字段 + 查询条件 | 查询条件       | 查询条件 + 分组字段 | 返回快照         | 返回快照         | 返回快照     | 返回快照         |
| `read.relations`   | include 授权        | 关系条件       | 关系聚合            | 快照 include     | 快照 include     | 快照 include | 快照 include     |
| `create.scope`     | —                   | —              | —                   | 注入 + 重判      | —                | create 分支  | —                |
| `create.defaults`  | —                   | —              | —                   | 服务端赋值       | —                | create 分支  | —                |
| `create.fields`    | —                   | —              | —                   | 可提交字段       | —                | create 分支  | —                |
| `create.relations` | —                   | —              | —                   | create / connect | —                | create 分支  | —                |
| `update.scope`     | —                   | —              | —                   | —                | WHERE + 重判     | update 分支  | —                |
| `update.fields`    | —                   | —              | —                   | —                | 可提交字段       | update 分支  | —                |
| `update.relations` | —                   | —              | —                   | —                | 七种操作         | update 分支  | —                |
| `delete.scope`     | —                   | —              | —                   | —                | —                | —            | WHERE            |

三点值得留意：

- **`read.fields` 横跨读写两侧**——所有 mutation 的 returning 都受它约束。
- **`read.scope` 不约束 returning。** 行是由该 mutation 自己的 scope 选出来的，调用方对它有操作权；再拿 `read.scope` 过一遍会产生"写成功了却拿不到结果"的怪异行为。字段约束仍然适用，因为"能改"不等于"能看见所有字段"。
- **`upsertOne` 同时使用 `create` 和 `update` 两个节点**，行范围取 `update.scope`。它不需要独立节点。

## 节点之间

### 不继承

```ts
read: { scope: { tenantId: 'T1' } },                          // 全租户可读
update: { scope: { tenantId: 'T1', ownerId: 'u1' } },        // 只能改自己的
delete: false,                                                // 不能删
```

读得到不等于改得了，改得了不等于删得了。每个节点独立声明，没有任何一条自动推导。

### 跨操作的范围逃逸不归 Policy 管

```ts
delete: { scope: { ownerId: 'u1', status: 'draft' } },
update: { scope: { ownerId: 'u1' }, fields: ['status'] },
```

用户把 `status` 从 `draft` 改成 `published`，于是离开了 `delete.scope`。这是**正确结果**——他失去了删除能力，没有获得任何权限。反过来把 `published` 改回 `draft` 再删，算不算绕过？那是"这个状态转换合不合法"的问题，属于字段与记录级 validation 或状态机。

Policy 回答"谁能碰哪些行、哪些字段"，到此为止。

## 错误码归属

| 错误码                                 | 来自哪个节点                                         | HTTP |
| -------------------------------------- | ---------------------------------------------------- | ---- |
| `READ_FORBIDDEN`                       | `read: false`                                        | 403  |
| `FIELD_READ_FORBIDDEN`                 | `read.fields`                                        | 403  |
| `RELATION_READ_FORBIDDEN`              | `read.relations`                                     | 403  |
| `WRITE_FORBIDDEN`                      | `create: false` / `update: false`                    | 403  |
| `FIELD_WRITE_FORBIDDEN`                | `create.fields` / `update.fields` / `through`        | 403  |
| `RELATION_WRITE_FORBIDDEN`             | `create.relations` / `update.relations` 未声明的操作 | 403  |
| `SCOPE_VIOLATION`                      | `create.scope` / `update.scope` 的写入后重判         | 403  |
| `RECORD_OUTSIDE_SCOPE`                 | `update.scope`，仅 upsert                            | 409  |
| `RELATION_TARGET_NOT_FOUND`            | 关系节点的 `scope`                                   | 404  |
| `RELATION_UPSERT_TARGET_OUTSIDE_SCOPE` | 关系节点的 `scope`，仅关系 upsert                    | 409  |
| `INVALID_POLICY`                       | 任意节点的结构或字段名不合法                         | 400  |

**`scope` 不匹配不产生错误码**——`read.scope` 表现为空结果，`update.scope` / `delete.scope` 表现为 `RECORD_NOT_FOUND`（404），与记录不存在不可区分。上表里没有"越权"这一项，这是设计使然。

相关文档：

- [Policy 设计](./policies.md)
- 第三部分
- [Policy 示例说明](./policies-examples.md)
- [Policy 执行细节](./policies-internals.md)

# 第二部分：Scope

## 两种输入形式

`scope` 复用 `RepositoryFilter` 的语法，但只接受其中两种形式：

| 形式                          | scope 接受 | 说明                                               |
| ----------------------------- | ---------- | -------------------------------------------------- |
| 简写对象 `{ tenantId: 'T1' }` | ✅         | 根级标量等值，隐式 AND。覆盖绝大多数 scope         |
| `FilterAst`                   | ✅         | 其余全部条件。纯 JSON，可序列化                    |
| Builder 回调 `(f) => ...`     | ✅         | 绑定期求值一次并物化成 AST，存进策略里的不再是函数 |

三种形式最终都归一成 `FilterAst`：`withPolicy` 调用 `buildFilter` 规范化 scope，回调在那一刻就被展开。所以「Policy 是一份可检视、可序列化的数据」这条性质对三者同样成立，`explainPolicy()` 返回的永远是 AST。

回调曾被排除，理由是它无法序列化、也就无法被 `explainPolicy()` 检视或存库。绑定期物化之后这条理由不再成立：留在策略里的是 AST，函数在 `withPolicy` 返回前就已经消失。

### 简写能表达什么

**只有根级标量等值。** 这是 `RepositoryFilter` 简写自身的限制，不是 scope 额外加的：

```ts
scope: { tenantId: 'T1' }                      // ✅
scope: { tenantId: 'T1', ownerId: 'u1' }       // ✅ 隐式 AND
scope: { ownerId: null }                       // ✅ null 表示空值
```

简写**不支持**：Date 对象、数组、嵌套操作符对象、关系、JSON 字段、`date` / `datetime` 字段。

```ts
scope: { budget: { $gt: 100000 } }   // ❌ 不是当前 Filter 语法
scope: { tenantId: ['T1', 'T2'] }    // ❌ 简写不接受数组
scope: { $or: [ ... ] }              // ❌ 简写没有逻辑组合
```

这三种写法在整个 Repository 里都不存在——不是 scope 不给用。要用它们就写 AST。

### AST 覆盖其余

```ts
scope: {
  kind: 'filter',
  version: 1,
  root: {
    kind: 'group',
    logic: 'and',
    items: [
      { kind: 'condition', path: ['tenantId'], operator: '$eq', value: 'T1' },
      { kind: 'condition', path: ['budget'], operator: '$gte', value: 1000 },
    ],
  },
}
```

啰嗦，但只在需要非等值条件时才用到，而 scope 的绝大多数场景是租户 / 归属 / 状态的等值判断。

### `scope: {}` 不合法

```ts
const a = { read: { scope: {} } }; // ❌ INVALID_POLICY
const b = { read: { scope: true } }; // ✅ 不限行
```

刻意禁掉，因为 `{}` 会被读成两个相反的意思：按 filter 语义是"无条件"（最宽），按 `fields: []` 的类比是"空白名单"（最严）。要求写 `true`，歧义消失。

## 操作符全集

`scope` 可用的操作符是 `FilterOperator` 去掉 JSON 系列后的 21 个。关系节点（`kind: 'relation'`）和变量节点（`kind: 'variable'`）同样不可用。

### 通用

| 操作符      | 含义        | 适用字段                                       |
| ----------- | ----------- | ---------------------------------------------- |
| `$eq`       | 等于        | string / text / uuid / number / time / boolean |
| `$ne`       | 不等于      | 同上                                           |
| `$empty`    | IS NULL     | 全部                                           |
| `$notEmpty` | IS NOT NULL | 全部                                           |

### 数值比较

| 操作符         | 含义            |
| -------------- | --------------- |
| `$gt` / `$gte` | 大于 / 大于等于 |
| `$lt` / `$lte` | 小于 / 小于等于 |

### 字符串

| 操作符                       | 含义          |
| ---------------------------- | ------------- |
| `$includes` / `$notIncludes` | 包含 / 不包含 |
| `$startsWith` / `$endsWith`  | 前缀 / 后缀   |

四个都接受 `mode: 'default' | 'insensitive'`。

### 日期

| 操作符                             | 含义               |
| ---------------------------------- | ------------------ |
| `$dateOn` / `$dateNotOn`           | 在 / 不在某日      |
| `$dateBefore` / `$dateAfter`       | 早于 / 晚于        |
| `$dateNotBefore` / `$dateNotAfter` | 不早于 / 不晚于    |
| `$dateBetween`                     | 区间（两元素数组） |

### 布尔

| 操作符                  | 含义        |
| ----------------------- | ----------- |
| `$isTruly` / `$isFalsy` | 为真 / 为假 |

### 逻辑组合

AST 的 `FilterGroupNode` 支持 `logic: 'and' | 'or'`，可嵌套。没有通用的 `not()`。

### 不存在的操作符

以下在整个 Repository 里都没有，不要写：

- **`$in`** — 用 `$or` 展开成多个 `$eq`
- **`$not`** — 用对应的否定操作符（`$ne` / `$notIncludes` / `$dateNotOn` …）
- **关系 `every()`** — 关系量词只有 `some` / `none` / `exists` / `notExists` / `empty` / `notEmpty` 六个（注意量词的 `empty` / `notEmpty` 与字段操作符 `$empty` / `$notEmpty` 同名不同物），且 scope 一概不可用

### 排除 JSON 系列

`$jsonEq`、`$jsonHas`、`$jsonHasSome` 等十个 JSON 操作符**不在 scope 的允许集合里**，尽管 `filter` 支持它们。

原因是不变量 2：写入后重判要在内存里对记录求值，结果必须与同一条件下推成 SQL 完全一致。JSON 的比较语义在八种方言里差异最大（路径语法、NULL 的三种形态、数组包含的判定），做到逐方言一致的内存求值器代价过高而收益很低——scope 表达的是归属和范围，几乎不会落在 JSON 列上。

需要按 JSON 内容限定范围时，把判定结果物化成一个标量列。

## 按字段类型

| 字段类型                                   | 可用操作符                                                                                                             | 简写能否表达          |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `string` / `text` / `uuid`                 | `$eq` `$ne` `$includes` `$notIncludes` `$startsWith` `$endsWith` `$empty` `$notEmpty`                                  | 仅 `$eq`              |
| 数值（`integer` / `bigint` / `decimal` …） | `$eq` `$ne` `$gt` `$gte` `$lt` `$lte` `$empty` `$notEmpty`                                                             | 仅 `$eq`              |
| `boolean`                                  | `$isTruly` `$isFalsy` `$eq` `$ne` `$empty` `$notEmpty`                                                                 | 仅 `$eq`（含 `null`） |
| `time`                                     | `$eq` `$ne` `$empty` `$notEmpty`                                                                                       | 仅 `$eq`              |
| `date` / `datetime` / `datetimeTz`         | `$dateOn` `$dateNotOn` `$dateBefore` `$dateAfter` `$dateNotBefore` `$dateNotAfter` `$dateBetween` `$empty` `$notEmpty` | **不能**，必须用 AST  |
| `enum`                                     | 按其底层存储类型（通常是 string）                                                                                      | 仅 `$eq`              |
| `json`                                     | 不可用于 scope                                                                                                         | —                     |

`date` 系列在简写里完全不可用，这一点容易踩：`scope: { createdAt: '2026-01-01' }` 不是有效条件。

## NULL 的三值语义

这是 scope 里最容易配错的一处，因为 SQL 和 JavaScript 的直觉不同。

```ts
// AST: { path: ['status'], operator: '$ne', value: 'archived' }
```

SQL 里 `status <> 'archived'` 对 `status IS NULL` 的行求值为 UNKNOWN，**不匹配**。所以这个 scope 排除了归档记录，**也排除了状态为空的记录**——配置的人通常不是这个意思。

写入后重判的内存求值器必须复刻这个行为，不能用 JS 的 `!==`：

```ts
record.status = null;
record.status !== 'archived'; // JS: true
// SQL 与求值器: false
```

真要包含空值，显式用 `$or`：

```ts
root: {
  kind: 'group',
  logic: 'or',
  items: [
    { kind: 'condition', path: ['status'], operator: '$ne', value: 'archived' },
    { kind: 'condition', path: ['status'], operator: '$empty' },
  ],
}
```

同一条陷阱适用于 `$notIncludes`、`$dateNotOn`、`$dateNotBefore` 等一切否定操作符。

`$eq` 与 `null` 是特例：简写里 `{ ownerId: null }` 表达的是 `IS NULL`，不是 `= NULL`。

## 操作符的行为差异

scope 在四个位置被使用，能力不同。这张表决定了写某个操作符要付什么代价。

| 用途                        | 需要什么           | 支持的操作符                                             |
| --------------------------- | ------------------ | -------------------------------------------------------- |
| 下推成 WHERE                | 能翻译成 SQL       | **全部 21 个**                                           |
| `updateMany` 快路径静态判定 | 不读行就能判定后像 | 平铺 AND 的全部；`or` 组在 `values` 触及其分支字段时失效 |
| 写入后重判（内存求值）      | 与 SQL 语义一致    | 全部，但一致性风险分级见下                               |

scope 只做判定，任何用途下都**不产生值**——`create` 的字段赋值由 `create.defaults` 负责，与 scope 的语法形状无关。

### create 的可满足性

scope 不提供值，所以写复杂条件时要确认每个被引用的字段拿得到值。配置阶段检查这一条：

> `create.scope` 引用的每个字段，必须在 `create.defaults` 里、在 `create.fields` 里，或有满足该条件的数据库字面量默认值，否则 `INVALID_POLICY`。

```ts
// ✅ tenantId 由 defaults 给值
create: {
  scope: { tenantId: 'T1' },
  defaults: { tenantId: 'T1' },
  fields: ['title'],
}

// ✅ status 由调用方提供，值不对时写入后重判挡下
create: {
  scope: <AST: status $ne 'archived'>,
  fields: ['title', 'status'],
}

// ❌ INVALID_POLICY：status 取不到值
create: {
  scope: <AST: status $ne 'archived'>,
  fields: ['title'],
}
// 只能走数据库默认值；若默认值是 'archived'，这个 create 永远不可能成功
```

`or` 分组按「存在一条分支的全部字段都满足上述之一」判定。

### `updateMany` 的静态判定

`values` 对所有行相同，所以多数情况一次判定即可，不必逐行读：

```text
若 scope 是平铺 AND，且对每个同时出现在 scope 和 values 里的字段，
values 的字面值都满足该条件 → 所有行的后像必然满足 → 放行快路径
```

最常见的形态直接命中：`values` 里根本没有 scope 字段，那些字段不变，WHERE 已经保证过了。

`$or` 是唯一会导致降级的结构，而且只在 `values` 触及其分支字段时：

```ts
// scope: ownerId='u1' OR visibility='public'
// values: { ownerId: 'u2' }
// 某行靠 ownerId 满足、某行靠 visibility 满足，不读行判不出来 → 降级到锁定路径
```

### 内存求值的一致性风险

写入后重判在内存里跑，结果必须与 SQL 完全一致。按风险排序：

| 风险 | 操作符                                                          | 原因                                                |
| ---- | --------------------------------------------------------------- | --------------------------------------------------- |
| 高   | `$dateOn` 及全部日期操作符                                      | 时区、精度截断；`datetime` 与 `datetimeTz` 行为不同 |
| 高   | `$includes` / `$startsWith` / `$endsWith`（尤其 `insensitive`） | 大小写折叠规则由数据库排序规则决定，八方言不一致    |
| 中   | 字符串 `$eq` / `$ne`                                            | 排序规则决定尾部空格和大小写敏感性                  |
| 中   | 数值 `$gt` 等                                                   | BigInt 与 Decimal 的精度，JS number 会丢            |
| 低   | `$isTruly` / `$isFalsy`                                         | 部分方言用 0/1 存储，`decodeBooleanRow` 已统一      |
| 低   | `$empty` / `$notEmpty`                                          | 语义简单，但要遵守三值逻辑                          |

**高风险的两组建议不要用在 `create.scope` 和 `update.scope` 上**——它们要走写入后重判。`read.scope` 和 `delete.scope` 不需要内存求值，用它们没有这个问题。

这也是分用途看待 scope 的另一个理由：

| 节点           | 是否需要内存求值 | 操作符建议                         |
| -------------- | ---------------- | ---------------------------------- |
| `read.scope`   | 否               | 全部 21 个随意                     |
| `delete.scope` | 否               | 全部 21 个随意                     |
| `update.scope` | 是               | 避开日期与大小写不敏感的字符串匹配 |
| `create.scope` | 是               | 同上，且优先用顶层 `$eq` 以便注入  |

## 值的形式

| 类型   | 写法                             | 注意                                |
| ------ | -------------------------------- | ----------------------------------- |
| 字符串 | `'T1'`                           | 排序规则决定大小写敏感性            |
| 数值   | `1000` 或 `'1000'`               | 超出 JS 安全整数范围用字符串        |
| 布尔   | `true` / `false`                 | 或用 `$isTruly` / `$isFalsy`        |
| 空值   | `null`（简写）或 `$empty`（AST） | `= NULL` 永远不成立，必须用 IS NULL |
| 日期   | ISO 字符串或 `Date`              | 简写不接受，必须 AST                |
| 数组   | 仅 `$dateBetween` 的两元素区间   | 没有 `$in`                          |

值必须是**常量**。scope 里不能引用 `context` 变量（`$actor.id`）——那是调用方每次调用可传的参数，用它决定范围等于把范围交给调用方。身份要进 scope，通过 `withPolicy(fn, principal)` 在绑定时求值。

## 索引义务

scope 会 AND 进这张表**每一条**读写语句的 WHERE。没有索引就是给全部操作加一次全表扫描。

```ts
builder.createCollection('projects', {
  indexes: [
    { fields: ['tenantId'] },
    { fields: ['tenantId', 'ownerId'] }, // update.scope 的组合
    { fields: ['tenantId', 'ownerId', 'status'] }, // delete.scope 的组合
  ],
});
```

三条规则：

- **每个 scope 用到的字段组合都应当有对应索引**，按最常用的 scope 建复合索引。
- **复合索引的列顺序跟着选择性走**，`tenantId` 通常放最左。
- **区分度低的字段不适合单独进 scope。** 只有两三个取值的 `status` 无法有效缩小范围，它作为 `delete.scope` 的附加条件可以，作为唯一条件不行。

唯一约束也要一起考虑：租户隔离下的唯一性几乎总是租户内唯一，`['tenantId', 'title']` 而不是 `['title']`。唯一冲突发生在数据库层，早于任何 Policy 判断，scope 挡不住它。

# 第三部分：绑定

## 先选形态

```text
要绑几张表？
├─ 一张 ──────────────── repository('x').withPolicy(...)
└─ 多张，或需要事务 ──── conn.restrict({ ... }, principal)

写 policy 时身份在手边吗？
├─ 在（请求处理函数里）── 第一参数写字面量，没有第二参数
└─ 不在（模块顶层声明）── 第一参数写函数，第二参数给 principal

已经绑过了，还想再严一点？
└─ narrow(部分)
```

## 一、第一参数的两种形态

### 1.1 字面量：身份已在作用域内

最常见。四个节点必填，节点写成对象则 `scope` 必填。

```ts
function handler(actor: Actor, conn: DatabaseConnection) {
  return conn.repository('projects').withPolicy({
    read: {
      scope: { tenantId: actor.tenantId },
      fields: ['id', 'title', 'status'],
    },
    create: {
      scope: { tenantId: actor.tenantId },
      defaults: { tenantId: actor.tenantId },
      fields: ['title'],
    },
    update: {
      scope: { tenantId: actor.tenantId, ownerId: actor.id },
      fields: ['title'],
    },
    delete: {
      scope: { tenantId: actor.tenantId, ownerId: actor.id, status: 'draft' },
    },
  });
}
```

重复的部分抽成变量，别抽成"基础 policy 再覆盖几个键"——后者读的人得在脑子里做一次合并才知道 `delete` 是什么：

```ts
const tenant = { tenantId: actor.tenantId };
const mine = { ...tenant, ownerId: actor.id };
```

### 1.2 工厂函数 + principal：policy 写在身份存在之前

只为一个场景存在：函数写在模块顶层，启动时执行，那时没有任何请求可以闭包。

```ts
// 启动时
const projectPolicy = (p: Principal) => ({
  read: { scope: { tenantId: p.tenantId }, fields: ['id', 'title', 'status'] },
  create: {
    scope: { tenantId: p.tenantId },
    defaults: { tenantId: p.tenantId },
    fields: ['title'],
  },
  update: { scope: { tenantId: p.tenantId, ownerId: p.id }, fields: ['title'] },
  delete: false,
});

// 每个请求
conn.repository('projects').withPolicy(projectPolicy, principal);
```

函数里可以分支，这是它比字面量多出来的能力：

```ts
const projectPolicy = (p: Principal) => ({
  read: { scope: { tenantId: p.tenantId } },
  create: {
    scope: { tenantId: p.tenantId },
    defaults: { tenantId: p.tenantId },
    fields: ['title'],
  },
  update:
    p.role === 'admin'
      ? {
          scope: { tenantId: p.tenantId },
          fields: ['title', 'status', 'budget'],
        }
      : { scope: { tenantId: p.tenantId, ownerId: p.id }, fields: ['title'] },
  delete: p.role === 'admin' ? { scope: { tenantId: p.tenantId } } : false,
});
```

三条契约：

- 在 `withPolicy` 时**求值一次**，结果冻结。不是每次方法调用重新求值。
- **同步返回**。`async` 返回 Promise，直接是类型错误。
- 返回值走**完整校验**，与字面量同一套规范化。

重载保证两个参数成对出现：

```ts
conn.repository('projects').withPolicy(projectPolicy);
// → 类型错误：函数形态必须提供 principal
```

## 二、绑定层级

### 2.1 单表

```ts
const projects = conn.repository('projects').withPolicy({ ... });
```

### 2.2 多表：绑在 Connection 上

```ts
const restricted = conn.restrict(
  { projects: projectPolicy, tasks: taskPolicy },
  principal,
);

await restricted
  .repository('projects')
  .findMany({ filter: { status: 'draft' } });
await restricted.repository('tasks').updateOne({ filter: { id }, values });
```

map 里也可以混用两种形态——字面量的那些不消费 `principal`：

```ts
conn.restrict(
  {
    projects: projectPolicy, // 函数
    tasks: {
      read: { scope: { tenantId: 'T1' } },
      create: true,
      update: true,
      delete: false,
    }, // 字面量
  },
  principal,
);
```

Unlisted direct Collection access is denied:

```ts
// restricted.repository('users'); // Type error for this literal map.
// Dynamic maps are checked at runtime and throw POLICY_REQUIRED.
```

The returned `RestrictedDatabase` exposes restricted repositories, transactions, commit/rollback callbacks, and policy explanations. It has no raw connection capabilities. `withPolicies()` remains supported without deprecation for policy binding with full connection capabilities, including unlisted-Collection and raw access. See [Restricted database access](../../../restricted-database.md) to choose the appropriate access boundary.

### 2.3 事务

事务内派生的 Repository 自动携带同一份 policy，不需要重新绑：

```ts
await restricted.transaction(async (tx) => {
  await tx.repository('projects').updateOne({ filter: { id }, values });
  await tx.repository('tasks').createOne({ values });
});
```

A repository bound individually must be recreated from the transaction connection. `connection.restrict()` carries the policies into the callback automatically:

```ts
// ✗ tx.repository('projects') 是未绑定的
await conn.transaction(async (tx) => {
  tx.repository('projects');
});
```

## 四、收窄

`narrow` 接受任意子集，只会更严。

```ts
const draftsOnly = projects.narrow({ read: { scope: { status: 'draft' } } });
// read.scope → { tenantId: 'T1' } AND { status: 'draft' }
// 其余节点未提及 → 保持不变
```

### 4.1 每一维的归并规则

| 维度        | 规则                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------- |
| 节点        | base 为 `false` → `false`；patch 未提及 → base；patch 为 `false` → `false`；base 为 `true` → patch |
| `scope`     | 取 AND；任一为 `true` 则取另一侧                                                                   |
| `fields`    | 取交集；任一为 `false` 或未定义 → 空白白名单                                                       |
| `relations` | 按关系名递归；**只出现在 patch 里的关系直接丢弃**                                                  |

最后一条是这套规则里最容易写错的：patch 里冒出 base 没有的关系，要丢弃而不是加入，否则 `narrow` 就成了放宽。

### 4.2 放宽的各种尝试都无效

```ts
draftsOnly.narrow({ read: { scope: {} } }); // 不会解除 tenantId
draftsOnly.narrow({ read: { fields: ['budget'] } }); // 交集为空 → 一个字段都读不到
draftsOnly.narrow({ delete: { scope: true } }); // base 若为 false，结果仍是 false
draftsOnly.narrow({ read: { relations: { members: {} } } }); // base 没有 members → 丢弃
```

### 4.3 多层叠加

```ts
const a = projects.narrow({ read: { scope: { status: 'draft' } } });
const b = a.narrow({ read: { fields: ['id'] } });

b.explainPolicy();
// → read.scope  { tenantId: 'T1' } AND { status: 'draft' }
//   read.fields ['id']
```

## 五、方法级叠加

单次调用仍可传 `writePolicy` 做本次的额外收窄，与实例节点取交集。

| 写法                                 | 含义                             |
| ------------------------------------ | -------------------------------- |
| `writePolicy: { fields: ['title'] }` | 本次再收窄                       |
| `writePolicy: true`                  | 本次不额外收窄，实例绑定照常生效 |
| `writePolicy: false`                 | 本次写入整个被拒                 |
| 省略                                 | 同 `true`                        |

```ts
await projects.updateOne({
  filter: { id },
  values: { title: 'X' },
  writePolicy: { fields: ['title'] }, // 实例允许 title+status，本次只允许 title
});
```

`true` **不报错**——它表示的是"收窄零"，与"只能收窄"的规则一致。

## 六、典型配置

### 6.1 按角色分支

见 1.2 的函数形态。

### 6.2 系统任务：完全不绑

后台任务、迁移脚本、定时作业不代表任何用户，不需要 policy：

```ts
const projects = conn.repository('projects'); // 不调 withPolicy，完全不受限
```

Collection 标了 `requireScope` 时要显式豁免，让它出现在 diff 里：

```ts
conn.repository('projects').withPolicy({
  read: true,
  create: true,
  update: true,
  delete: true,
});
```

### 6.3 同一请求，不同接口不同收窄

```ts
const restricted = conn.restrict({ projects: projectPolicy }, principal);
const base = restricted.repository('projects');

const listEndpoint = base.narrow({ read: { fields: ['id', 'title'] } });
const detailEndpoint = base; // 完整字段
const exportEndpoint = base.narrow({
  read: { scope: { status: 'published' } },
});
```

### 6.4 分租户的只读副本

```ts
const readonly = conn.restrict(
  {
    projects: (p) => ({
      read: { scope: { tenantId: p.tenantId } },
      create: false,
      update: false,
      delete: false,
    }),
  },
  principal,
);
```

## 七、检视

```ts
repo.explainPolicy();
// → 归并 withPolicy 与历次 narrow 之后实际生效的完整 policy
```

多层收窄之后"到底允许什么"不要靠心算。测试里对 `explainPolicy()` 断言，比对着几层调用推导可靠。

## 八、误用一览

### 8.1 编译期就会失败的

```ts
withPolicy({ read: { scope: tenant } });
// 缺 create / update / delete

withPolicy({ read: {}, create: true, update: true, delete: true });
// read 节点缺 scope

withPolicy(projectPolicy);
// 函数形态缺 principal

withPolicy(async (p) => ({ ... }), principal);
// async 返回 Promise，不是 RepositoryPolicy

scopedRepo.withPolicy({ ... });
// ScopedRepository 上不存在 withPolicy（不能重复绑定）

conn.repository('projects').narrow({ ... });
// Repository 上不存在 narrow（不能在未绑定实例上收窄）
```

最后两条由类型分离挡住——`Repository` 只有 `withPolicy`，`ScopedRepository` 只有 `narrow`，两者共享操作方法基接口但互不为子类型。

### 8.2 编译能过、运行时报错的

```ts
withPolicy({ read: { scope: { tenantIdd: 'T1' } }, ... });
// → INVALID_POLICY: 字段不存在，path: ['read', 'scope']

withPolicy({ read: { scope: { 'owner.tenantId': 'T1' } }, ... });
// → INVALID_POLICY: scope 不支持关系路径

withPolicy({ read: { scope: { ownerId: '$actor.id' } }, ... });
// → INVALID_POLICY: scope 不支持 context 变量
```

### 8.3 不报错但是错的

```ts
// ✗ 模块级单例：第一个请求的身份会泄漏给后面所有请求
export const projects = conn.repository('projects').withPolicy({
  read: { scope: { tenantId: currentTenant } },
  ...
});
```

```ts
// ✗ 把 scope 当默认值用（其余节点略）
const policy = { read: { scope: { status: 'draft' } } };

await projects.findMany({ filter: { status: 'published' } });
// → []，两个条件是 AND 不是覆盖，永远查不出东西
```

```ts
// ✗ 注入得出来的字段又开放给调用方提交
create: { scope: { tenantId: 'T1' }, defaults: { tenantId: 'T1' }, fields: ['title', 'tenantId'] }
// 调用方传 tenantId: 'T2' → 写入后重判 → SCOPE_VIOLATION
// 挡得住，但白让调用方撞一次 403
```

```ts
// ✗ 关系节点漏了 scope 的效果（若允许省略）
relations: {
  tasks: {
    connect: {
    }
  }
}
// connect 能定位到任意 task，包括别的租户的
// 实际上 scope 在关系节点上必填，这里编译就过不去
```

# 速查

## Scope 怎么写

| 要表达             | 怎么写                                              |
| ------------------ | --------------------------------------------------- |
| 租户隔离           | `{ tenantId: 'T1' }`                                |
| 归属               | `{ tenantId: 'T1', ownerId: 'u1' }`                 |
| 状态限定           | `{ status: 'draft' }`                               |
| 空值               | `{ ownerId: null }`                                 |
| 不限行             | `scope: true`                                       |
| 多选一             | AST 的 `logic: 'or'` 展开成多个 `$eq`（没有 `$in`） |
| 数值区间           | AST 的 `$gte` + `$lte`                              |
| 日期条件           | AST 的 `$dateBefore` 等（简写不支持日期）           |
| 排除某值但包含空值 | AST 的 `$ne` OR `$empty`                            |
| JSON 内容          | 不支持，物化成标量列                                |
| 引用当前身份       | `withPolicy(fn, principal)`，不是 context 变量      |

相关文档：

- [Policy 设计](./policies.md)
- [Policy 示例说明](./policies-examples.md)
- [Policy 执行细节](./policies-internals.md)
- [Policy 实施清单](./policies-roadmap.md)
