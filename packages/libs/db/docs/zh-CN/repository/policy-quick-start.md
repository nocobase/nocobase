---
title: Policy 快速开始
description: 十分钟给 Repository 配上行范围与字段白名单：绑定 Policy、读取与写入的实际效果、越权的表现、四个最容易踩的坑。
---

# Policy 快速开始

`writePolicy` 回答的是**形状**问题：一次 mutation 能提交哪些字段和关系操作。它不回答**行**的问题：这次操作允许碰哪些记录。多租户隔离、数据归属、可见范围都落在后一个问题上，没有 Policy 时只能靠每个调用点自己记得把 `tenantId` 写进 `filter`——漏一处就是整张表对所有人可见。

Policy 把两个问题一起回答，并且绑在实例上而不是逐次调用传入。

> HTTP 路由这一侧已经完成迁移：`defineRepositoryApiRoutes()` 的每个 exposure 必须声明 `policy`，action 配置里不再有 `writePolicy`。方法级 `writePolicy` 作为**内部调用的单次额外收窄**仍然有效，见 [Write policy](./write-policy.md)。设计与取舍记在 [Policy 设计](../proposals/repository/policies.md)。

## 1. 绑一个 Policy

```ts
import { createDatabaseManager } from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';

const db = createDatabaseManager({
  default: 'main',
  connections: { main: sqlite({ filename: 'app.sqlite' }) },
});

const projects = db
  .connection()
  .repository('projects')
  .withPolicy({
    read: { scope: { tenantId: 'T1' }, fields: ['id', 'title'] },
    create: {
      scope: { tenantId: 'T1' },
      defaults: { tenantId: 'T1' },
      fields: ['title'],
    },
    update: { scope: { tenantId: 'T1' }, fields: ['title'] },
    delete: false,
  });
```

**四个节点必须全部写出来，写成对象就必须给 `scope`。** 缺一个是 TypeScript 编译错误，不是运行时的宽松默认。权限配置里最危险的形态是半句话——看起来配过了，review 时容易放过，而漏掉的那半句默认全开。不想限制就显式写 `true`，不想开放就显式写 `false`。

`fields` 和 `relations` 是白名单，**省略等于空白名单**，不是放开。

## 2. 读

```ts
await projects.findMany({});
// → [{ id: 'p1', title: 'Mine' }]   只有 T1 的记录，只有 read.fields 里的字段
```

- **scope 进 WHERE**，不是查出来再过滤。分页、游标、`distinct`、聚合、`groupBy` 全部在收窄后的范围上计算。
- **省略 `select` 返回 `read.fields`**，而不是全部字段。省略 select 表示「由服务端决定返回什么」。
- **显式请求越权字段会报错，不会静默裁剪**：

```ts
await projects.findMany({
  select: {
    kind: 'select',
    version: 1,
    root: { kind: 'selection', fields: ['budget'] },
  },
});
// ✗ FIELD_READ_FORBIDDEN
```

这条对**每一个提到字段名的地方**都成立，不只是 `select`：`filter`、`sort`、`distinct`、`cursor`、`groupBy.by`、`aggregate`、`having`，以及写方法的 returning `select`。原因是查询本身就在泄漏字段值——一次 `exists` 配上 `budget` 的范围条件不返回任何字段，却能二分出具体数值。

类型上也会跟着降级：绑定了 `read` 规则对象之后，返回类型是 `Partial<TRecord>`；`read: true` 才保留完整记录类型。

## 3. 写

```ts
await projects.createOne({ values: { title: 'New' } });
// tenantId 由 create.defaults 填上，调用方提交不了（不在 create.fields 里）

await projects.deleteOne({ filter: { id: 'p1' } });
// ✗ WRITE_FORBIDDEN   delete: false
```

关键的一条是**写入后的记录必须仍满足本次操作的 scope**，否则整个事务回滚：

```ts
const movable = repository.withPolicy({
  read: { scope: { tenantId: 'T1' }, fields: ['id', 'tenantId'] },
  create: { scope: { tenantId: 'T1' }, fields: ['id', 'tenantId'] },
  update: { scope: { tenantId: 'T1' }, fields: ['tenantId'] }, // tenantId 可写
  delete: { scope: { tenantId: 'T1' } },
});

await movable.updateOne({ filter: { id: 'p1' }, values: { tenantId: 'T2' } });
// ✗ SCOPE_VIOLATION   记录被推出了 update.scope，回滚
```

WHERE 只挡住「能碰哪一行」，挡不住「改完跑到哪去」。这一条单独就挡住了转移归属、越租户创建这类提权，所以**不需要「scope 字段不可写」之类的附加开关**——松紧完全由 scope 本身决定。

判定在数据库里做（事务内、行已锁定时发一条按主键的查询），因此与选中该行的 WHERE 子句在排序规则、NULL 语义、日期精度上必然一致。**写入没有触及 scope 引用的字段时整条判定跳过**，所以改 `title` 而 scope 是 `tenantId` 的常规路径不产生额外查询。

## 4. 越权长什么样

**scope 不匹配不产生错误码**，因为任何可区分的越权信号都是存在性预言机：拿 ID 逐个试，403 与 404 的差别就足以枚举出别的租户有哪些记录。

