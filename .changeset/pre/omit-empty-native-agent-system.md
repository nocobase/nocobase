---
'@nocobase/app-plugin-agents': patch
---

Omit empty or whitespace-only system instructions from native agent model requests instead of sending an empty system message rejected by Moonshot/Kimi and other strict providers. Preserve nonempty instructions verbatim and keep extracted attachment content in user messages.
