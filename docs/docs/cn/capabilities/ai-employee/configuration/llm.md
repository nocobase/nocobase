---
title: 'LLM 服务配置'
description: '配置 AI 员工可用的 LLM Provider、连接参数、模型和默认状态。'
keywords: 'LLM Provider,OpenAI,Anthropic,Google Gemini,DeepSeek,Ollama,enabledModels'
---

# LLM 服务配置

`ai.llmServices` 是服务连接的声明式快照，以服务名为键。每个服务有一个内置 `provider` 和 Provider 连接参数。同一个 Provider 可以声明多个服务，例如不同账号、区域或网关。

## 配置字段

```yaml
ai:
  llmServices:
    openai: # 键就是服务名，也是 ModelRef.llmService 的值
      title: OpenAI
      provider: openai
      # options.apiKey 用 config set --from-env 写入，见快速开始第二步
      # options:
      #   baseURL: https://gateway.internal/v1   # 可选，覆盖 Provider 的默认地址
      enabledModels:
        - label: Selected model
          value: '<model-id-from-models-command>'
      overrideEnabledModels: false
      modelOptions:
        temperature: 0.2
      enabled: true
      sort: 10
```

| 字段                    | 是否必填 | 说明                                                  |
| ----------------------- | -------- | ----------------------------------------------------- |
| `provider`              | 是       | 内置 Provider 注册键                                  |
| `title`                 | 否       | 管理页显示名称                                        |
| `options`               | 否       | Provider 连接参数，通常包含 `apiKey` 和可选 `baseURL` |
| `enabledModels`         | 否       | 自定义模式下开放的 `{ label, value }` 模型数组        |
| `overrideEnabledModels` | 否       | 是否每次启动都重新套用 `enabledModels`，默认 `false`  |
| `modelOptions`          | 否       | 传给模型客户端的默认参数                              |
| `enabled`               | 否       | 新服务首次同步时的初始启用状态                        |
| `sort`                  | 否       | 管理页排序值                                          |

省略 `enabledModels` 表示 Provider 模型模式，可以在管理页搜索 Provider 返回的模型。不过在管理页勾选之前，这个服务一个可用模型都没有——它不会出现在模型选择器里，也不会出现在 `GET /api/aiEmployee/models` 的返回里。如果希望应用启动后就能直接聊天，配置时就把 `enabledModels` 写上。

配置文件中 `enabledModels` 的标准写法始终是数组，不要在 YAML 中写数据库使用的 `{ mode, models }` 结构。

