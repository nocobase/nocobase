---
'@nocobase/app-plugin-agents': patch
---

Strip NUL characters from what runners report — run events, summaries, failure details and job events — before storing it. PostgreSQL refuses NUL in text and JSON columns, so one event carrying a NUL byte in tool output failed every later events upload of its run.
