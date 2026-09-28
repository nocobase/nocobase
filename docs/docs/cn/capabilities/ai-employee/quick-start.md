---
title: '快速开始'
description: '为 NocoBase 应用配置第一个 LLM 服务，并使用内置组件创建全局 AI 对话入口。'
keywords: 'NocoBase,AI 员工,快速开始,config.yml,LLM,全局对话'
---

# 快速开始

这条路径使用 NocoBase 内置的 AI 员工和前端组件，不要求你先编写自己的员工。完成 LLM 配置、确认模型和创建全局入口后，就可以开始对话。

## 前置条件

- 已使用 `pnpm create @nocobase/app <目录名>` 创建应用，并在应用目录中运行过 `pnpm nocobase config init`
- 应用可以通过 `pnpm dev` 启动
- `@nocobase/app-plugin-ai-employee` 已在应用的 Server 和 Client 插件列表中注册
- 已准备 LLM 服务的 API Key
- 当前账号可以访问 `/settings/ai`

## 创建应用

创建并进入应用目录：

```bash
pnpm create @nocobase/app ai-workspace
cd ai-workspace
pnpm nocobase config init
```

创建命令生成完整的应用源码并安装依赖，`pnpm nocobase config init` 生成 `config.yml`（默认使用 SQLite，并填入随机密钥）。确认初始应用能够通过 `pnpm dev` 启动，然后继续配置 AI。

## 第一步：声明 LLM 服务

打开应用根目录的 `config.yml`，在 `ai.llmServices` 中添加服务。`llmServices` 是以服务名为键的对象，下面添加一个名为 `openai` 的 OpenAI 服务。密钥不写在这里，第二步再配置。

```yaml
ai:
  llmServices:
    openai:
      title: OpenAI
      provider: openai
      enabledModels:
        - label: GPT-5.6
          value: gpt-5.6
      enabled: true
```

键 `openai` 就是服务名，是 NocoBase 内部引用这个服务的稳定标识，条目里没有 `name` 字段。`provider` 是内置 Provider 的注册名。`enabledModels[].value` 必须使用服务商接受的真实模型 ID；如果当前账号不能使用示例中的 `gpt-5.6`，请替换成实际可用的模型。

你也可以先不写 `enabledModels`：

```yaml
ai:
  llmServices:
    openai:
      title: OpenAI
      provider: openai
      enabled: true
```

省略 `enabledModels` 后，服务使用 Provider 模型模式。服务启动后，再到管理页搜索并选择要开放的模型。

## 第二步：配置密钥并重启

密钥不能进入仓库，也不能被提交。动手之前，先确认 `config.yml` 被 Git 忽略并且没有被跟踪。刚创建的应用还不是 git 仓库时，先在应用根目录执行 `git init`。下面的命令输出 `ok` 才能继续：

```bash
git check-ignore -q config.yml && ! git ls-files --error-unmatch config.yml >/dev/null 2>&1 && echo "config.yml ok" || echo "config.yml 未被忽略，停止"
```

在你自己的终端里进入应用根目录，运行下面的命令。命令运行后会等待输入，粘贴密钥后回车即可；输入时屏幕上不会显示，密钥也不会出现在命令行和 shell 历史里。变量只对这一条命令生效，由 `pnpm nocobase config set --from-env` 写进 `config.yml` 的 `ai.llmServices.openai.options.apiKey`。写入时按 YAML 的规则处理引号，保留文件里的注释，输出里只有改动的键名。

```bash
# zsh、bash
IFS= read -rs OPENAI_API_KEY && OPENAI_API_KEY="$OPENAI_API_KEY" pnpm nocobase config set --from-env ai.llmServices.openai.options.apiKey=OPENAI_API_KEY; unset OPENAI_API_KEY
```

```powershell
# Windows PowerShell
$k = Read-Host 'OpenAI API Key' -AsSecureString; $env:OPENAI_API_KEY = [System.Net.NetworkCredential]::new('', $k).Password; pnpm nocobase config set --from-env ai.llmServices.openai.options.apiKey=OPENAI_API_KEY; Remove-Item Env:OPENAI_API_KEY; Remove-Variable k
```

不要把密钥发给 AI 助手，也不要让它代你执行这条命令，否则密钥会留在对话记录里。`config.example.yml` 会入库，不写密钥。

