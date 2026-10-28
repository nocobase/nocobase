---
'@nocobase/app-plugin-agents': patch
---

`useChatScroll` no longer takes a reader who just scrolled up back to the end when the layout changes (a window resize, content reflow) before the browser delivers their scroll event.
