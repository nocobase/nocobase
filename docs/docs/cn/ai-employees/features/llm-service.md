
# 配置 LLM 服务

在使用 AI 员工之前，需要先接入在线 LLM 服务。

NocoBase 目前支持主流的在线 LLM 服务，如 OpenAI, Gemini, Claude, DeepSeek, Qwen（阿里千问）等。

除了在线 LLM 服务，NocoBase 也支持 Ollama 本地模型的接入。


## 选择 LLM 服务
进入 AI 员工插件配置页面，点击 `LLM service` 标签页，进入 LLM 服务管理页。

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

鼠标在 LLM 服务列表右上角的 `Add New` 按钮上悬停，选择要使用的 LLM 服务

![20251021213358](https://static-docs.nocobase.com/20251021213358.png)

这里以 OpenAI 为例，在弹窗中输入一个易于记忆的 `title`，然后输入在 OpenAI 获取的 `API key`，点击 `Submit` 保存，即可完成 LLM 服务配置。

`Base URL` 通常留空即可，假如你正在使用兼容 OpenAI 接口的第三方 LLM 服务，请填写对应的 Base URL。

![20251021214549](https://static-docs.nocobase.com/20251021214549.png)

## 可用性测试

在 LLM 服务配置页面，点击 `Test flight` 按钮，输入想要使用的模型名称，点击 `Run` 按钮，即可测试 LLM 服务及模型是否可用。

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)
