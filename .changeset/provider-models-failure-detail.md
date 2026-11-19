---
'@nocobase/app-plugin-agents': minor
'@nocobase/agent-runner': patch
---

Name agents of a model the catalog does not know readably for every tool (`my-lan-gateway/qwen3.8-flash` → "OpenCode · Qwen3.8 Flash"), give a new agent whose name is taken its provider after the name instead of `#2`, and show two providers' default-named agents of one model each with their provider, without changing saved names. Show every agent's whole model id in the agent list, the edit dialog and conversation details, and its name without the tool, with the whole id on hover, in chips, pickers and the runtime's runs. Show what the coding tool said when a run failed as one line of at most 300 characters, under the runtime's recent runs to people who may read the run's task or conversation; add `failureDetail` to that list and `model`, `shortName` and `modelTitle` to conversation agents. A failed run's message has keys, credentials, labelled and quoted values and long random strings removed when it is stored and again when it is read. OpenCode reports only its own error message as the failure; the stderr tail goes to the runner's log.
