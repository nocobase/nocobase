---
title: Write policy：字段与关系写入白名单
description: 使用服务端 writePolicy 限制调用方可写字段、关系操作、嵌套记录和 through payload；HTTP 路由已改由 Policy 承担这件事。
---

# Write policy：字段与关系写入白名单

> **`defineRepositoryApiRoutes()` 不再接受 `writePolicy`。** HTTP 路由上的字段与关系白名单已由每个 exposure 必填的 Policy 承担，见 [Policy 快速开始](./policy-quick-start.md)。本页描述的是**方法级**选项，它仍然有效，用于内部调用的单次额外收窄。
>
> 只需要限制**字段和关系形状**、且是在内部调用里临时收窄时用本页。还需要限制**能碰哪些行**（多租户隔离、数据归属、可见范围）时用 Policy——它把两个问题一起回答，并且绑在实例上而不是逐次调用传入。两者可以并存：绑定 Policy 之后，方法级 `writePolicy` 仍作为本次调用的额外收窄生效。

`writePolicy` 是**服务端配置**，限制一次 mutation 中调用方提交的字段和关系操作。支持对象和同步 callback builder；前端 Repository、前端 options builder 和 HTTP 请求都不接受这个参数。前端提交 `values`，后端决定这些值能否写入。

## 默认值与适用范围

| 使用位置                                        | 缺失时 | 允许的显式配置                                                |
| ----------------------------------------------- | ------ | ------------------------------------------------------------- |
| 内部 `createOne / updateOne / validateMutation` | `true` | `true`、`false`、策略对象、callback                           |
| 内部 `upsertOne`                                | `true` | `true`、`false`、独立的 `create / update` 策略、分支 callback |
| 内部 `createMany / updateMany`                  | `true` | `true`、`false`、仅含 `fields` 的策略、字段 callback          |

API routes 不再有这一行：`defineRepositoryApiRoutes()` 的 action 配置里没有 `writePolicy`，写入由 exposure 的 Policy 授权。

`true` 表示不增加字段和关系白名单限制，原有 Schema、只读字段、关系归属、乐观锁和数据库约束仍然生效。

`false` 拒绝整次写入，包括 `values: {}`，并在求值 values callback 前返回 `WRITE_FORBIDDEN`。

`{}` 表示空白名单：`fields` 和 `relations` 均为 `false`。调用方不能提供字段或关系写入，但空 values 可以触发数据库默认值或自动生成字段；它与禁止整个操作的 `false` 不同。

读取及根级 `deleteOne / deleteMany` 不使用 `writePolicy`。关系中的 `delete` 需要单独授权。API 上的删除由 Policy 的 `delete` 节点决定，声明 `deleteOne: {}` 只是开放端点。

## 字段和关系规则

```ts
const writePolicy = {
  fields: ['name', 'status'],
  relations: {
    tasks: {
      create: {
        fields: ['id', 'title'],
        relations: { assignee: { connect: {} } },
      },
      update: {
        fields: ['title', 'completed'],
        relations: { assignee: { connect: {}, disconnect: {} } },
      },
      upsert: {
        create: { fields: ['id', 'title'] },
        update: { fields: ['title'] },
      },
      connect: {},
      disconnect: {},
      set: {},
      delete: {},
    },
    tags: {
      create: { fields: ['id', 'label'], through: { fields: ['role'] } },
      connect: { through: { fields: ['role'] } },
      set: { through: { fields: ['role'] } },
    },
  },
};
```

上例用于说明规则形状，字段和关系名需与实际 Collection 一致。

- `fields` 可省略，省略或 `false` 均禁止调用方提供普通字段；`[]` 也是空白名单。只接受直接字段名，不支持 `*` 或点路径。
- 外键直接赋值同样受 `fields` 控制。例如允许 `owner.connect` 不等于允许 `ownerId`。如果同时开放 `ownerId`，调用方可以直接写外键。
- JSON 按整个字段控制；数字字段的 `increment / decrement / multiply / divide` 也按该字段控制。此策略不限制 JSON 子路径或某一种数值操作。
- `relations` 可省略，省略或 `false` 禁止所有显式关系操作。每个关系逐项声明 `create / update / upsert / connect / disconnect / set / delete`；缺失的操作禁止。
- 每个 `create / update` 节点都有独立的 `fields / relations`。上级字段和关系授权不继承，不合并。嵌套节点不接受 `true`。
- `upsert` 是独立操作，仅开放 `create` 和 `update` 不会开放 `upsert`。其两个分支必须同时声明，并在执行前同时检查，不因数据库最终选择某个分支而跳过另一分支。
- `connect / disconnect / set / delete` 的选择器用于定位记录，不是字段写入，不需要把定位键加入 `fields`。关系范围和唯一定位校验仍然生效。
- `through` 只用于多对多关系的 `create / connect / set`，独立控制中间表 payload。缺失或 `false` 禁止显式 through payload（包括空对象）；声明 `{ fields: ['role'] }` 只允许写 `role`。关联键、主键等托管字段不能在 through 白名单中开放。
- Repository 自动填入的关联键、版本及数据库默认值不要求白名单；调用方显式提供的值仍受白名单和原有字段可写性限制。

`createOne` 以及任何 create 分支中的关系只支持 `create / connect`。策略不能让 Repository 原本不支持的操作变得可用。策略中的不存在字段、关系或不合法结构也会报错，即使当前 values 没有使用它们。

## Callback builder

对象是策略的标准结构，builder 是同一结构的语法糖。只有 `writePolicy` 使用 callback，`actions` 保持对象。

