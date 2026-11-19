---
'@nocobase/app-plugin-agents': minor
'@nocobase/agent-runner': patch
---

Show OpenCode and Pi models with their provider (`OpenCode · my-lan-gateway/qwen3.8-flash`) in available models, new agent names, the agent list, the edit dialog and conversation details, so one model reached through two providers is no longer shown twice under the same name. Show what the coding tool said when a run failed, as one line of at most 300 characters, under the runtime's recent runs to people who may read the run's task or conversation, and add `failureDetail` to that list and an optional `model` to a conversation's agent. A failed run's message has `sk-…` keys, `Bearer …` credentials, values after `key=`, `token=` or `apiKey:` and long random strings removed when it is stored and again whenever it is read. OpenCode reports only its own error message as the failure; the stderr tail goes to the runner's log.
