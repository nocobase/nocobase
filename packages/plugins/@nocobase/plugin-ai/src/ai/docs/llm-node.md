---
title: "LLM"
description: "说明 LLM 节点的服务选择、消息配置与模型参数设置方式。"
---

# LLM

## 节点类型

`llm`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 适用场景
- 调用在线/本地 LLM 服务进行文本生成、信息抽取或自动化内容处理。
- 需要在流程中引入对话式推理或结构化输出（JSON Schema）。
- 对外部模型调用耗时较长，适合异步工作流场景。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| llmService | string | 无 | 是 | LLM 服务名称（`llmServices.name`），用于绑定具体供应商与鉴权。 |
| model | string | 无 | 是 | 模型 ID（由服务提供或手动输入）。 |
| messages | object[] | [{ role: "user", content: [{ type: "text" }] }] | 否 | 消息数组，作为对话输入。 |
| messages[].role | string | user | 是 | 角色：`system` / `user` / `assistant`。 |
| messages[].message | string | 无 | system/assistant 必填 | system/assistant 的文本内容。 |
| messages[].content | object[] | 无 | user 必填 | user 消息内容数组，支持多模态。 |
| messages[].content[].type | string | text | 是 | 内容类型：`text` / `image_url` / `image_base64`。 |
| messages[].content[].content | string | 无 | type=text 必填 | 文本内容，支持变量。 |
| messages[].content[].image_url.url | string \| object \| array | 无 | type=image_url 或 image_base64 必填 | 图片 URL 或 URL 数组；`image_base64` 会先拉取并转为 base64。 |
| structuredOutput | object | 无 | 否 | 结构化输出配置（JSON Schema），与 Response format 配合。 |
| structuredOutput.schema | string | 无 | 否 | JSON Schema 文本（支持 JSON5）。 |
| structuredOutput.name | string | 无 | 否 | 结构化输出名称。 |
| structuredOutput.description | string | 无 | 否 | 结构化输出描述。 |
| structuredOutput.strict | boolean | false | 否 | 是否严格模式。 |
| builtIn.webSearch | boolean | false | 否 | 内置 Web Search 工具开关（仅部分服务支持）。 |
| openai | object | 无 | 否 | OpenAI/Anthropic/Google 等供应商共用的调用参数（按所选服务生效）。 |
| openai.frequencyPenalty | number | 0.0 | 否 | 频率惩罚。 |
| openai.maxCompletionTokens | number | -1 | 否 | 最大生成 token（部分服务字段）。 |
| openai.maxOutputTokens | number | 无 | 否 | 最大输出 token（部分服务字段）。 |
| openai.presencePenalty | number | 0.0 | 否 | 存在惩罚。 |
| openai.temperature | number | 1.0/0.7 | 否 | 采样温度。 |
| openai.topP | number | 1.0 | 否 | Top-p 采样。 |
| openai.responseFormat | string | text | 否 | 响应格式：`text` / `json_object` / `json_schema`（视服务支持）。 |
| openai.timeout | number | 60000 | 否 | 超时时间（毫秒）。 |
| openai.maxRetries | number | 1 | 否 | 最大重试次数。 |
| deepseek | object | 无 | 否 | DeepSeek 参数（与 OpenAI 类似）。 |
| deepseek.frequencyPenalty | number | 0.0 | 否 | 频率惩罚。 |
| deepseek.maxCompletionTokens | number | -1 | 否 | 最大生成 token。 |
| deepseek.presencePenalty | number | 0.0 | 否 | 存在惩罚。 |
| deepseek.temperature | number | 0.7 | 否 | 采样温度。 |
| deepseek.topP | number | 1.0 | 否 | Top-p 采样。 |
| deepseek.responseFormat | string | text | 否 | 响应格式：`text` / `json_object`。 |
| deepseek.timeout | number | 60000 | 否 | 超时时间（毫秒）。 |
| deepseek.maxRetries | number | 1 | 否 | 最大重试次数。 |
| qwen | object | 无 | 否 | DashScope/Qwen 参数（与 OpenAI 类似）。 |
| qwen.frequencyPenalty | number | 0.0 | 否 | 频率惩罚。 |
| qwen.maxCompletionTokens | number | -1 | 否 | 最大生成 token。 |
| qwen.presencePenalty | number | 0.0 | 否 | 存在惩罚。 |
| qwen.temperature | number | 0.7 | 否 | 采样温度。 |
| qwen.topP | number | 1.0 | 否 | Top-p 采样。 |
| qwen.responseFormat | string | text | 否 | 响应格式：`text` / `json_object` / `json_schema`。 |
| qwen.timeout | number | 60000 | 否 | 超时时间（毫秒）。 |
| qwen.maxRetries | number | 1 | 否 | 最大重试次数。 |
| ollama | object | 无 | 否 | Ollama 参数。 |
| ollama.temperature | number | 0.7 | 否 | 采样温度。 |
| ollama.topP | number | 1.0 | 否 | Top-p 采样。 |
| ollama.topK | number | 40 | 否 | Top-k 采样。 |
| ollama.numPredict | number | -1 | 否 | 最大生成 token。 |
| ignoreFail | boolean | false | 否 | 失败时是否忽略错误并继续流程。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "llmService": "openai-main",
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "message": "你是帮助运营整理摘要的助手。"
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "content": "请总结以下内容：{{ $context.data.content }}"
        }
      ]
    }
  ],
  "structuredOutput": {
    "schema": "{\"type\":\"object\",\"properties\":{\"summary\":{\"type\":\"string\"}}}",
    "name": "summary",
    "description": "摘要输出",
    "strict": false
  },
  "builtIn": {
    "webSearch": false
  },
  "openai": {
    "temperature": 0.7,
    "topP": 1.0,
    "maxCompletionTokens": 512,
    "responseFormat": "text",
    "timeout": 60000,
    "maxRetries": 1
  },
  "ignoreFail": false
}
```