---
'@nocobase/agent-runner': patch
---

Detect the DeepSeek API key saved in the dsh Web settings (`$DSH_HOME/.credentials.yaml`, `~/.dsh` by default) in addition to `DEEPSEEK_API_KEY`, so a runner whose dsh already has a saved key no longer reports that it needs login.
