# 配置 LLM 服务

在使用 AI 员工前，需要先配置可用的 LLM 服务。

当前支持 OpenAI、Gemini、Claude、DeepSeek、Qwen、Kimi，以及 Ollama 本地模型。

## 新建服务

进入 `系统设置 -> AI 员工 -> LLM service`。

1. 点击 `Add New` 打开新建弹窗。
2. 选择 `Provider`。
3. 填写 `Title`、`API Key`、`Base URL`（可选）。
4. 配置 `Enabled Models`：
   - `Recommended models`：使用官方推荐模型。
   - `Select models`：从 Provider 返回列表中选择。
   - `Manual input`：手动录入模型 ID 与显示名。
5. 点击 `Submit` 保存。

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## 服务启用与排序

在 LLM 服务列表中可以直接：

- 使用 `Enabled` 开关启停服务。
- 拖拽排序服务顺序（影响模型展示顺序）。

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## 可用性测试

在服务配置弹窗底部使用 `Test flight` 测试服务与模型可用性。

建议先测试再投入业务使用。
