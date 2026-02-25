---
pkg: "@nocobase/plugin-ai"
---

# Text Chat



## Introduction

Using the LLM node in a workflow, you can initiate a conversation with an online LLM service, leveraging the capabilities of large models to assist in completing a series of business processes.



![](https://static-docs.nocobase.com/202503041012091.png)



## Create LLM Node

Since conversations with LLM services are often time-consuming, the LLM node can only be used in asynchronous workflows.



![](https://static-docs.nocobase.com/202503041013363.png)



## Select Model

First, select a connected LLM service. If no LLM service is connected yet, you need to add an LLM service configuration first. See: [LLM Service Management](/ai-employees/features/llm-service)

After selecting a service, the application will attempt to retrieve a list of available models from the LLM service for you to choose from. Some online LLM services may have APIs for fetching models that do not conform to standard API protocols; in such cases, users can also manually enter the model ID.



![](https://static-docs.nocobase.com/202503041013084.png)



## Set Invocation Parameters

You can adjust the parameters for calling the LLM model as needed.



![](https://static-docs.nocobase.com/202503041014778.png)



### Response format

It's worth noting the **Response format** setting. This option is used to prompt the large model for the format of its response, which can be text or JSON. If you select JSON mode, be aware of the following:

- The corresponding LLM model must support being called in JSON mode. Additionally, the user needs to explicitly prompt the LLM to respond in JSON format in the Prompt, for example: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Otherwise, there might be no response, resulting in a `400 status code (no body)` error.
- The response will be a JSON string. The user needs to parse it using the capabilities of other workflow nodes to use its structured content. You can also use the [Structured Output](/ai-employees/workflow/nodes/llm/structured-output) feature.

## Messages

The array of messages sent to the LLM model can include a set of historical messages. Messages support three types:

- System - Usually used to define the role and behavior of the LLM model in the conversation.
- User - The content input by the user.
- Assistant - The content responded by the model.

For user messages, provided the model supports it, you can add multiple pieces of content in a single prompt, corresponding to the `content` parameter. If the model you are using only supports the `content` parameter as a string (which is the case for most models that do not support multi-modal conversations), please split the message into multiple prompts, with each prompt containing only one piece of content. This way, the node will send the content as a string.



![](https://static-docs.nocobase.com/202503041016140.png)



You can use variables in the message content to reference the workflow context.



![](https://static-docs.nocobase.com/202503041017879.png)



## Using the LLM Node's Response Content

You can use the response content of the LLM node as a variable in other nodes.



![](https://static-docs.nocobase.com/202503041018508.png)