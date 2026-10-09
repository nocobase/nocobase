---
'@nocobase/agent-protocol': minor
'@nocobase/agent-runner': minor
'@nocobase/app-plugin-agents': minor
---

执行机在协议版本 7 的可选能力字段中上报 Pi、OpenCode 和 Codex 检测到的模型及可读取的思考强度，明确区分检测成功、不支持和失败，并在后台定期刷新。模型数量和字段长度受限，失败原因不包含配置、路径或凭据。服务端保存每台执行机的能力，并按现有可见性返回建议数据，不自动修改 Agent 配置。
