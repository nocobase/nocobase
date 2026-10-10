---
title: '工作流定义 DSL'
description: '定义工作流输入、管理员参数、节点顺序、条件分支和节点结果引用。'
keywords: 'NocoBase,Workflow DSL,defineWorkflow,inputSchema,parameters'
---

# 工作流定义 DSL

NocoBase 3 使用 TypeScript DSL 描述工作流。DSL 只表达可版本化的流程结构和合同；查询、写入、计算及外部调用放在 Run 模块或应用 Service 中。

## 工作流源码包

默认应用从 `workflows` 读取工作流。其每个直接子目录是一个工作流包：

```text
workflows/quotation-decision/
├── workflow.ts
└── server/
    ├── calculate-risk.ts
    └── record-decision.ts
```

目录名是业务代码调用工作流时使用的稳定 key。`workflow.ts` 是声明入口，`server/` 保存 Run 节点引用的资源。标题可以调整；目录名和节点 key 在业务含义不变时应保持稳定。

## 最小定义示例

```ts
import {
  defineWorkflow,
  RunInstruction,
  type WorkflowSourceAst,
} from '@nocobase/app-plugin-workflow';

const workflow: WorkflowSourceAst = defineWorkflow({
  title: '记录报价提交',
  inputSchema: {
    type: 'object',
    required: ['quotationId'],
    properties: {
      quotationId: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
  nodes: [
    RunInstruction.create({
      key: 'recordSubmission',
      title: '记录报价提交',
      config: {
        module: './server/record-submission',
        args: { quotationId: '{{$input.quotationId}}' },
      },
    }),
  ],
});

export default workflow;
```

必须先把结果绑定到显式标注为 `WorkflowSourceAst` 的常量，再默认导出。默认应用开启 `isolatedDeclarations`，直接写 `export default defineWorkflow(...)` 会导致 `TS9037`。

## 顶层定义

| 字段          | 是否必需 | 用途                             |
| ------------- | -------- | -------------------------------- |
| `title`       | 是       | 管理界面显示的名称               |
| `description` | 否       | 向管理员解释业务目的             |
| `inputSchema` | 否       | 每次调用输入；省略时默认为对象   |
| `parameters`  | 否       | 管理员可以覆盖的标量配置         |
| `nodes`       | 是       | 按执行顺序排列的节点，可为空     |
| `options`     | 否       | 仅使用运行时明确支持的工作流选项 |

顶层没有 `trigger`、`start`、节点 Map 或边列表。业务事件从定义外部调用 Service API。

当前运行时支持在顶层 `options` 中设置工作流整体超时：

```ts
options: { timeout: 30 }, // 单位：秒
```

Run 节点上的 `options.timeout` 目前不会被运行时作为独立的节点计时器执行。

## 定义每次运行的输入

`inputSchema` 根必须是对象。当前支持常见 JSON Schema 子集：

- 类型：`null`、`boolean`、`number`、`integer`、`string`、`array`、`object`；
- 结构：`properties`、`required`、`additionalProperties`、`items`；
- 限制：`enum`、`const`、数值上下限、字符串和数组长度；
- 元数据：`$schema`、`title`、`description`。

不支持 `$ref`、`$dynamicRef`、`format` 和 `$async`。省略 `additionalProperties` 时，运行时按不允许额外字段处理。输入必须是 JSON 对象，序列化后最多 65,536 字节。推荐传业务 ID，不要传完整模型、文件或秘密。

### 输入与管理员参数有什么区别

输入描述本次事件，例如报价 ID 和金额；参数描述管理员配置，例如风险阈值。两者会在运行开始时解析为快照，之后修改管理员设置不会改变既有运行。

## 定义管理员参数

```ts
parameters: {
  approvalLimit: {
    type: 'number',
    title: '人工处理阈值',
    description: '报价金额超过此值时进入人工处理路径。',
    default: 100000,
  },
  strategy: {
    type: 'string',
    title: '评估策略',
    default: 'standard',
    enum: [
      { label: '标准', value: 'standard' },
      { label: '保守', value: 'conservative' },
    ],
  },
}
```

参数只支持 `string`、`number` 和 `boolean`。字符串和数字可以定义枚举；默认值必须类型一致并属于枚举。没有“必填参数”，管理员未覆盖时使用默认值，没有默认值时该值缺失。

## 编排顺序和条件分支

`nodes` 数组表示顺序。Condition 使用 `.branch()` 声明 `yes` 与 `no` 分支：

```ts
const completeFlow = flow
  .addNode(calculateRisk)
  .addNode(
    createConditionInstruction({
      key: 'needsReview',
      title: '是否需要人工处理',
    })
      .check(needsReviewHandler)
      .branch({ yes: [recordManualReview], no: [recordAutoApproval] }),
  )
  .addNode(recordCompletion);
```

任一分支走完后都会继续执行共同后继 `recordCompletion`。省略某个分支表示该分支无需额外步骤。判断由 `.check()` 指定的处理模块给出，它接收 `{ input, parameters, nodeResults }` 并返回布尔值，详见 [Condition 节点](nodes/condition.md)。当前拓扑不是任意流程图，不支持 `goto`、通用 join、循环或跨分支连线。

## 处理函数的整体上下文类型

