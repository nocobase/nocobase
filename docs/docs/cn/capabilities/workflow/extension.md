---
title: '扩展'
description: '面向需要审核或扩展流程代码的开发者：扩展点、其他插件追加规则、订阅事件、接入已有数据表和 API 参考。'
keywords: 'NocoBase,工作流,扩展,插件,lifecycle,API'
---

# 扩展

本页面向需要审核或扩展 Agent 生成代码的开发者，日常开发流程不需要阅读。

流程由 `@nocobase/lifecycle` 实现。它的核心思路是：**单据本身就是流程**。单据的当前环节保存在单据自己的字段里，没有另外的“流程实例”，所以单据走到哪一步只记在一个地方。每次改变环节都是一个在源码中声明的操作（transition），在一个事务里检查条件、写入单据和办理记录；发通知、调用外部系统这些对外事项在事务提交后执行。

```ts
import { defineLifecycle, type Lifecycle } from '@nocobase/lifecycle';

export const ticketLifecycle: Lifecycle<TicketTypes> =
  defineLifecycle<TicketTypes>({
    name: 'tickets',
    initial: 'open',
    states: ['open', 'awaitingCustomer', { name: 'closed', final: true }],
    parameters: { waitHours: 72 },
    transitions: {
      replyToCustomer: {
        from: 'open',
        to: 'awaitingCustomer',
        effects: [notifyCustomer], // 提交后执行的对外事项
      },
      customerReplied: { from: 'awaitingCustomer', to: 'open' },
      close: { from: ['open', 'awaitingCustomer'], to: 'closed' },
    },
    triggers: {
      // 在 awaitingCustomer 停留超过 72 小时，由系统执行 close
      autoClose: {
        transition: 'close',
        when: 'awaitingCustomer',
        after: ({ waitHours }) => waitHours * 3_600_000,
      },
    },
  });
```

## 选择扩展点

扩展流程时先问一个问题：**这件事必须和这次办理一起成功吗？** 答案决定它写在办理的事务内还是事务后，以及失败时会怎样。

| 需要                               | 扩展点                                               | 何时执行       | 失败时                                      |
| ---------------------------------- | ---------------------------------------------------- | -------------- | ------------------------------------------- |
| 拒绝某个操作并说明原因             | `guard`；其他插件用 `runtime.addGuard()`             | 事务内，写入前 | 拒绝，原因合并显示                          |
| 和办理一起写入其他数据             | `set`（同一单据）；`onTransition`（其他表）          | 事务内         | 整次办理回滚                                |
| 进入或离开环节时建立或结束等待事项 | `onEnterState` / `onLeaveState`                      | 事务内         | 整次办理回滚                                |
| 一次办理多张单据                   | `runtime.transaction()`、`tx.fire()`、`tx.create()`  | 同一个事务     | 全部回滚                                    |
| 必须完成的对外事项                 | `effects` / `onEnter`                                | 提交后，可重试 | 按策略重试，最终失败后可由 `onFailure` 推进 |
| 刷新页面、待办、索引               | `runtime.on('completed' \| 'entered' \| 'announce')` | 提交后，尽力   | 记录日志，不重发                            |

事务内的扩展点不能访问数据库以外的东西：调用外部系统一律写成对外事项。

刻意不提供的能力：可视化设计器、嵌套环节和并行分支（用子单据代替）、可靠的事件投递（可靠性由对外事项负责）、迁移助手、权限（由应用的[权限](../authorization/index.md)负责）。

## 从其他插件增加规则

不修改流程本身，由另一个插件为指定流程的指定操作追加办理条件，例如风控插件冻结可疑客户的订单：

```ts
const remove = runtime.addGuard(
  'orders',
  ['ship'],
  async ({ record, services }) =>
    !(await services.risk.isSuspicious(record.customerId)) || {
      code: 'customerUnderReview',
      message: '客户正在风控审核中，暂不能发货',
    },
);
```

- 第二个参数是操作名列表，`'*'` 表示所有操作；返回的函数用来移除这个条件。
- 追加的条件在办理的事务内执行，可以读取其他表；它给出的原因和流程自己的原因一起显示。
- 只作用于操作，不作用于创建单据：谁能创建只由流程定义中的 `create.guard` 决定。
- 插件之间共享同一份流程运行时，所以 `@nocobase/lifecycle` 必须声明为 peer 依赖，由应用在 `dependencies` 中提供。

交给 Agent 时可以这样说：

```text
新增一个风控插件。客户被标记为可疑时，他的订单不能发货，并提示“客户正在风控审核中，暂不能发货”。不要修改订单插件中的流程。
```

## 订阅办理事件

```ts
const off = runtime.on(
  'completed',
  { lifecycle: 'orders', transition: 'ship' },
  (event) => {
    // 刷新索引、推送页面更新……
  },
);
```

| 事件        | 何时触发                                     | 典型用途     |
| ----------- | -------------------------------------------- | ------------ |
| `completed` | 每次操作或创建完成后一次，可按流程、操作过滤 | 同步索引     |
| `entered`   | 进入指定环节后，可按环节过滤                 | 刷新页面     |
| `announce`  | 新环节允许的每个操作各一次                   | 维护待办列表 |

事件在提交后尽力投递，失败只记录日志，不会重发。必须完成的工作写成对外事项。

## 环节内的多轮处理

单据停在一个环节时，可能还有多轮往来，例如“补充材料”期间申请人和审核员来回沟通。这些往来保存在专门的表中，不要拆成很多环节：

