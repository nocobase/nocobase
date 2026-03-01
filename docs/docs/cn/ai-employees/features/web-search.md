# 联网搜索

联网搜索用于补充模型训练数据之外的最新信息。

## 工作方式

联网搜索是否可用，取决于当前会话所选模型服务是否支持 Web Search。

- 支持：显示联网搜索开关，可按需开启/关闭。
- 不支持：不显示该开关，且会自动关闭搜索状态。

## 会话中使用

在对话输入区域使用联网搜索开关：

- 打开后，AI 可先检索再回答。

![web-search-switch-visible-on-supported-model.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/web-search-switch-visible-on-supported-model.png)

- 关闭后，AI 仅基于已有上下文回答。

![web-search-switch-hidden-on-unsupported-model.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/web-search-switch-hidden-on-unsupported-model.png)

## 平台差异

不同模型对 Web Search 的支持能力不同，请根据实际情况使用。
