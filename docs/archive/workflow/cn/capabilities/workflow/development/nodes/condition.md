---
title: 'Condition 节点'
description: '使用 Condition 节点根据输入、参数或前置节点结果选择执行路径。'
keywords: 'NocoBase,工作流,Condition 节点,分支'
---

# Condition 节点

Condition 节点执行一个随工作流包一起发布的处理模块，模块返回 `true` 时进入 `yes` 分支，返回 `false` 时进入 `no` 分支。它适合表达明确的业务决策，不负责执行数据写入。

## 定义条件与分支

```ts
const needsApproval = createConditionInstruction({
  key: 'needsApproval',
  title: '是否需要人工处理',
})
  .check(needsApprovalHandler)
  .yes([
    createRunInstruction({ key: 'recordManualReview' }).run(
      recordManualReviewHandler,
    ),
  ])
  .no([
    createRunInstruction({ key: 'recordAutoApproval' }).run(
      recordAutoApprovalHandler,
    ),
  ]);
const completeFlow = flow.addNode(needsApproval);
```

条件本身有内置布尔结果，因此后续节点可以通过 `needsApproval.output` 引用选择结果，它会被降级为 `{{$nodeResults.needsApproval}}`。两个分支都可以省略。

## 编写判断模块

判断模块导出名为 `run` 的函数，接收 `{ input, parameters, nodeResults }` 三个只读快照，必须返回布尔值：

```ts
import type { FlowContext } from '../workflow.js';

export function run({ nodeResults, parameters }: FlowContext): boolean {
  const risk = nodeResults.calculateRisk;
  const limit = parameters.approvalLimit;
  return risk !== undefined && typeof limit === 'number' && risk.score > limit;
}
```

共享 `FlowContext` 从整个工作流推导节点结果类型，声明方式见 [处理函数的整体上下文类型](../dsl.md#处理函数的整体上下文类型)。所有结果都可能尚未产生，必须处理 `undefined`；不需要手写上游返回类型或断言。

判断逻辑是普通 TypeScript，和工作流包其余代码一起通过类型检查，可以单独写单元测试，也没有表达式语言的操作符、深度和参数个数限制。代价是阅读条件需要打开对应模块：定义里记录的是由哪个模块决定，而不是判断规则本身。

`config.module` 与 Run 节点遵循同一套约束：必须是静态、不含扩展名、以 `./` 开头的包内相对路径，且不能包含模板。

## 分支结束后的共同后继

Condition 后面同级的节点是两个分支的共同后继。选中的分支走完后会继续执行它；未选中的分支不会运行。分支可以省略。

如果选中分支中执行了 Terminate，则整个流程立即结束，不会回到共同后继。

## 示例：库存补货

```ts
flow.addNode(
  createConditionInstruction({
    key: 'needsReplenishment',
    title: '是否需要补货',
  })
    .check(needsReplenishmentHandler)
    .branch({ yes: [createReplenishment], no: [recordStockSufficient] }),
);
```

`calculateShortage` 的返回类型应包含数值 `quantity`，共享上下文会自动收集该结果类型。运行时必须先产生结果才能读到值；上下文类型不校验执行顺序，读取时仍需处理 `undefined`，无需为此声明运行时结果 Schema。

## 常见问题

### 为什么判断模块必须返回布尔值

分支选择只有 yes/no 两种语义。返回数字、字符串或 `null` 会报错，不会按 JavaScript truthy/falsy 隐式转换。

### 为什么流程进入了意外分支

查看该次运行保存的输入快照、参数快照和 Condition 节点结果，不要用当前设置推断历史运行。再打开该版本 `config.module` 指向的判断模块确认判断逻辑。

### 为什么一个分支不能读取另一个分支的结果

工作流采用树形词法可见性。兄弟分支并不同时执行，允许跨分支引用会让结果在某些路径上不存在。
