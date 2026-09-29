---
title: 'Terminate 节点'
description: '使用 Terminate 节点从主路径或条件分支中提前结束工作流。'
keywords: 'NocoBase,工作流,Terminate 节点,提前终止'
---

# Terminate 节点

Terminate 节点在自身记录保存后立即结束整个 Workflow Run。它适合“无需继续，但这不是代码异常”的业务出口。

## 定义终止结果

默认以成功结果结束：

```ts
TerminateInstruction.create({
  key: 'stopIncompleteProfile',
  title: '资料不完整，结束处理',
  config: { outcome: 'success' },
});
```

`outcome` 只有 `success` 和 `failure`，省略时为 `success`。使用 `failure` 表示流程已经得到明确的业务失败结论；运行模块抛出的异常属于执行错误，两者含义不同。

## 在条件分支中终止

```ts
flow.addNode(
  createConditionInstruction({ key: 'canContinue' })
    .check(isProfileCompleteHandler)
    .branch({
      no: [
        createTerminateInstruction({ key: 'stopIncompleteProfile' }).outcome(
          'success',
        ),
      ],
    }),
);
flow.addNode(
  createRunInstruction({ key: 'openAccount' }).run(openAccountHandler),
);
```

资料不完整时，`openAccount` 不会执行。Terminate 不是“返回当前分支”，而是终止整个工作流。

## 终止、失败和错误的区别

- 成功终止：流程按预期提前结束；
- 失败终止：流程得出业务失败结论；
- 执行错误：节点代码、模块、基础设施或不可预期业务调用抛出异常。

Terminate 没有结果合同，也不能包含分支。

## 常见问题

### 工作流结束后为什么条件父节点仍可能显示 Pending

Terminate 可以在所选分支内部结束整个流程。父 Condition 尚未走完正常恢复步骤，因此节点摘要可能仍为 Pending；结合 Terminate 节点和整体运行终态判断，这不是卡死。

### Terminate 是否会撤销已经发生的业务操作

不会。它只停止后续节点。之前已提交的写入或外部调用仍然存在。

### 应该主动终止还是抛出错误

预期的业务出口使用 Terminate；代码无法完成承诺的动作或遇到不可预期异常时抛错。不要用成功终止隐藏真正的执行故障。
