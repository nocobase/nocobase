# 结构化输出

<PluginInfo name="ai-ee" licenseBundled="true"></PluginInfo>

## 介绍

在有些应用场景下，用户可能希望 LLM 模型以 JSON 格式响应结构化内容，可以通过配置「结构化输出」来实现。

![](https://static-docs.nocobase.com/202503041306405.png)

## 配置说明

- **JSON Schema** - 用户可通过配置 [JSON Schema](https://json-schema.org/) 规定模型响应的预期结构。
- **名称 (Name)** - _非必填_，用于帮助模型更好地理解 JSON Schema 所表示的对象。
- **描述 (Description)** - _非必填_，用于帮助模型更好地理解 JSON Schema 的用途。
- **Strict** - 要求模型严格按照 JSON Schema 结构生成响应。目前，仅 OpenAI 的部分新模型支持此参数，勾选前请确认模型是否兼容。

## 结构化内容生成方式

模型的结构化内容生成方式，取决于所使用的 **模型** 及其 **Response format** 配置：

1. Response format 仅支持 `text` 的模型

   - 调用时，节点会绑定一个基于 JSON Schema 生成 JSON 格式内容的 Tools，引导模型通过调用该 Tools 生成结构化响应。

2. Response format 支持 JSON 模式 (`json_object`) 的模型

   - 若调用时选择 JSON 模式，用户需在 Prompt 中明确指示模型以 JSON 格式返回，并提供响应字段说明。
   - 在此模式下，JSON Schema 仅用于解析模型返回的 JSON 字符串，将其转换为目标 JSON 对象。

3. Response format 支持 JSON Schema (`json_schema`) 的模型

   - JSON Schema 直接用于指定模型的目标响应结构。
   - 可选 **Strict** 参数，要求模型严格遵循 JSON Schema 生成响应。

4. Ollama 本地模型
   - 若配置了 JSON Schema，调用时，节点会将其作为 `format` 参数传入模型。

## 使用结构化输出结果

模型响应的结构化内容以 JSON 对象的形式保存在节点的 Structured content 字段，可供后续节点使用。

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)

如果需要使用 JSON 对象中的字段内容，可以参考：

- [JSON 变量映射](../../../../../handbook/workflow-json-variable-mapping)
- [JSON 计算](../../../../../handbook/workflow-json-query)
