---
'@nocobase/app-plugin-ai-employee': patch
---

Tool messages and the tool replies written when a tool call is interrupted get their ids from the application's id generator, like every other message. They were given random UUIDs, which the bigint `aiToolMessages.id` and `aiMessages.messageId` columns reject on PostgreSQL and MySQL, so on those databases every agent tool call failed to save and the run stopped with `Tool call messageId is required`. SQLite stored the strings.
