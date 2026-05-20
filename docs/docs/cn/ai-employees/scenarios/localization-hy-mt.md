---
pkg: '@nocobase/plugin-ai'
title: '使用 Lina 和本地 HY-MT 翻译本地化词条'
description: '通过 llama-server 部署 HY-MT1.5 GGUF 翻译模型，并将其配置给 Lina，用于批量翻译 NocoBase 本地化词条。'
keywords: 'Lina,本地化,HY-MT,GGUF,llama-server,OpenAI compatible,AI 翻译,NocoBase'
---

# 使用 Lina 和本地 HY-MT1.5-1.8B 翻译本地化词条

本文介绍一种本地化翻译实践：在本地部署翻译专用小模型，将其作为 OpenAI 兼容服务接入 NocoBase，再配置给 Lina 执行本地化词条翻译任务。

这个方案适合需要批量翻译大量系统词条、插件文案、菜单、数据表和字段标题的场景。相比在线模型，本地模型不会受到外部 API RPM、TPM 或并发限流影响，可以根据机器性能和模型能力调整并发数，整体任务耗时更可控。

## 方案概览

本方案使用：

- 翻译模型：`tencent/HY-MT1.5-1.8B-GGUF`
- 推理服务：`llama-server`
- 接入方式：OpenAI 兼容接口
- AI 员工：Lina
- 应用入口：本地化管理页面

:::info{title=说明}
HY-MT1.5-1.8B 是翻译专用小模型，更适合短词条、界面文案和批量翻译场景。对于本地化任务，不建议优先使用普通聊天模型。
:::

## 前置条件

开始前，需要准备：

- 已安装并启用 **本地化管理** 插件。
- 已启用目标语言。
- 已同步本地化词条。
- 本机或服务器可以运行 [`llama-server`](https://github.com/ggml-org/llama.cpp).
- NocoBase 服务可以访问 `llama-server` 的 HTTP 地址。

## 部署 HY-MT GGUF 模型

### 安装 llama.cpp

在 macOS 上，可以通过 Homebrew 安装：

```bash
brew install llama.cpp
```

也可以使用 llama.cpp 的预编译二进制或从源码构建。只要最终能使用 `llama-server` 即可。

### 启动 OpenAI 兼容服务

使用 Hugging Face 上的 GGUF 模型启动服务：

```bash
llama-server \
  -hf tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M \
  --host 0.0.0.0 \
  --port 8000 \
  -c 2048 \
  -np 4
```

参数说明：

| 参数     | 说明                                                                             |
| -------- | -------------------------------------------------------------------------------- |
| `-hf`    | 从 Hugging Face 加载模型。                                                       |
| `--host` | 监听地址。部署在本机测试时可使用 `127.0.0.1`，容器或远程访问时可使用 `0.0.0.0`。 |
| `--port` | HTTP 服务端口。                                                                  |
| `-c`     | 上下文长度。本地化词条通常较短，`2048` 已足够。                                  |
| `-np`    | 并行处理槽位数量。可根据机器性能调整。                                           |

:::info{title=提示}
如果服务器资源有限，可以先使用 `-np 1` 或 `-np 2` 验证可用性，再逐步增加并发。
:::

## 测试模型服务

`llama-server` 启动后，先检查服务状态：

```bash
curl http://127.0.0.1:8000/health
```

服务就绪后，可以通过 OpenAI 兼容接口测试翻译：

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M",
    "messages": [
      {
        "role": "user",
        "content": "Translate the following text into Chinese. Output only the translated result without any additional explanation:\n\nSave"
      }
    ]
  }'
```

如果使用本地模型文件启动，也可以将请求中的 `model` 改为服务实际返回或配置的模型名称。

:::warning{title=注意}
如果请求长时间无响应，通常说明模型推理速度不足、并发过高或上下文配置过大。先降低 `-np` 和 NocoBase 侧翻译并发，再观察响应时间。
:::

## 在 NocoBase 中配置 LLM 服务

进入 `系统设置 -> AI 员工 -> LLM service`，新增一个 LLM 服务。

参考配置如下：

| 配置项         | 示例值                                                       |
| -------------- | ------------------------------------------------------------ |
| Provider       | OpenAI (completions)                                         |
| Title          | HY-MT Local                                                  |
| Base URL       | `http://127.0.0.1:8000/v1`                                   |
| API Key        | 如果 llama-server 未配置鉴权，可填写任意占位值，如 `dummy`。 |
| Enabled Models | 选择 `tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M`，或填写实际模型名。 |

配置完成后，建议先使用 `Test flight` 测试模型是否可用。

:::info{title=提示}
如果 NocoBase 运行在 Docker 容器中，`127.0.0.1` 指向容器内部，不一定能访问宿主机服务。需要改成宿主机 IP、容器网络地址，或使用 `host.docker.internal`。
:::

## 为 Lina 配置专用模型

进入 `系统设置 -> AI 员工 -> AI employees`，打开 Lina 的配置，切换到 `Model settings`。

