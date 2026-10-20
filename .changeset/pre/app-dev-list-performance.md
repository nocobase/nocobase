---
'@nocobase/app-skills': patch
---

The application development Skill now says how a list, dashboard or chart endpoint stays fast: it reads with a fixed number of queries whatever the row count, aggregates in the database, keeps expensive per-item work on the detail endpoint, answers a small fact from a small endpoint, and has a test that its query count does not grow with the rows; and how the browser keeps such a page live by refreshing only the rows an event names instead of reading the whole list on every event.