| 操作                            | 行存在但不在 scope 内          |
| ------------------------------- | ------------------------------ |
| `findOne`                       | `null`                         |
| `findMany` / `count` / `exists` | 不包含该行                     |
| `updateOne` / `deleteOne`       | `RECORD_NOT_FOUND`（HTTP 404） |
| `updateMany` / `deleteMany`     | 计入 0，不报错                 |

**与「记录不存在」逐字节相同。** 关系写入的目标越界同理。

真正会报错的是另一类——调用方看得见这条记录，只是提交的值或请求的形状不被允许：

| 错误码                     | 含义                                  | HTTP |
| -------------------------- | ------------------------------------- | ---- |
| `INVALID_POLICY`           | 策略结构、字段名或 scope 表达式不合法 | 500  |
| `READ_FORBIDDEN`           | 整次读取被 `read: false` 拒绝         | 403  |
| `FIELD_READ_FORBIDDEN`     | 显式请求的字段超出白名单              | 403  |
| `RELATION_READ_FORBIDDEN`  | 显式请求的关系未获授权                | 403  |
| `WRITE_FORBIDDEN`          | 整次写入被 `false` 拒绝               | 403  |
| `FIELD_WRITE_FORBIDDEN`    | 字段或 through payload 超出白名单     | 403  |
| `RELATION_WRITE_FORBIDDEN` | 关系操作未获授权                      | 403  |
| `SCOPE_VIOLATION`          | 写入后的记录不满足本次操作的 scope    | 403  |
| `RECORD_OUTSIDE_SCOPE`     | upsert 目标存在但不在 scope 内        | 409  |

