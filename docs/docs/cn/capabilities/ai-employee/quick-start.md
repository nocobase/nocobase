---
title: '快速开始'
description: '为 NocoBase 应用配置第一个 LLM 服务，并使用内置组件创建全局 AI 对话入口。'
keywords: 'NocoBase,AI 员工,快速开始,config.yml,LLM,全局对话'
---

# 快速开始

这条路径使用 NocoBase 内置的 AI 员工和前端组件，不要求你先编写自己的员工。先在第一次启动前用 CLI 从内置 Provider 获取真实模型 ID，再完成服务初始化、最小调用测试和聊天入口配置。

## 前置条件

- 已使用 `pnpm create @nocobase/app <目录名>` 创建应用，并在应用目录中运行过 `pnpm nocobase config init`
- 已注册 `@nocobase/app-plugin-ai-employee` 的 Server、Client 和 CLI 入口；CLI 入口注册在 `cli/plugins.ts`
- 当前账号可以访问 `/settings/ai`
- 对于需要密钥的 Provider，由你本人在自己的环境中设置密钥，不需要把密钥提供给 AI 助手

## 创建应用

创建并进入应用目录：

```bash
pnpm create @nocobase/app ai-workspace
cd ai-workspace
pnpm nocobase config init
```

创建命令生成完整的应用源码并安装依赖，`pnpm nocobase config init` 生成 `config.yml`（默认使用 SQLite，并填入随机密钥）。确认 CLI 可用：

```bash
pnpm nocobase commands --json
```

不要让 AI 助手读取或打印 `config.yml`、`.env`、环境变量或任何密钥；后续命令只报告配置诊断和 Provider 返回的模型 ID。

## 第一步：声明 LLM 服务

保持服务停止，打开应用根目录的 `config.yml`，在 `ai.llmServices` 中添加服务。`llmServices` 是以服务名为键的对象；下面的 `openai` 是服务名，不是必须使用的 Provider 名称。先不要写 `enabledModels`，也不要把密钥写入仓库。

```yaml
ai:
  llmServices:
    openai:
      title: OpenAI
      provider: openai
      enabled: true
```

键 `openai` 是 NocoBase 内部引用服务的稳定标识，条目里没有 `name` 字段。`provider` 必须是内置 Provider 的注册名。自定义 Provider 不能通过本页的启动前 CLI 流程发现；它需要应用启动后由应用代码注册，再到 LLM services 页面配置。

<a id="第二步配置密钥并重启"></a>

## 第二步：检查配置并由用户设置密钥

在应用根目录运行：

```bash
pnpm nocobase config check
```

如果 Provider 需要密钥，检查会报告 `ai.llmServices.openai.options.apiKey` 的警告。写入前确认 `config.yml` 已被 Git 忽略且未被跟踪；应用还不是 Git 仓库时，先检查 `.gitignore` 包含 `/config.yml`。不要在会提交的 `config.example.yml` 中填写密钥。在已有 Git 仓库中可以用下面的命令检查，它不读取配置内容：

```bash
git check-ignore -q config.yml && ! git ls-files --error-unmatch config.yml >/dev/null 2>&1 && echo 'config.yml ok'
```

用户应在自己的受保护终端中设置密钥，例如使用已经私下设置的环境变量运行下面的命令；不要把密钥发送给 AI 助手，也不要让 AI 助手读取、回显或验证密钥内容：

```bash
pnpm nocobase config set --from-env ai.llmServices.openai.options.apiKey=OPENAI_API_KEY
```

写入后再次运行 `pnpm nocobase config check`。AI 助手只应根据命令的成功或诊断输出继续操作，不应读取 `config.yml` 或 `.env`。

### 由运行环境注入密钥

如果密钥由服务管理器、容器或 CI 注入，则保留 `server/config/ai.ts` 中的 `defineAIConfig` 和默认配置，在 `env` 中添加映射，例如 `OPENAI_API_KEY: envString('llmServices.openai.options.apiKey')`，其中 `envString` 从 `@nocobase/app-server/config` 导入。映射路径从 `ai` 节点往下写，只映射已声明的服务。有值的映射变量覆盖 `config.yml`；构建后的服务要重新 `pnpm build` 才会读取新的映射代码。在相同运行环境里用 `pnpm nocobase config env` 查看映射及是否已设置，不打印值，再运行 `config check`。

:::warning 部署时单独配置

部署环境有自己的运行配置，做法见[独立部署](../../deployment/standalone.md)和[运行配置](../../deployment/configuration.md)。`ai.llmServices` 的服务条目和密钥也属于这份配置，要在部署环境里同样设置。

:::

## 第三步：启动前获取真实模型 ID

在第一次启动应用之前，使用已注册的 CLI 入口从 Provider 获取模型 ID：

```bash
pnpm nocobase ai-employee models openai --json
pnpm nocobase ai-employee models openai --search gpt --json
```

`<service>` 是 `ai.llmServices` 中的服务名，`--search` 按不区分大小写的子字符串过滤返回的模型 ID。该命令使用最终配置（包括环境变量映射），只调用内置 Provider，不启动 Server、不读取数据库、不修改配置，也不显示密钥。`--json` 返回标准 CLI 信封：`{ schemaVersion, ok, command, status, result | error, warnings }`；先检查 `ok` 和退出状态，再从 `result` 中取模型 ID。

模型列表只说明 Provider 返回了这些 ID，不保证账号能够调用某个模型。选择服务商返回的真实 ID，不要使用记忆中的示例值。

## 第四步：写入 enabledModels

