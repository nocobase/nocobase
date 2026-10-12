# Agent Queue

What the agents are doing, as a work queue. One lane per agent, ordered by activity, each showing:

1. **Now**: the issues it runs, with a live elapsed time, the runtime and the last thing the run reported.
2. **Up next**: its queued issues, numbered in claim order, each with why it waits (blocked by another issue, or the wait the consumer words through `formatWait`).
3. **Waiting for reply**: issues it waits on a person for, who that is ("Waiting for you" highlighted), and a "Handle" action that leads to where it is decided.
4. **Assigned, idle**: a folded list of issues it executes with nothing going on, each with why (in backlog, last run completed or failed, the status does not wake the agent, not run yet) and a "Start" action where the viewer may start it (`onStart`). `expandIdle` unfolds it, such as while the page is searched or filtered.

The lane header shows the agent's avatar, name, state, its taken slots (`2/3`, with pips) and "No runtime online" when no runtime could take its work. A thin strip on top sums up running, queued, waiting for the viewer, and how many runtimes are busy and online; an optional "Only mine" switch keeps the viewer's issues (owned, created or followed) and those that wait for them. The viewer's issues carry a small mark. On phones one lane shows at a time, picked from a segmented switcher; from `md` the lanes sit side by side and scroll horizontally.

## Entry points

| File              | Exports                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `agent-queue.tsx` | `AgentQueue`, `AgentQueueProps`                                                                         |
| `types.ts`        | `AgentQueueData` and the row, entry, run, wait and agent types it is made of                            |
| `labels.ts`       | `AgentQueueLabels`, `defaultAgentQueueLabels` (English), `fill`                                         |
| `model.ts`        | `agentQueueLanes`, `agentQueueTotals`, `laneState`, `elapsed`, `waitView` and the other wording helpers |

## Data

The item imports no plugin. `AgentQueueData` mirrors an agent board an application composes from the agents plugin's runs and queue and the projects plugin's issues (in an application, `GET /api/agentBoard`), so such a response can be passed as it is. Keeping it live (refetching on announcements, polling) is the consumer's job.

```tsx
import { AgentQueue } from '#extensions/nocobase-agent-queue/agent-queue';

<AgentQueue
  data={board}
  viewerId={viewer.userId}
  issueHref={(issue) => `/issues/${issue.identifier}`}
  onNavigate={(href) => navigate(href)}
  onlyMine={onlyMine}
  onOnlyMineChange={setOnlyMine}
  onStart={(issue, agentId) => startAgent(issue.id, agentId)}
  formatWait={(wait) => ({
    text: formatRunWait(t, wait),
    blocking: runWaitBlocks(wait),
  })}
  labels={labels}
  locale={i18n.language}
/>;
```

## Translations

The item does not translate. Every word comes from `labels`, which defaults to `defaultAgentQueueLabels` in English. Give it an `AgentQueueLabels` from your own locale resources; placeholders use single braces (`{count}`), which the item fills in and i18next leaves alone, so the object can be read with `t('agentQueue', { returnObjects: true })`.

## Why a run waits

The item knows no wait reason. A queued run's wait carries a code (`reason`, such as `secretsNotAllowed`) and the values its words need (`params`), and the consumer words it with `formatWait`, which answers the text, an optional `detail` shown on hover and whether it is `blocking` (drawn as a warning). In an application with the agents plugin, `formatRunWait(t, wait)` and `runWaitBlocks(wait)` from `@nocobase/app-plugin-agents/client/runs` do this in the plugin's own translations, which the application may override; without `formatWait` the reason code is shown. A reason the plugin adds later therefore needs no change to this copy.

## Customizing

The installed copy is yours: change the lane order in `agentQueueLanes`, the colours in `agent-queue.tsx`, or what a lane shows.