连续调用 `addNode()` 并保留返回的 builder，才能累积节点类型；它不再返回被添加的节点。`finalize()` 与 `compile()` 校验处理函数的上下文需求，包括分支节点。原变量不会因为单独调用一次 `addNode()` 就自动获得新类型；丢弃 `addNode()` 的返回值后再对原 builder 调用 `finalize()` 会报错，并列出未被编译的节点。

从 `@nocobase/app-plugin-workflow/dsl` 导入 `ContextOf`，在工作流文件中逐项声明共享上下文，让处理函数通过 `import type` 引入：

```ts
export interface FlowContext {
  input: ContextOf<typeof completeFlow>['input'];
  parameters: ContextOf<typeof completeFlow>['parameters'];
  nodeResults: ContextOf<typeof completeFlow>['nodeResults'];
}
```

不要直接用 `type FlowContext = ContextOf<typeof completeFlow>` 替代这种逐项声明，否则工作流与处理函数之间可能形成类型推导循环。引用自身工作流上下文的处理函数应显式声明返回类型；各个节点的结果结构不需要在其他处理函数里重复声明。

`nodeResults` 包含整个工作流中已知的结果节点，包括嵌套分支，并保留字段类型。每个结果都可能是 `undefined`：允许读取后续节点或另一分支，但必须处理结果尚未产生的情况。这是静态类型检查，不保证执行顺序，也不会增加运行时输出 schema 或校验。TypeBox 提供精确的 input/parameters 类型，普通 JSON Schema 保留通用类型。下面的显式引用降级是另一套机制，仍有自身的顺序检查。

## 使用输入、参数和节点结果

在 Builder 中用类型化引用绑定取值，不要手写模板字符串。`finalize()` 会把每个引用降级成运行时解析的模板，并在此之前检查它属于当前工作流、且被引用的节点确实排在前面：

| 引用                            | 降级后的模板                           | 读取内容                   |
| ------------------------------- | -------------------------------------- | -------------------------- |
| `flow.input.quotationId`        | `{{$input.quotationId}}`               | 本次调用输入               |
| `flow.parameters.approvalLimit` | `{{$parameters.approvalLimit}}`        | 本次运行解析出的管理员参数 |
| `calculateRisk.output.score`    | `{{$nodeResults.calculateRisk.score}}` | 可见的上游节点结果         |

模板本身仍然是运行时合同：完整字符串只有一个模板时会保留原始类型，例如金额仍是数字；`Amount: {{$input.amount}}` 这样的插值结果始终是字符串。参数引用必须正好指向一个已声明的参数，不支持嵌套路径和内联默认值。

节点只能引用同一块中更早的节点，以及进入当前分支前可见的祖先结果。不能引用自身、后续节点、兄弟分支或藏在另一个分支内部的结果。

## 声明和使用节点结果

Run 默认没有结果合同。后续节点需要引用时，必须声明 `result`：

```ts
result: {
  type: 'object',
  required: ['score'],
  properties: {
    score: { type: 'number' },
  },
  additionalProperties: false,
}
```

支持标量、数组、对象和 `oneOf`。声明用于源码阶段验证引用路径，Run 模块仍需返回相符的 JSON 可存储值。`BigInt`、函数、Symbol、非有限数字、循环引用、Date、Map 和 ORM 模型实例不能作为结果。

## 节点标识与稳定性

所有节点 key 必须在整个工作流内全局唯一，符合 `^[A-Za-z_][A-Za-z0-9_-]*$`。不要使用 `__proto__`、`prototype` 或 `constructor`。标题和布局变化时保留 key，以维持历史诊断和结果引用的一致性。

## 完整示例

包含 Run、Condition、管理员参数和节点结果的完整结构可参考[Condition 节点示例](./nodes/condition.md)。实际创建时优先让应用 Agent 读取 Workflow Skill 和当前应用的 Service，再生成贴合业务的代码。

## 常见问题

### 为什么不能裸默认导出 defineWorkflow 调用

默认应用会为服务端源码生成声明，并启用 `isolatedDeclarations`。显式 `WorkflowSourceAst` 类型让当前文件可以独立生成声明。

### 为什么后续节点不能引用某个结果

检查源节点是否声明 `result`，引用路径是否符合 Schema，以及源节点在树形作用域中是否可见。运行时实际返回更多字段不会扩大编译期可见范围。

### 为什么数字经过模板后变成字符串

精确模板保留原类型，带其他文本的插值必然生成字符串。

### 为什么不能在定义中使用函数、Date 或类实例

定义需要确定性地构建为 JSON Artifact 并计算摘要。只能使用 JSON 兼容值。

### 为什么某些 JSON Schema 关键字不可用

工作流实现的是受控子集。以当前插件类型、检查器和 Workflow Skill 为准，不要假设完整 JSON Schema 实现。

## 仅导入 handler 类型

通过类型导入声明 handler，避免检查或加载定义时执行服务端模块及其依赖。泛型保留上下文与返回值类型，以及条件节点的布尔返回值约束；实际执行时仍按模块路径加载并调用 `run` 导出。类型导入与模块路径必须对应，当前不会自动校验两者的一致性。

```ts
import type { run as loadMetrics } from './server/load-metrics';

const loadMetricsHandler = defineHandler<typeof loadMetrics>(
  './server/load-metrics',
);
```