把选择的真实 ID 写入 `config.yml` 的 `enabledModels`，替换下面片段中的 `<real-model-id>` 占位符。AI 助手可通过不输出文件内容的本地脚本只更新这个字段，保留其他配置、密钥和注释，不得输出敏感错误片段。更新后运行 `config check --no-connect`，等待你确认后再启动服务器：

```yaml
ai:
  llmServices:
    openai:
      title: OpenAI
      provider: openai
      enabledModels:
        - label: Provider returned model
          value: <real-model-id>
      enabled: true
```

`label` 只影响显示，`value` 会原样发送给 Provider。再次运行配置检查：

```bash
pnpm nocobase config check
```

`enabledModels` 默认只在服务记录第一次创建时初始化模型列表；因此新服务要在第一次启动前完成这一步。已初始化的服务不要用编辑 `config.yml` 的方式替代管理页操作，除非明确设置 `overrideEnabledModels: true` 并接受每次启动覆盖管理页的模型选择。

## 第五步：第一次启动、最小调用测试和聊天

现在启动应用：

```bash
pnpm dev
```

确认服务初始化后，先获得用户对潜在 Provider 费用的明确批准，再运行最小调用测试：

```bash
pnpm nocobase ai-employee test openai --model <real-model-id> --json
```

该命令使用最终配置，不启动另一个 Server、不访问数据库，发送最小 completion 并报告模型是否可调用，不输出回答正文。它可能产生费用，只证明这一次基础调用成功；它不证明聊天、流式输出、工具、附件或网页搜索可用。不要自动重试未知结果，也不要把失败信息中的密钥或完整配置打印出来。

打开设置侧栏「AI」分组里的「LLM services」页面（`/settings/ai/llm-services`）确认服务和模型已启用。如果服务已经初始化过，或者使用了自定义 Provider，在这里从 Provider 返回的模型列表中选择模型并保存，而不是期待 `enabledModels` 的后续编辑自动生效。

![编辑 LLM 服务模型](https://static-docs.nocobase.com/20260914111142-ai-employee-llm-services.png)

还需要发送真实聊天消息来验证完整链路；下面先创建全局聊天入口。

## 第六步：创建全局 AI 对话入口

开发模式下打开 `/dev/ai-components/floating`，这里展示了全局悬浮入口、右侧面板和对话框之间的组合方式。

![全局悬浮 AI 对话入口](https://static-docs.nocobase.com/20260914111142-ai-components-floating.png)

接下来把下面的任务交给应用里的编码 Agent。让它直接参考当前应用中的示例源码，不要重新实现聊天 Transport。

```text
参考 /dev/ai-components/floating 对应的现有组件和源码，在应用布局中创建一个全局 AI 对话入口。

要求：
- 检查 client/extensions/nocobase-ai；目录不存在时，从当前 AI Employee 插件安装 nocobase-ai Registry 项；
- 用 NocoBaseAIRootProvider 包装 AI UI，并在 client/react-providers.ts 中挂载一次；
- 在页面右下角显示 AIChatFloatingTrigger；
- 点击后用 ChatSurface 打开右侧对话面板，并允许展开为 dialog；
- 复用同一个 AIChatProvider、controller 和 AIChatWindow，切换容器时不要重建会话；
- 用 useAI() 的就绪状态控制渲染：员工或模型还在加载、加载失败、没有可用员工或没有已启用模型时，显示对应的提示，而不是一个看起来可用的输入框；
- 给 AIChatProvider 传入 defaultEmployee，指定入口默认使用的员工，不要依赖排序第一的内置员工；
- 保留历史会话、Tool 审批、附件和断线恢复能力；
- 完成后运行应用的 lint、typecheck、test 和 build。
```

## 第七步：开始对话

刷新应用，点击右下角的 AI 图标，确认默认选中预期员工和刚才启用的模型，然后发送一条消息。检查流式回答和会话历史，再刷新页面重复第一次发送，确认新挂载的聊天也可用。CLI 的 `test` 成功不能替代这些验证。

## 遇到问题时

| 现象                            | 优先检查                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `ai-employee models` 不可用     | `@nocobase/app-plugin-ai-employee/cli` 是否导出并注册在 `cli/plugins.ts`               |
| 模型命令报告缺少密钥            | 让用户在自己的环境中设置密钥，然后只重新运行 `config check` 和模型命令；不要读取密钥   |
| 模型命令返回空列表              | 服务名、Provider、最终配置和服务商账号权限；不要猜模型 ID                              |
| 启动报 `Invalid ai.llmServices` | `llmServices` 是否写成以服务名为键的对象，条目里是否多写了 `name`                      |
| 测试返回 Provider 错误          | 服务商账号、真实模型 ID、Provider 和用户设置的密钥；测试可能已经产生费用，不要盲目重试 |
| 服务存在但聊天没有模型          | 新服务是否在第一次启动前写入 `enabledModels`；已有服务请到管理页选择并启用模型         |
| 自定义 Provider 无法用 CLI 发现 | 启动应用让 Provider 注册，再使用 LLM services 页面和真实聊天验证                       |
| `/dev/ai-components/*` 不存在   | 当前是否为开发模式；Dev Route 不进入生产构建                                           |

## 相关链接

- [LLM 配置](./configuration/llm.md) — 查看全部 Provider、CLI 模型发现和配置字段
- [聊天框](./components/chat.md) — 了解聊天窗口的组件层次
- [全局对话入口](./components/floating.md) — 在应用级 Provider 中挂载悬浮入口
- [LLM 服务管理](./management/llm-services.md) — 管理已初始化服务的模型和启用状态
