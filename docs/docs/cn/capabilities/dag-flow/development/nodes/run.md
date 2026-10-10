---
title: 'Run 节点'
description: '使用 Run 节点执行类型化业务动作并向后续节点提供结果。'
keywords: 'NocoBase,工作流,Run 节点,业务服务'
---

# Run 节点

Run 节点执行随工作流包发布的服务端模块，适合计算、数据读写或调用应用 Service。它负责一个可完成的业务动作，不能决定流程分支或暂停后恢复。

## 定义 Run 节点

```ts
RunInstruction.create({
  key: 'calculateRisk',
  title: '计算风险',
  config: {
    module: './server/calculate-risk',
    args: {
      quotationId: '{{$input.quotationId}}',
      amount: '{{$input.amount}}',
    },
  },
  result: {
    type: 'object',
    required: ['score'],
    properties: { score: { type: 'number' } },
    additionalProperties: false,
  },
});
```

`module` 必须是以 `./` 开头、无扩展名的静态包内路径，不能包含变量模板。`args` 是可选 JSON 对象，执行前会解析其中的输入、参数和节点结果模板。

## 编写运行模块

```ts
import type {
  WorkflowRunFunction,
  WorkflowRunJsonValue,
} from '@nocobase/app-plugin-workflow';

interface CalculateRiskArgs {
  quotationId?: unknown;
  amount?: unknown;
}

export const run: WorkflowRunFunction = (
  rawArgs: unknown,
  options,
): WorkflowRunJsonValue => {
  options.signal.throwIfAborted();
  const args = rawArgs as CalculateRiskArgs;
  if (typeof args.quotationId !== 'string' || typeof args.amount !== 'number') {
    throw new Error('quotationId and amount are required.');
  }

  const result = { score: args.amount };
  options.logger.info('Quotation risk calculated', {
    quotationId: args.quotationId,
  });
  return result;
};
```

模块必须导出名为 `run` 的函数。第二个参数只提供：

- `services`：只读应用 Service 解析器；
- `signal`：当前工作流的取消信号；
- `logger`：已绑定当前运行上下文的日志器。

## 调用应用 Service

从 Service 所属包导入原始公开 token，再使用 `options.services.resolve(token)`。不要创建一个同名 token，也不要绕过只读解析器去修改应用容器。

具体 token 和方法取决于目标应用，因此 Agent 必须先检查真实 Service 合同。数据写入、事务和外部协议应继续由该 Service 拥有，Run 模块只负责校验参数并调用它。

## 返回节点结果

允许返回 `null`、布尔、有限数字、字符串、数组或普通 JSON 对象；`undefined` 会存为 `null`。若后续节点需要引用结果，在节点定义中提供准确的 `result` Schema。

返回 `{ status: 'failed' }` 只是普通成功数据，不会让节点失败。需要表示执行错误时抛出异常；可预期的业务结果也可以作为结构化数据返回，再由 Condition 判断。

## 日志和取消

使用 `options.logger` 记录必要的业务定位信息，不记录密码、令牌或完整敏感数据。脚本应在开始和耗时步骤之间调用 `throwIfAborted()`，并把 signal 传给支持取消的 I/O。

取消无法自动撤销已经提交的数据库事务、已发送的消息或外部请求。

## 设计幂等副作用

Run 节点可能因业务恢复再次执行。创建记录时使用稳定业务 ID、唯一约束或幂等 Service；调用外部系统时使用其幂等键。不要只依赖工作流 eventKey，因为它只控制流程调用身份。

## 常见问题

### 返回失败对象为什么不会使节点失败

Run 返回值属于业务数据，运行时不会解释其中的 `status` 字段。抛出异常才表示节点执行错误。

### 为什么运行时找不到模块或 run 导出

确认模块路径以 `./` 开头、不带扩展名，文件被应用服务端构建输出到相同相对位置，并且提供 `export const run`。

### 为什么节点结果无法保存

检查是否返回 BigInt、非有限数字、循环对象、函数、Symbol、Date、Map 或 ORM 模型。先转换为普通 JSON 数据。
