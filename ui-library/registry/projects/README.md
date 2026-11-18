# Projects

A project's and an issue's pages, presented: the `project-detail` and `issue-detail` blocks, the `plan-card` block over the projects plugin's operation plans (each with its own README), and the `issue-table` and `issue-card` components. The blocks list them in `registryDependencies` and import them as `#components/issue-table` and `#components/issue-card`, where they are installed.

| Item          | Installs                                                                             | Exports                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `issue-table` | `client/components/issue-table.tsx`, `status-icon.tsx`, `status-shapes.ts` beside it | `IssueTable`, `IssueStatusBadge`, `IssuePriority`, `IssuePerson`, `IssueTableSortButton`; `StatusIcon`, `StatusName` |
| `issue-card`  | `client/components/issue-card.tsx`                                                   | `IssueCard`, `IssueCardSkeleton`                                                                                     |

## Issue table

`issue-table` installs into `client/components/` like the generic components, with `status-icon.tsx` and `status-shapes.ts`, which draw a status as its shape in the projects plugin's colours (a dashed ring for not started, half filled for in progress, a pause for blocked, three quarters for in review, a check for done and a cross for cancelled). It lists issues with their identifier, title and labels, status, priority, owner, project and last update, on the shadcn `Table`; an owner of `kind: 'agent'` shows the agents plugin's `AgentAvatar`. It is presentational: map your issues (such as the projects plugin's `IssueListItem`) to `IssueTableRow`, and give a status its `key` to draw it as its shape rather than a coloured badge. `sort` with `onSortChange` makes the identifier, priority and updated headers sortable, and `IssueTableSortButton` makes a header of your own sortable the same way; `selectedIds` with `onSelectedIdsChange` adds checkboxes, `rowHref` makes the identifier a link, `onRowClick` hears a plain click, `rowAction` adds something at the end of a row and `rowMarks` small marks after its title. `extraColumns` adds columns after the title, `hideProject` leaves the project column out, `entries` puts full-width rows such as group headings between the rows, `rowLeading`, `rowDescription` and `rowClassName` adjust a row, and `compactOnPhone` keeps only the title and status as columns below `md`, for a list that repeats the rest under the title with `rowDescription`. Every word comes from `labels` (English by default); the component ships no locale keys.

This is the version NocoBase Studio uses; Studio keeps its copy in a shared package of its own, and a change made there is brought back here.

## Issue card

`issue-card` installs into `client/components/` beside `issue-table`, which it lists in `registryDependencies` and imports as `#components/issue-table` for the status badge, the priority icon and the person. It shows one issue: its identifier and title, and whatever `IssueCardIssue` carries of its status, priority, owner and executor, due date and labels. `size='row'` is one line for lists and `size='card'` stacks the same parts for a board; `appearance='plain'` drops its own border and background for a list or a board card that draws them. With `href` the whole card is one link (pass `link` to draw it with a router link), with `onSelect` one button, and with both a plain click calls `onSelect` while modifier clicks keep the browser's behaviour; either is named by the identifier and the title. `leading` goes before the identifier, `marks` after the title (a row) or under the labels (a card), and `trailing` at the end; `marks` and `trailing` sit above the link, so buttons there stay clickable. `IssueCardSkeleton` holds its place while the issue loads.

## Translations

`issue-card` translates its few words with `useTranslation()` from `@nocobase/i18n/client`, and `labels` replaces them. A component ships no locale file, so add the keys to the locale resources of the namespace that renders it:

| Key                         | `en-US`                | `zh-CN`               |
| --------------------------- | ---------------------- | --------------------- |
| `issueCard.priority.urgent` | Urgent                 | 紧急                  |
| `issueCard.priority.high`   | High                   | 高                    |
| `issueCard.priority.medium` | Medium                 | 中                    |
| `issueCard.priority.low`    | Low                    | 低                    |
| `issueCard.due`             | Due {{date}}           | {{date}} 到期         |
| `issueCard.overdue`         | Overdue since {{date}} | 已逾期，{{date}} 到期 |
| `issueCard.owner`           | Owner                  | 负责人                |
| `issueCard.executor`        | Executor               | 执行者                |
| `issueCard.loading`         | Loading issue          | 正在加载任务          |

`issue-table` translates nothing: every word comes from its `labels` prop.
