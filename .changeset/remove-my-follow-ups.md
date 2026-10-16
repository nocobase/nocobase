---
'@nocobase/studio': patch
---

Remove the My follow-ups page: My tasks lists the followed tasks first, and the task detail shows each one live. The sidebar entry is gone, and `/follow-ups` links lead to My tasks with their query kept, so `?issue=` still selects the task. The follow star, the follow group's unread counts and the `/api/followUps` routes behind them and `nb-studio follow-up` remain.
