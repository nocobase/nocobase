# 文本对话

<PluginInfo name="ai"></PluginInfo>

## 介绍

使用工作流的 LLM 节点可以与在线 LLM 服务发起对话，利用大模型的能力来辅助完成一系列业务流程。

![](https://static-docs.nocobase.com/202503041012091.png)

## 新建 LLM 节点

由于与 LLM 服务对话通常比较耗时，LLM 节点只能在异步工作流中使用。

![](https://static-docs.nocobase.com/202503041013363.png)

## 选择模型

首先选择已接入的 LLM 服务，如果还没有接入 LLM 服务，则需要先添加 LLM 服务配置。参考：[LLM 服务管理](/ai-employees/features/llm-service)

选择服务以后，应用会尝试从 LLM 服务获取可用模型列表供选择。部分 LLM 在线服务获取模型的接口可能不符合标准 API 协议，用户也可以手动输入模型 id.

![](https://static-docs.nocobase.com/202503041013084.png)

## 设置调用参数

可以按需调整调用 LLM 模型的参数。

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

其中值得注意的是 **Response format** 设置，该设置项用于提示大模型响应的内容格式，可以是文本或 JSON. 如果选择了 JSON 模式，需要注意：

- 对应的 LLM 模型需要支持以 JSON 模式调用，同时用户需要在 Prompt 中明确提示 LLM 响应 JSON 格式，例如: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". 否则可能没有响应结果，报错 `400 status code (no body)`.
- 响应结果是一个 JSON 字符串，用户需要利用工作流其他节点的能力解析后，才能使用其中的结构化内容。也可以使用 [结构化输出](/ai-employees/workflow/nodes/llm/structured-output) 功能。

## 消息

发送给 LLM 模型的消息数组，可以包含一组历史消息。其中消息支持三种类型：

- System - 通常用于定义在对话中 LLM 模型扮演的角色和行为。
- User - 用户输入的内容。
- Assistant - 模型响应的内容。

对于用户消息，在模型支持的前提下，可以在一个提示中添加多条内容，对应 `content` 参数。如果所使用的模型仅支持字符串形式的 `content` 参数（绝大多数不支持多模态对话的模型属于此类），请将消息拆分成多个提示，每个提示仅保留一个内容，这样节点会将内容以字符串的形式发送。

![](https://static-docs.nocobase.com/202503041016140.png)

在消息内容中可以使用变量来引用工作流的上下文。

![](https://static-docs.nocobase.com/202503041017879.png)

## 使用 LLM 节点的响应内容

可以将 LLM 节点的响应内容作为变量在其他节点中使用。

![](https://static-docs.nocobase.com/202503041018508.png)
