---
pkg: "@nocobase/plugin-ai"
title: "AI 员工联网搜索"
description: "联网搜索补充模型训练数据之外的最新信息，取决于模型是否支持 Web Search，在对话输入区域开启/关闭。"
keywords: "联网搜索,Web Search,AI 检索,NocoBase"
---

# 联网搜索

联网搜索用于补充模型训练数据之外的最新信息。

## 工作方式

联网搜索是否可用，取决于当前会话所选模型服务是否支持 Web Search。

- 支持：显示联网搜索开关，可按需开启/关闭。
- 不支持：不显示该开关，且会自动关闭搜索状态。

## 会话中使用

在对话输入区域使用联网搜索开关：

- 打开后，AI 会根据上下文提炼出关键词，然后调用工具进行搜索，最后结合搜索结果回复。

![20260420155024](https://static-docs.nocobase.com/20260420155024.png)

- 关闭后，AI 仅基于已有上下文回答。

![20260420154948](https://static-docs.nocobase.com/20260420154948.png)

## 平台差异

不同 LLM 服务平台对 Web Search 的支持能力不同，请根据实际情况使用。

下面几个 LLM 服务支持联网搜索：

- OpenAI（注意 OpenAI (completions) 不支持）
- Google Generative AI
- Dashscope