1. 打开 `Enable dedicated model configuration`。
2. 在 `Models` 中选择刚刚创建的 HY-MT 本地模型。
3. 保存配置。

启用后，Lina 会优先使用该模型执行本地化翻译任务。这样可以避免用户在聊天或任务中切换到普通聊天模型，提升翻译稳定性。

更多说明参考 [配置 AI 员工模型](/ai-employees/features/model-settings)。

## 配置翻译并发

本地化翻译任务的并发数由环境变量 `AI_LOCALIZATION_CONCURRENCY` 控制：

```bash
AI_LOCALIZATION_CONCURRENCY=10
```

规则如下：

- 默认值：`10`
- 最小值：`1`
- 最大值：`20`
- 超出范围时使用默认值

本地模型的最佳并发取决于 CPU、GPU、内存、模型量化版本和 `llama-server` 的 `-np` 配置。如果按默认并发数执行任务有问题，建议按以下方式调整：

1. 先设置 `AI_LOCALIZATION_CONCURRENCY=1`，确认单条翻译稳定。
2. 将 `llama-server -np` 和 `AI_LOCALIZATION_CONCURRENCY` 都调到 `2` 或 `4`。
3. 观察模型响应时间、CPU/GPU 使用率和任务进度。
4. 如果响应稳定，再逐步提高并发。

:::warning{title=注意}
不要直接把并发调到很高。并发超过模型实际处理能力时，任务不会更快，反而可能造成请求排队、超时或服务卡住。
:::

## 执行本地化翻译

进入 `系统管理 -> 本地化管理`。

1. 切换到目标语言。
2. 点击 `同步`，确保词条已同步。
3. 点击 Lina 的头像按钮。
4. 根据需要选择：
   - `增量翻译`：只翻译尚未有译文的词条。
   - `翻译所选项`：只翻译表格中勾选的词条。
   - `全量翻译`：翻译当前语言中的全部词条。
5. 在确认弹窗中检查即将翻译的条数、服务商和模型。
6. 如果选择的是增量翻译或全量翻译，可以选择翻译范围：
   - `全部`
   - `内置词条`：系统和插件词条。
   - `自建词条`：路由名称、数据表和字段名称以及 UI 上的内容。
7. 根据需要调整参考翻译语言。增量翻译和全量翻译会分别配置内置词条和自建词条的参考语言；翻译所选项只显示一组通用参考语言配置。
8. 确认后创建异步任务。
9. 等待任务完成，检查译文并发布。

建议先使用 `翻译所选项` 测试少量词条，确认模型输出风格和速度符合预期后，再执行增量或全量翻译。

## Lina 如何组织翻译请求

Lina 会根据词条和参考翻译构造翻译请求。对于短词条，系统会尽量使用参考译文提升一致性：

- 内置词条默认使用中文译文作为参考，日文作为备选参考。
- 自建词条默认使用系统默认语言作为参考，中文作为备选参考。
- 用户可以在创建任务的确认弹窗中调整默认语言和备选语言。
- 系统会优先使用默认语言中的参考译文；如果不存在，再尝试使用备选语言。
- 翻译结果只写入目标语言的译文，不会自动发布。

典型提示词语义如下：

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## 排错建议

### NocoBase 创建任务后没有进度

先确认 `llama-server` 是否收到请求。可以查看服务日志，或直接使用 `curl` 调用 `/v1/chat/completions`。

如果模型端有请求但长时间不返回，通常是模型推理卡住或并发过高。先降低：

- `AI_LOCALIZATION_CONCURRENCY`
- `llama-server -np`
- `llama-server -c`

### 模型返回解释而不是译文

本地翻译小模型一般比普通聊天模型更稳定。如果仍然出现解释文本，可以先用 `curl` 测试同一段提示词，确认模型本身的输出风格。

也可以优先翻译较短的词条，或降低温度等采样参数。

### NocoBase 无法连接模型服务

检查：

- Base URL 是否包含 `/v1`。
- NocoBase 运行环境是否能访问该地址。
- 防火墙或容器网络是否阻断端口。
- `llama-server` 是否仍在运行。

## 发布前检查

AI 翻译完成后，仍建议人工抽查后再发布：

- 按模块筛选，检查菜单、按钮、字段名、状态名等短词条。
- 检查变量、占位符、HTML 标签和格式符号是否保留。
- 检查关键业务术语是否统一。
- 如果内置词条译文被覆盖，可以在本地化管理页面重新同步，并勾选 `重置系统内置词条翻译内容` 恢复默认译文。贡献系统和官方插件默认译文时，可参考 [翻译贡献](/get-started/translations)。
- 先在测试环境发布验证，再同步到生产环境。

## 参考资料

- [tencent/HY-MT1.5-1.8B-GGUF](https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF)
- [llama-server 文档](https://www.mintlify.com/ggml-org/llama.cpp/inference/server)
- [Lina：本地化工程师](/ai-employees/built-in/lina)