```ts
import { buildWritePolicy } from '@nocobase/db';

const updatePolicy = buildWritePolicy((write) =>
  write
    .fields('name', 'status')
    .relation('tasks', (tasks) =>
      tasks
        .create((task) =>
          task.fields('id', 'title').relation('assignee', (a) => a.connect()),
        )
        .update((task) =>
          task
            .fields('title', 'completed')
            .relation('assignee', (a) => a.connect().disconnect()),
        )
        .upsert((branches) =>
          branches
            .create((task) => task.fields('id', 'title'))
            .update((task) => task.fields('title')),
        ),
    )
    .relation('tags', (tags) =>
      tags.connect((edge) => edge.through((through) => through.fields('role'))),
    ),
);

await db.repository('projects').updateOne({
  filter: { id: 'project-1' },
  values: { name: 'Updated' },
  writePolicy: updatePolicy,
});
```

也可以直接写 `writePolicy: (write) => write.fields('name')`。每个 callback 必须同步返回收到的 builder，不接受 async 或其他 builder。重复声明 fields、同名关系、同一个操作或 upsert 分支会报错，避免隐式覆盖或合并。

`buildWritePolicy` 返回脱离输入的深度冻结对象。API routes 在声明时执行 callback 一次并保存快照；内部 Repository 在每次调用时构建快照，早于 values 求值。callback 用于构建规则，不是读取用户或请求上下文的授权 hook。

## 根级 upsert 与批量写入

```ts
import { buildUpsertWritePolicy } from '@nocobase/db';

await db.repository('projects').upsertOne({
  filter: { id: 'project-1' },
  create: { id: 'project-1', name: 'Created' },
  update: { name: 'Updated' },
  writePolicy: buildUpsertWritePolicy((branches) =>
    branches
      .create((write) => write.fields('id', 'name'))
      .update((write) => write.fields('name')),
  ),
});

await db.repository('projects').createMany({
  values: [{ id: 'project-2', name: 'Created' }],
  writePolicy: (write) => write.fields('id', 'name'),
});
```

根级 upsert 也接受 `{ create: { fields: [...] }, update: { fields: [...] } }` 或直接分支 callback。批量方法仅接受字段策略，仍不支持嵌套关系 mutation；所有输入行先检查，通过后才开始写入。

## HTTP API 配置

```ts
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';

const routes = defineRepositoryApiRoutes({
  repositories: [
    {
      name: 'projects',
      actions: {
        findMany: { maxLimit: 100 },
        findOne: {},
        count: {},
        exists: {},
        createOne: {
          writePolicy: (write) =>
            write
              .fields('id', 'name', 'status')
              .relation('tasks', (tasks) =>
                tasks.create((task) =>
                  task
                    .fields('id', 'title')
                    .relation('assignee', (a) => a.connect()),
                ),
              ),
        },
        updateOne: {
          writePolicy: (write) =>
            write
              .fields('name', 'status')
              .relation('tasks', (tasks) =>
                tasks.update((task) =>
                  task
                    .fields('title', 'completed')
                    .relation('assignee', (a) => a.connect().disconnect()),
                ),
              ),
        },
      },
    },
  ],
});
```

省略某个 action 不注册该接口；`createOne: {}` 会注册接口，但由于策略默认为 `false`，不能写入。API 显式注入服务端策略，不会落到内部 Repository 的 `true` 默认值。请求体中的 `writePolicy` 一律拒绝。

## 失败与职责边界

全部字段和关系树在数据库写入前检查，不会静默删除未授权字段或先写部分记录。`validateMutation` 使用同一套规则，可提前返回相同诊断。

| 错误码                     | 含义                                   |
| -------------------------- | -------------------------------------- |
| `INVALID_WRITE_POLICY`     | 服务端策略结构、字段名或关系配置不合法 |
| `WRITE_FORBIDDEN`          | 整次写入被 `false` 禁止                |
| `FIELD_WRITE_FORBIDDEN`    | 普通字段或 through payload 超出白名单  |
| `RELATION_WRITE_FORBIDDEN` | 关系操作未获授权                       |

后三种是调用方的请求越权，`/api` 路由返回 403，并在 `metadata` 中携带 `path / details` 定位字段或关系操作，修改输入或服务端规则后才能重试。`INVALID_WRITE_POLICY` 则是服务端配置错误，调用方改请求也修不好，`/api` 路由按不透明的 500（reason 为 `INTERNAL_ERROR`）返回，不暴露 message 和 details。

写入时只报告第一处问题并抛出 `INVALID_WRITE_POLICY`。管理员在界面上配置的字段清单这类会被保存下来的策略，应在保存时用 `writePolicyProblems(collections, collection, policy)` 检查：它执行与写入相同的校验，返回每一处问题的 `{ path, message }` 而不是抛出，可以直接转成 400 的字段错误。需要列出可选字段时用 `writableFields(collection)`，它返回一次写入可以提交的标量字段，排除自增、生成列和乐观锁版本字段；`isManagedField(collection, field)` 判断单个字段是否由数据库或 Repository 赋值。

`writePolicy` 限制写入形状，不代替用户认证、角色权限、行级权限、关系目标访问权限或读取字段控制。直接访问中间表需要该接口自身的字段策略和授权；数据库外键级联仍由 Schema 决定。手写 HTTP handler 调用内部 Repository 时，应显式传入服务端白名单，不能把不受信任的请求 options 整体展开给默认放行的内部方法。
