---
title: '检查、构建与诊断'
description: '检查工作流源码和运行模块，构建发布版本，并根据运行证据诊断异常。'
keywords: 'NocoBase,工作流检查,workflow check,Artifact,诊断'
---

# 检查、构建与诊断

工作流从源码到运行需要经过定义检查、应用编译、Artifact 构建、运行时加载和版本启用。每个阶段验证的边界不同，不能相互替代。

Commands below run from the initialized application root. `workflow check` is the subcommand name; the complete invocation is `pnpm nocobase workflow check <package>`. For custom node types, use the checker/build entry in [Service API](./service-api.md#custom-instructions), which supplies the extension contracts. Configure the application in `config.yml`.

## 检查工作流定义

在应用根目录运行：

```bash
pnpm nocobase workflow check workflows/<workflow-directory>
```

检查按顺序执行五个阶段：

1. `typecheck`：使用严格 NodeNext 和 source export condition 检查 TypeScript；
2. `evaluate`：在受限临时进程中加载声明文件，读取默认 AST；
3. `schema`：检查输入、参数、节点配置、条件和结果 Schema；
4. `semantic`：检查节点类型、key、分支、参数和结果引用可见性；
5. `compile`：检查树形拓扑是否完整、可达且无环。

它不会加载 Run 模块，也不会写数据库。出现问题时按阶段从前往后修复，不要跳过错误继续发布。

加 `--ir` 可以直接打印编译后的扁平 IR，也就是 Artifact 中 `workflow.json` 承载的那份定义：

```bash
pnpm nocobase workflow check workflows/<workflow-directory> --ir
```

## 检查运行模块和应用集成

Run 模块由应用的普通服务端构建处理，因此还要运行应用要求的验证：

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

根据修改范围执行目标应用的实际脚本。重点验证：模块路径存在、提供命名 `run` 导出、依赖位于正确清单、Service token 可解析、业务副作用测试通过。

## 构建 Workflow Artifact

Artifact 是应用构建后交给运行时加载的不可变工作流版本产物。可以单独构建：

```bash
pnpm nocobase workflow build
```

默认应用的正常 `pnpm build` 也包含此步骤。使用源码作为资源单独构建时，Artifact 保留包内 `.ts` 文件；生产构建则收集应用服务端在相同相对路径输出的 `.js` 文件，并对实际产物内容计算摘要。生产 Artifact 的摘要在存储和加载时会重新计算并校验。

不要把输出目录指向源码或无关目录。Artifact 构建不会自动启用定义，也不能替代应用编译。

## 开发环境不需要构建

`pnpm dev` 启动的服务端不读取 `dist/workflows`，而是按需编译工作流源码根目录。修改 `workflow.ts` 保存后，它会作为一个新版本直接出现在管理界面，既不需要执行命令，也不需要重启进程；源码没有变化时不会重复编译。

开发态源码加载与构建流程共用 schema 校验、语义校验、扁平 IR 编译和资源收集代码，但省略 `ts.createProgram` 类型检查（应用自身的 `pnpm typecheck` 已经覆盖）与一次性求值子进程（开发服务端本身就跑在 TypeScript loader 下）。开发态摘要只标识本地源码快照；生产 Artifact 的摘要标识编译后的实际文件，两者不要求相同。部署和持久化校验应使用生产 Artifact 的摘要。

开发环境按运行时实际注册的 Instruction 集合校验，因此插件在运行时注册的 Instruction 无需额外配置构建入口即可通过。只存在于 `dist/workflows` 的 key 仍会被列出；同一个 key 同时存在时，以源码为准。

所以在开发环境执行构建的理由只有两个：产出可部署的 Artifact，或验证部署将拿到什么。仅仅为了查看或试跑一个定义，不需要构建。

## 发布和启用新版本

标准路径是：

1. 修改工作流与业务代码；
2. 完成 DSL 检查、应用测试和构建；
3. 部署新的 Artifact 与应用代码；
4. 在管理界面查看部署版本；
5. 管理员确认后启用目标版本。

启用某个版本会使它成为当前且已启用的版本，之前的运行仍固定到各自原始 definition id 和 Artifact hash。不要编辑已物化定义或历史运行来“更新”旧版本。

## 使用 Skill 完成验证

可以要求应用 Agent：

> 请使用 Workflow Skill 检查本次工作流修改。依次运行真实的 DSL check、应用 typecheck、相关测试、lint 和 build，逐项报告命令与结果。说明 Artifact 是否生成、运行时与外部系统哪些边界尚未验证，不要把未运行的检查描述为通过。

## 根据运行证据诊断异常

历史运行必须按它实际使用的版本分析，不能只看当前源码：

1. 记录触发结果；`skipped` 时不要轮询不存在的运行；
2. 确认工作流 key、definition id、版本、hash 和启用状态；
3. 查看运行 ID、eventKey、输入快照、状态、原因和时间；
4. 按执行顺序检查节点，定位第一个失败的叶子节点；
5. 有多次尝试时查看最新尝试，而不是第一条记录；
6. 只读取相关节点的结果、错误和日志；
7. 标记内容是否脱敏或截断；
8. 决定修正源码、参数、重试原事件、创建新事件还是补偿。

父 Condition 可能因为分支子节点失败而显示失败，根因仍在叶子节点。Terminate 从分支结束整个流程时，父 Condition 可能保持 Pending，这并不一定是卡死。

## 常见故障

### 源码检查通过但应用构建失败

源码检查不加载 Run 文件。检查模块是否存在、是否被应用 tsconfig 包含、依赖是否可解析，以及是否导出命名 `run`。

### 触发结果为 not-found 或 disabled

`not-found` 表示没有当前定义或部署未加载；`disabled` 表示当前版本已停用。两者都不会为本次触发创建运行。

### 工作流长时间处于排队中

检查工作流运行时、Worker 和队列是否启动，以及队列失败、重试或死信证据。短暂排队属于异步执行的正常状态。

### Run 模块加载失败

检查 Artifact 中是否包含资源、相对路径是否一致、开发 `.ts`/生产 `.js` 是否对应，以及命名导出是否存在。

### 节点结果无法序列化

将 BigInt、Date、模型实例或循环对象转换为普通 JSON 值，排除函数、Symbol 和非有限数字。

### 工作流因超时中止

查看运行 `reason`、工作流顶层超时配置和日志，确认 Run 模块是否响应 signal。已经发生的外部副作用不会自动回滚，需要幂等或补偿。
