---
pkg: "@nocobase/plugin-ai-ee"
---

# Structured Output



## Introduction

In some application scenarios, users may want the LLM model to respond with structured content in JSON format. This can be achieved by configuring "Structured Output".



![](https://static-docs.nocobase.com/202503041306405.png)



## Configuration

- **JSON Schema** - Users can specify the expected structure of the model's response by configuring a [JSON Schema](https://json-schema.org/).
- **Name** - _Optional_, used to help the model better understand the object represented by the JSON Schema.
- **Description** - _Optional_, used to help the model better understand the purpose of the JSON Schema.
- **Strict** - Requires the model to generate a response strictly according to the JSON Schema structure. Currently, only some new models from OpenAI support this parameter. Please confirm if your model is compatible before enabling it.

## Structured Content Generation Method

The way a model generates structured content depends on the **model** used and its **Response format** configuration:

1. Models where Response format only supports `text`

   - When called, the node will bind a Tool that generates JSON-formatted content based on the JSON Schema, guiding the model to generate a structured response by calling this Tool.

2. Models where Response format supports JSON mode (`json_object`)

   - If JSON mode is selected when called, the user needs to explicitly instruct the model in the Prompt to return in JSON format and provide descriptions for the response fields.
   - In this mode, the JSON Schema is only used to parse the JSON string returned by the model and convert it into the target JSON object.

3. Models where Response format supports JSON Schema (`json_schema`)

   - The JSON Schema is directly used to specify the target response structure for the model.
   - The optional **Strict** parameter requires the model to strictly follow the JSON Schema when generating the response.

4. Ollama local models
   - If a JSON Schema is configured, the node will pass it as the `format` parameter to the model when called.

## Using the Structured Output Result

The structured content of the model's response is saved as a JSON object in the node's Structured content field and can be used by subsequent nodes.



![](https://static-docs.nocobase.com/202503041330291.png)





![](https://static-docs.nocobase.com/202503041331279.png)