# Projects

A project's and an issue's pages, presented: the `project-detail` and `issue-detail` blocks, the `plan-card` block over the projects plugin's operation plans (each with its own README), and the `issue-table` and `issue-card` components. The blocks list them in `registryDependencies` and import them as `#components/issue-table` and `#components/issue-card`, where they are installed.

| Item          | Installs                            | Exports                                                          |
| ------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `issue-table` | `client/components/issue-table.tsx` | `IssueTable`, `IssueStatusBadge`, `IssuePriority`, `IssuePerson` |
| `issue-card`  | `client/components/issue-card.tsx`  | `IssueCard`, `IssueCardSkeleton`                                 |

## Issue table

`issue-table` installs into `client/components/` like the generic components. It lists issues with their identifier, title and labels, status, priority, owner, executor and last update, on the shadcn `Table`. It is presentational: map your issues (such as the projects plugin's `IssueListItem`) to `IssueTableRow`; `sort` with `onSortChange` makes the identifier, priority and updated headers sortable, `selectedIds` with `onSelectedIdsChange` adds checkboxes, `rowHref` makes the identifier a link, `onRowClick` hears a plain click, `rowAction` adds something at the end of a row and `rowMarks` small marks after its title. Every word comes from `labels` (English by default); the component ships no locale keys.

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