写入后可以运行 `pnpm nocobase config check` 确认：服务的 Provider 需要密钥却没有配置时，它会对 `ai.llmServices.openai.options.apiKey` 给出警告，写入后警告消失。然后重启服务，`pnpm dev` 在 `config.yml` 变化时会自动重启。

### 由运行环境注入密钥

如果密钥由服务管理器、容器或 CI 以环境变量的形式注入，就不写进 `config.yml`，而是在 `server/config/ai.ts` 的 `env` 里声明映射，路径从 `ai` 节点往下写：

```ts
import {
  defineAppConfig,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AIApplicationConfig } from '@nocobase/app-plugin-ai-employee/server/config';

const ai: AppConfigFactory<AIApplicationConfig> = defineAppConfig({
  env: { OPENAI_API_KEY: envString('llmServices.openai.options.apiKey') },
  defaults: () => ({
    // 保持模板原有的默认值
  }),
});

export default ai;
```

映射的变量有值时会覆盖 `config.yml` 里的值。只映射 `config.yml` 里已经声明的服务；映射到不存在的服务名，会得到一个缺少 `provider` 的条目，服务启动时报错 `Invalid ai.llmServices.openai.provider`。映射是代码，构建后的服务要重新 `pnpm build` 才会读到。在启动服务的环境里运行 `pnpm nocobase config env`，`OPENAI_API_KEY` 前面显示 `●`、后面是 `ai.llmServices.openai.options.apiKey`，就说明映射和变量都已生效；这个命令不会打印值。

:::warning 部署时单独配置

部署环境有自己的运行配置，做法见[独立部署](../../app/deployment/standalone.md)和[运行配置](../../app/deployment/configuration.md)。`ai.llmServices` 的服务条目和密钥也属于这份配置，要在部署环境里同样设置。

:::

## 第三步：在管理页确认模型

打开设置侧栏「AI」分组里的「LLM services」页面（`/settings/ai/llm-services`）。你应该能看到 `openai` 服务、`OpenAI` Provider 和当前已启用模型。

![编辑 LLM 服务模型](https://static-docs.nocobase.com/20260914111142-ai-employee-llm-services.png)

如果配置里没有写 `enabledModels`，点击模型列前的编辑按钮，从 Provider 返回的模型列表中选择模型；也可以切换到手动输入，填写模型 ID 和显示名称。最后确认服务右侧的「Enabled」开关已经打开。

## 第四步：创建全局 AI 对话入口

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
- 给 AIChatProvider 传入 defaultEmployee，指定入口默认使用的员工（悬浮入口不传 aiEmployee 时也会用它），不要依赖排序第一的内置员工；
- 保留历史会话、Tool 审批、附件和断线恢复能力；
- 完成后运行应用的 lint、typecheck、test 和 build。
```

## 第五步：开始对话

刷新应用，点击右下角的 AI 图标。确认默认选中的是你指定的员工和刚才启用的模型，然后发送一条消息。如果员工、模型、流式回答和会话历史都能正常显示，最小链路就已经打通。

遇到问题时按下面的顺序检查：

| 现象                            | 优先检查                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------ |
| 启动报 `Invalid ai.llmServices` | `llmServices` 是否写成以服务名为键的对象，条目里是否多写了 `name`              |
| 「LLM services」页面没有服务    | `config.yml` 的 YAML 缩进、`ai.llmServices` 和服务重启                         |
| 服务存在但没有模型              | 编辑模型列表，或检查 `enabledModels` 中的模型 ID                               |
| 调用返回认证错误                | 密钥是否写进了 `ai.llmServices.openai.options.apiKey`，Provider 是否与密钥匹配 |
| 看不到可用员工                  | 员工是否在「AI Employees」页面启用                                             |
| `/dev/ai-components/*` 不存在   | 当前是否为开发模式；Dev Route 不进入生产构建                                   |

## 相关链接

- [LLM 配置](./configuration/llm.md) — 查看全部 Provider 和配置字段
- [聊天框](./components/chat.md) — 了解聊天窗口的组件层次
- [全局对话入口](./components/floating.md) — 在应用级 Provider 中挂载悬浮入口
- [LLM 服务管理](./management/llm-services.md) — 在后台选择和启用模型
