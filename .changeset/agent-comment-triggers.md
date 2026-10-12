---
"@nocobase/app-plugin-projects": minor
"@nocobase/studio": minor
---

Let an agent's comment wake other agents, so one agent can hand work to another and be woken by its reply. A comment of anyone but the system now reaches the work handlers, with the person it was written for (`CommentChange.userId`). In Studio, an agent's comment wakes the agents it mentions and the agent whose comment it answers, never itself and never the executor by default, as the person its run acts for (the issue's owner when no run wrote it). A workflow's new `commentRunLimit` (20 by default, edited in the workflow's Limits card or through `definition.commentRunLimit`) caps such runs per issue within 24 hours; past it the comment starts nothing (`work_skipped`, reason `limited`), the owner is notified, and a person who may edit the issue can continue it once from the issue page.