`options.apiKey` 这样的密钥由用户在自己的受保护环境中用 `pnpm nocobase config set --from-env` 写入，详见[快速开始 · 第二步](../quick-start.md#第二步检查配置并由用户设置密钥)。AI 助手不得请求、读取或打印密钥、`config.yml`、`.env` 或环境变量；只根据 `config check` 的诊断继续操作。

## 内置 Provider

| `provider`           | 服务                    | 备注                              |
| -------------------- | ----------------------- | --------------------------------- |
| `openai`             | OpenAI Responses        | 默认 OpenAI 实现，支持网页搜索    |
| `openai-completions` | OpenAI Chat Completions | 兼容只实现 Completions API 的服务 |
| `google-genai`       | Google Gemini           | 使用 Google Generative AI API     |
| `anthropic`          | Anthropic               | Claude 及 Anthropic 兼容接口      |
| `deepseek`           | DeepSeek                | DeepSeek Chat / Reasoning         |
| `dashscope`          | Alibaba Cloud DashScope | 通义千问等 DashScope 模型         |
| `kimi`               | Kimi                    | Moonshot/Kimi 接口                |
| `mimo`               | MiMo                    | Xiaomi MiMo 接口                  |
| `mistral`            | Mistral AI              | Mistral 模型                      |
| `ollama`             | Ollama                  | 自托管本地模型服务                |
| `orcarouter`         | OrcaRouter              | 聚合模型路由服务                  |
| `shengsuanyun`       | 胜算云                  | 胜算云模型服务                    |
| `xai`                | xAI                     | Grok 模型                         |

`baseURL` 省略时使用 Provider 的默认地址。请求路径会直接拼在 `baseURL` 后面，所以自定义地址要和默认地址保持同样的层级。比如 `openai` 和 `openai-completions` 的默认地址是 `https://api.openai.com/v1`，网关地址也要写到 `/v1` 为止，写成 `https://api.openai.com` 会把请求发到不存在的路径上；`deepseek`、`anthropic` 的默认地址则不带 `/v1`，分别是 `https://api.deepseek.com` 和 `https://api.anthropic.com`。

Provider 注册键区分大小写。`provider: openai` 当前对应 Responses API；已有网关只兼容 Chat Completions 时，改用 `openai-completions`。

## 模型值

模型条目的 `label` 只影响显示，`value` 会原样发送给 Provider。上面的 `<model-id-from-models-command>` 是占位符，必须替换，不能直接调用。NocoBase 不维护内置模型目录，配置检查也不验证账号是否能调用某个模型；不要使用记忆中的模型 ID。

### 启动前发现模型

新服务使用内置 Provider 时，先声明不含密钥和 `enabledModels` 的服务，运行 `pnpm nocobase config check`，让用户自己设置密钥并再次检查。保持服务停止，避免 `pnpm dev` 自动重启提前创建空模型列表，然后运行：

```text
pnpm nocobase ai-employee models <service> [--search keyword] [--json]
```

例如，服务键为 `openai` 时：

```bash
pnpm nocobase ai-employee models openai --json
pnpm nocobase ai-employee models openai --search gpt --json
```

`<service>` 是 `ai.llmServices` 的键，不一定与 Provider 名称相同。`--search` 按不区分大小写的子字符串过滤模型 ID。命令使用最终配置（包括环境变量映射），不启动 Server、不访问数据库，只调用内置 Provider 获取模型 ID。它不启用模型、不更改配置或数据库，也不加载应用启动时注册的自定义 Provider。列表返回某个 ID 不保证账号能够调用它。

选择真实 ID 后，在该服务第一次启动前写入 `enabledModels`，再次运行 `config check`，然后启动应用。已有服务应在 `/settings/ai/llm-services` 选择和启用模型，因为配置里的 `enabledModels` 默认只是首次初始化值。自定义 Provider（包括替换内置注册键的实现）也要在应用启动并注册后，通过管理页获取模型并用聊天验证，不能用这两个 CLI 命令验证其实现。

### 最小调用测试

获得用户对潜在 Provider 费用的批准后，用刚选择的 ID 运行：

```text
pnpm nocobase ai-employee test <service> --model <id> [--json]
```

`test` 使用最终配置发送最小 completion，可能产生费用，结果只报告模型是否可调用，不输出回答正文。它同样无需运行 Server 或访问数据库，不改变服务的 Enabled 状态或已存储模型列表。成功不代表流式输出、工具、附件、网页搜索或 AI 员工聊天可用；仍需在应用里发送真实消息验证。不要把它当作免费的配置检查，也不要自动重试结果不明确的请求。

两个命令都需要在 `cli/plugins.ts` 注册 `@nocobase/app-plugin-ai-employee/cli`。`--json` 返回标准 `{ schemaVersion: 1, ok, command, status, result | error, warnings }` 信封，而不是裸模型数组；先检查退出状态和 `ok`，再使用 `result`。`models` 成功时的 `result` 是 `{ service, provider, models: [{ id }] }`；`test` 成功时是 `{ service, provider, model, callable: true }`。CLI 成功也不证明数据库中的服务已启用或模型列表非空。

`enabledModels` 约束的是可选列表，不是访问控制边界。它决定管理页和聊天框的模型选择器列出哪些模型、`GET /api/aiEmployee/models` 返回什么，以及调用方没有指定模型时回退到哪一个；列表为空的服务不会出现在选择器里。调用方显式指定模型时不会校验这个列表，所以直接调接口或 AI 员工里存着的未列出模型仍然可以运行。

## 同步行为

每次服务启动时，`ai.llmServices` 的名称集合是权威集合：新增名称会创建服务，保留名称会用 `config.yml` 重写 Provider、标题、`options`、`modelOptions` 和 `sort`，删除名称会移除相应配置服务。`models` 和 `test` 不触发这个同步过程。

这里的重写是整体替换，不是合并：配置里省略 `options` 的服务会得到 `{}`，省略 `modelOptions` 的服务会恢复默认值（`temperature: 1`、`topP: 1`，两个 penalty 都是 `0`），管理页上调过的参数会被覆盖。所以写进 `config.yml` 的服务，要么把这些字段写全，要么接受默认值。

**模型列表和 Enabled 状态不在更新范围内。** 它们被当作管理员的配置——匹配到已有服务时，以数据库里的值为准，`config.yml` 里的 `enabledModels` 和 `enabled` 会被忽略。所以这两个字段实际只在服务**第一次被创建**时生效。

:::warning 注意

如果第一次写错了模型 ID，之后改 `config.yml` 不会生效，也不会报错。这种情况要么去管理页改，要么给这个服务打开 `overrideEnabledModels`。

:::

### 让 config.yml 接管模型列表

给单个服务加上 `overrideEnabledModels: true`，它的 `enabledModels` 就会在每次服务启动时重新套用：

```yaml
ai:
  llmServices:
    openai:
      provider: openai
      overrideEnabledModels: true
      enabledModels:
        - label: Selected model
          value: '<model-id-from-models-command>'
```

这个开关按服务声明，默认 `false`，不写就是原来的行为。打开之后模型列表就以 `config.yml` 为准——管理页上对这个服务的模型改动会在下次服务启动时被覆盖，所以通常来说只在希望用配置文件管理模型清单时才打开。

开关只管模型列表。管理员在管理页关掉的服务不会因为重新套用模型列表被打开，即使配置里写了 `enabled: true`，Enabled 状态也仍然以数据库为准。

另外，聊天框默认选中的是所有已启用服务按 `sort` 排序后的第一个模型。服务的 `sort` 每次启动都会从配置重写，决定选中哪个服务；该服务 `enabledModels` 的第一项决定选中哪个模型。这个第一项在服务创建时来自 `config.yml`，之后只有打开这个开关才会继续由配置决定，否则以数据库里的现状为准。如果员工在设置页开启了自己的模型设置，这个员工的聊天只列出它允许、并且当前仍启用的模型，按员工配置的顺序排列，默认选中其中第一个，服务端也只会用这些模型；这些模型全部停用时，这个员工的聊天无法发送，服务端也会拒绝运行。

## 配置验证

`llmServices` 不是对象、条目里写了 `name`、字段类型错误、空 `provider`，或者 `overrideEnabledModels` 不是布尔值，服务启动时都会拒绝整份快照，避免只同步一半。

`pnpm nocobase config check` 会提前报告这些问题，每一项按路径报错误；Provider 需要密钥却没有配置 `options.apiKey` 的服务报警告，并给出设置命令。这需要 `server/config/ai.ts` 用插件提供的 `defineAIConfig` 声明 `ai` 配置，模板默认就是这样写的。

## 相关链接

- [快速开始](../quick-start.md) — 配置第一个 OpenAI 服务
- [LLM 服务管理](../management/llm-services.md) — 搜索模型和切换状态
- [聊天框](../components/chat.md) — 使用 `{ llmService, model }` 选择模型
