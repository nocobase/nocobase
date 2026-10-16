---
'@nocobase/app-plugin-agents': minor
---

The agent queue reads a fixed number of queries however many runs are held or queued: each queued row carries the claim rules' quick explanation, the newest activity of all held runs takes two reads, and the exact reason a queued run waits is read only when its row is unfolded (`RunService.queueWait`, `GET /api/agentBoard/issues/:issueId/agents/:agentId/wait`). The queue refreshes from coalesced announcements with a 45-second fallback poll, and the agents' work marks on issue lists refresh only for announcements about the issues shown, with a 60-second fallback poll.