- 用 `onEnterState` 在进入环节时建立往来记录，用 `onLeaveState` 在离开时结束它们，两者都在办理的事务内。
- 往来结束时，在同一个事务中推进单据（`runtime.transaction()` 中先写往来记录，再 `tx.fire()`）。
- 已经结束的往来收到迟到的回复时拒绝。

## 接入已有数据表

流程默认使用单据表中的三个字段，可以在流程定义中改名：

| 字段             | 默认名称           | 用途                       |
| ---------------- | ------------------ | -------------------------- |
| `stateField`     | `status`           | 当前环节                   |
| `changedAtField` | `statusChangedAt`  | 进入当前环节的时间         |
| `versionField`   | `lifecycleVersion` | 每次办理加一，防止并发覆盖 |

另外需要两张表：办理记录（`lifecycleTransitions`）和对外事项的执行记录（`lifecycleEffectRuns`）。`@nocobase/lifecycle` 不自带迁移，由拥有流程的插件在自己的迁移中建表，可参照 `packages/examples/*/database/migrations/` 中示例插件的写法。

接入已有表的步骤：

1. 用迁移补齐缺少的列和两张表。
2. 确定已有数据各自对应哪个环节。
3. 收口原来直接修改环节字段的表单、导入和接口，之后环节只能通过操作改变。

```text
应用里已有合同表，合同状态字段目前由表单直接修改。请为它接入流程：先列出所有直接修改这个字段的地方和现有数据中各状态的数量，给出把已有合同对应到新流程环节的方案；确认后再实现，并让表单不能再直接修改合同状态。
```

## API 参考

### 说法对照

| 流程中的说法 | 代码中的名称          | 说明                                     |
| ------------ | --------------------- | ---------------------------------------- |
| 流程         | `lifecycle`           | 一类单据的完整流程定义                   |
| 环节         | `state` / `final`     | 单据所在的环节，保存在单据自己的字段里   |
| 操作         | `transition`          | 一次有名字的办理，页面上的一个按钮       |
| 办理条件     | `guard` / `blocker`   | 谁、在什么情况下能办，以及办不了的原因   |
| 必填信息     | `validate` / `accept` | 办理时的输入校验，以及直接写入单据的输入 |
| 分支         | `route`               | 同一个操作按条件去不同环节               |
| 随办理写入   | `set`                 | 和环节在同一次更新中写入的其他字段       |
| 对外事项     | `effect` / `onEnter`  | 办理提交后执行、可重试的通知和外部调用   |
| 时限         | `trigger`             | 单据在环节停留太久时自动执行的操作       |
| 流程数值     | `parameters`          | 流程中使用的时限、金额标准等数值         |
| 办理记录     | transition log        | 每次办理的人、时间、前后环节和输入       |
| 系统         | `system` actor        | 时限和对外事项结果触发的办理人           |

只允许服务端执行的操作（例如外部回调、系统修正数据）在定义中写 `manual: false`，页面上不会出现，从页面接口调用会被拒绝。

### 包入口

| 入口                          | 提供                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `@nocobase/lifecycle`         | `defineLifecycle`、`defineEffect`、`LifecycleRuntime`、存储实现、`toMermaid`（流程图） |
| `@nocobase/lifecycle/jobs`    | `createLifecycleJobs()`：在后台任务上执行对外事项，并定期检查时限                      |
| `@nocobase/lifecycle/react`   | `createLifecycleHook()`：页面读取单据、可办操作并执行办理                              |
| `@nocobase/lifecycle/testing` | `createLifecycleTestKit()`：内存存储和可快进的时钟，时限和重试都能写成单元测试         |

依赖声明：插件把 `@nocobase/lifecycle` 声明为 peer 依赖，应用在 `dependencies` 中提供。库本身不提供 HTTP 路由，路由由插件在自己的命名空间下编写。

### 运行时常用方法

| 方法                                                | 作用                                                          |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `create()` / `fire()`                               | 创建单据 / 执行一次操作                                       |
| `available()` / `can()`                             | 列出可办操作 / 判断能否办理及原因                             |
| `view()` / `describe()` / `history()`               | 单据视图 / 流程描述 / 办理记录                                |
| `transaction()`                                     | 在一个事务中办理多张单据                                      |
| `addGuard()` / `on()`                               | 追加办理条件 / 订阅事件                                       |
| `listEffectRuns()` / `retryRun()` / `continueRun()` | 查看、重试、继续对外事项                                      |
| `runTriggers()` / `reclaim()` / `recover()`         | 检查时限 / 接管中断的事项 / 启动时恢复（通常由 `/jobs` 调用） |

### 错误码

办理被拒绝时抛出 `LifecycleError`，`lifecycleErrorFields()` 把它转成应用标准错误体的字段。常见的几种：

| 错误码           | HTTP 状态 | 含义                                     |
| ---------------- | --------- | ---------------------------------------- |
| `GUARD_REJECTED` | 403 / 400 | 办理条件不满足，`blockers` 给出原因      |
| `INVALID_STATE`  | 400       | 当前环节不允许这个操作                   |
| `INVALID_INPUT`  | 400       | 输入校验失败，`problems` 列出字段        |
| `CONFLICT`       | 409       | 单据已被他人处理，或页面已过期           |
| `NOT_MANUAL`     | 403       | 从页面调用了只允许服务端执行的操作       |
| `REQUEST_REUSED` | 400       | 同一个请求 ID 已用于这张单据的另一次办理 |