`INVALID_POLICY` 是服务端配置错误，调用方改请求也修不好，因此 `/api` 路由按不透明的 500 返回，不暴露 message 和 details；其余错误返回表中状态码，并在 `metadata` 中携带 `path` 和 `details`。状态码由错误的 `status` 决定，见 [Repository API 的常见错误](../reference/repository-api.md#常见错误)。

## 5. 一次请求绑多张表

一次请求通常要用到多个 Collection，事务里还要重新取 Repository。绑在 Connection 上，两样一起解决：

```ts
const scoped = db.connection().withPolicies(
  {
    projects: projectPolicy,
    tasks: (principal: Principal) => taskPolicyFor(principal),
  },
  principal,
);

scoped.repository('projects'); // 已绑定
scoped.repository('users'); // 不在 map 里：返回未绑定实例
await scoped.transaction(async (tx) => tx.repository('projects')); // 事务内自动携带
```

三条契约：

- **principal 函数求值一次**，在绑定时调用，结果规范化并冻结。
- **`@nocobase/db` 对 principal 一无所知**，签名里就是个裸泛型；它只是把你给的东西原样传给你自己的函数。
- **带身份的实例不得跨请求共享**，不要挂到模块级单例上。

## 6. 关系

读和写各有一套，互不蕴含：

```ts
read: {
  scope: { tenantId: 'T1' },
  fields: ['id', 'title'],
  relations: {
    tasks: { scope: { tenantId: 'T1' }, fields: ['id', 'title'] },
  },
},
update: {
  scope: { tenantId: 'T1' },
  fields: ['title'],
  relations: {
    tasks: { scope: { tenantId: 'T1' }, connect: {}, disconnect: {} },
  },
},
```

`RelationWriteNode.scope` 回答「**能定位到哪些既有目标**」。没有它，根 scope 挡住了别人的 project，却挡不住把别人的 task `connect` 进自己的数据里。`create` 不需要 scope——新建目标的归属由关系键决定，必然落在发起方下面。

两条容易忽略的规则：

- **关系写入的授权完全由发起方的 `relations` 节点决定**，目标 Collection 自己的 Policy 不参与。给 `relations.tasks` 授权，就是在替 `tasks` 表做授权决定。
- **不做跨路径自动继承**：`projects` 的 `read.relations.tasks` 与 `tasks` 自己的 `read` 是两份独立声明。要复用就用 `ref()` 显式写出来：

```ts
import { ref } from '@nocobase/db';

const open = { scope: true } as const;

db.connection().withPolicies(
  {
    projects: {
      read: { scope: true, fields: ['id'], relations: { tasks: ref('tasks') } },
      create: open,
      update: open,
      delete: open,
    },
    tasks: {
      read: { scope: { tenantId: 'T1' }, fields: ['id', 'title'] },
      create: open,
      update: open,
      delete: open,
    },
  },
  principal,
);
```

`ref` 解析到**同一个 `withPolicies` map 的键**，在绑定时展开并检测环——成环、目标不在 map 里、目标的 `read` 不是规则对象，都在绑定那一刻报 `INVALID_POLICY`。

## 7. 收窄与检视

```ts
const readOnly = projects.narrow({ delete: false, update: false });
const mine = projects.narrow({ read: { scope: { ownerId: actor.id } } });
```

scope 取 AND，`fields` 取交，`relations` 递归取交，任一侧为 `false` 则结果为 `false`。**没有任何写法能放宽。** 未提到的成员保持原样；提到了就取交，所以 `relations: {}` 是「一个都不要」而不是「不变」。

多层收窄之后「到底允许什么」不该靠推理：

```ts
projects.explainPolicy();
// → 归并 withPolicy 与历次 narrow 之后实际生效的完整 policy
```

测试里对 `explainPolicy()` 断言，比对着几层调用心算可靠。

## 8. HTTP

在 exposure 上声明，必填，管这个 exposure 的全部 action；请求体里传不进来：

```ts
defineRepositoryApiRoutes({
  repositories: [
    {
      name: 'projects',
      collection: 'projects',
      policy: projectPolicy,
      actions: { findMany: {}, createOne: {}, updateOne: {} },
    },
  ],
});
```

要按调用方收窄，把 `policy` 写成一个吃 principal 的函数，并给出解析器：

```ts
defineRepositoryApiRoutes<Session>({
  principal: (context) => context.get('auth'),
  repositories: [
    {
      name: 'projects',
      policy: (session) => ({
        read: { scope: { ownerId: session.userId }, fields: ['id', 'title'] },
        create: {
          scope: { ownerId: session.userId },
          defaults: { ownerId: session.userId },
          fields: ['title'],
        },
        update: { scope: { ownerId: session.userId }, fields: ['title'] },
        delete: false,
      }),
      actions: { findMany: {}, createOne: {}, updateOne: {} },
    },
  ],
});
```

解析器是应用自己的——这组路由不做认证，也不知道请求怎么携带身份。它每个请求跑一次，返回 `undefined` 或 `null` 时请求直接 403 `PRINCIPAL_REQUIRED`，而不是拿一个不存在的 principal 去构造 Policy。声明了函数却没给解析器，定义路由时就报错。

两种写法的检查时机不同：固定 Policy 在**定义路由时**规范化，配错了当场报错；函数做不到，它每个请求才求值，校验也跟着推迟到第一个打进来的请求。那种失败是 `INVALID_POLICY`，交给宿主错误处理器按服务端错误返回，而不是 400——Policy 是服务端拥有的，配错了不是调用方的问题。

请求体里出现 `policy` 或 `scope` 一律 400 `UNSUPPORTED_REPOSITORY_OPTION`。`ref()` 在这条路径上定义期就被拒绝：引用要靠 `withPolicies` 的那张 map 展开，而这里是每个 exposure 绑一份。

写起来啰嗦的话用 `buildRepositoryPolicy`，没提到的节点就是 `false`：

```ts
import { buildRepositoryPolicy } from '@nocobase/db';

const projectPolicy = buildRepositoryPolicy(
  (policy) =>
    policy
      .read((read) => read.scope({ tenantId: 'T1' }).fields('id', 'title'))
      .update((update) => update.scope({ tenantId: 'T1' }).fields('title')),
  // create 和 delete 没提到，等于 false
);
```

代价是字面量类型没了，`withPolicy` 的返回类型一律降级成 `Partial<TRecord>`。要那份精度就把对象写出来。

## 四个容易踩的坑

**1. 以为省略 `fields` 是「不限制」。** 省略是空白名单。想放开某个字段必须写进去；想表达「一个都不允许」可以写 `false` 或 `[]`。

**2. 以为 scope 能自动填进新记录。** 不能。`create.scope` 只负责**判定**，赋值要写 `create.defaults`。两者分开是有意的：scope 写多复杂都行，赋值照常工作，而且 `defaults` 能设 scope 里没有的字段（`createdBy`、`source`）。

配合 `fields` 组合出四种行为，第一行才是租户隔离要的：

| `defaults` | 在 `fields` 里 | 效果                                   |
| ---------- | -------------- | -------------------------------------- |
| 有         | 否             | **强制赋值**，调用方提交同名字段被拒绝 |
| 有         | 是             | **真正的默认值**，可覆盖，覆盖后受重判 |
| 无         | 是             | 调用方自己提供，否则走数据库默认值     |
| 无         | 否             | 完全由数据库默认值决定                 |

**3. scope 里写关系路径。** `{ 'owner.tenantId': 'T1' }` 会在绑定时报 `INVALID_POLICY`。scope 只认本表的直接标量字段，JSON 操作符同样拒绝。替代做法是把归属物化到本表，或在 service 层拆成两段查询。

**4. `create.scope` 引用了一个这次 create 永远赋不上值的字段。** 比如 scope 读 `status`，而 `status` 既不在 `create.fields` 里、也不在 `create.defaults` 里、Collection 上也没有默认值——这个 create 永远不可能成功。这种配置在 Collection 解析时就报 `INVALID_POLICY`，不会拖到每次调用都插入、重判、回滚。

## 下一步

- [Policy 参考](../proposals/repository/policies-reference.md)：四个节点的每个参数、scope 的完整语法、绑定与收窄的每种写法。
- [Policy 示例说明](../proposals/repository/policies-examples.md)：从没有 Policy 的现状出发，逐层加入每个概念。
- [Policy 设计](../proposals/repository/policies.md)：三条不变量与各项规则的取舍理由。
- [Write policy](./write-policy.md)：方法级的额外收窄。
