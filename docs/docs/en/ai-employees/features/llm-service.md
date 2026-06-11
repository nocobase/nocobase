---
pkg: '@nocobase/plugin-ai'
title: 'Configure LLM Service'
description: 'Configure LLM services available for AI Employees. Supports OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi, and Ollama. Includes creating services, enabling/sorting, and availability testing.'
keywords: 'LLM Service,OpenAI,Claude,Gemini,DeepSeek,Ollama,NocoBase AI'
---

# Configure LLM Service

Before using AI Employees, configure available LLM services first.

Supported providers include OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi, and Ollama local models.

## Create Service

Go to `System Settings -> AI Employees -> LLM service`.

1. Click `Add New` to open the creation dialog.
2. Select `Provider`.
3. Fill `Title`, `API Key`, and `Base URL` (optional).
4. Configure `Enabled Models`:
   - `Select models`: select from the provider model list.
   - `Manual input`: manually enter model ID and display name when the model list cannot be retrieved from the provider API.
5. Click `Submit` to save.

![20260425172809](https://static-docs.nocobase.com/20260425172809.png)

## Enable and Sort Services

In the LLM service list, you can:

- Toggle service status with the `Enabled` switch.
- Drag to reorder services (affects model display order).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Availability Test

Use `Test flight` at the bottom of the service dialog to verify service and model availability.

It is recommended to run this test before production use.
