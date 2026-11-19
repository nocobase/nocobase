---
'@nocobase/app-plugin-agents': minor
'@nocobase/agent-protocol': patch
---

Show OpenCode and Pi models with their provider (`OpenCode · my-lan-gateway/qwen3.8-flash`) in available models, new agent names, the agent list, the edit dialog and conversation details, so one model reached through two providers is no longer shown twice under the same name. Show what the coding tool said when a run failed under the runtime's recent runs, and add `failureDetail` to that list and an optional `model` to a conversation's agent. Redact labelled secrets without a recognisable shape (`"apiKey": "…"`, `MY_GATEWAY_TOKEN=…`) from run output and failure details.
