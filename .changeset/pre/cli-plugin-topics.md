---
'@nocobase/app-cli': minor
'@nocobase/hub-cli': patch
---

`defineCliPlugin` accepts `topics`, a one-line description for each topic nested under the plugin's own, keyed like a command name without its last part: `topics: { remote: '…' }` describes the topic holding `remote:add` and `remote:list`. `--help` and `pnpm nocobase commands` show it for the nested topic instead of one of its commands' summaries, and only where a command under it is registered, so a deployment without the development commands lists no empty topic. A described topic with no command under it, or with an empty description, is rejected. `@nocobase/hub-cli` describes its `hub remote` and `hub auth` topics.
