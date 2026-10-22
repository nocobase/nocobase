# NocoBase task center components

Presentational components for a person's task center, installed as one block, `task-center-ui`, into `client/extensions/nocobase-task-center-ui/` and imported from `#extensions/nocobase-task-center-ui/index`. They depend on no plugin and fetch nothing. The page that renders them reads its task index, such as `@nocobase/app-plugin-task-center`'s `/api/userTasks`, maps it into the shapes in `types.ts` with its translations applied, and decides what each task type contributes.

The page is layered, each layer narrowing the one above:

```text
TaskCenterLayout
├── TaskSourceNav        sources, each with its subjects folded under it; pending counts; subject search
└── list column
    ├── TaskBulkBar      sticky top row; while tasks are checked, the batch toolbar takes the tabs' place
    │   └── TaskStatusTabs   To do (default) / Done / All, with counts for the selected source and subject
    ├── TaskList         cards grouped by day; each TaskCard shows title, status, time and its type's summary
    └── TaskPagination
TaskBulkConfirm          confirms a batch action, listing its tasks
TaskDetailSheet          right-side drawer opened from a card; its body and actions come from the task's type
```

| Export                                                  | Takes                                                         | Shows                                                                                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TaskCenterLayout`                                      | `navigation`, children, `label`                               | A 16rem navigation column beside the list from the large breakpoint, kept in view while the list scrolls; stacked on smaller screens                                                                                          |
| `TaskSourceNav`                                         | `sources: TaskNavSource[]`, `source`, `subject`, `onSelect`   | Sources with icons and pending counts, their subjects as collapsible menus, and a search that filters subjects by name and unfolds every source with a match                                                                  |
| `TaskStatusTabs`                                        | `value`, `onValueChange`, `counts`, `labels`                  | To do, Done and All as line tabs over a full-width divider; the tabs keep their width from the small breakpoint and fill a phone's width                                                                                      |
| `TaskList`                                              | `tasks: TaskCardData[]`, `selection`, `onOpen`, `showSubject` | Cards under Today, Yesterday and Earlier                                                                                                                                                                                      |
| `TaskCard`                                              | `task`, `selection`, `onOpen`                                 | Title, status badge, subject and relative time, then `task.summary`; with `onOpen` the whole card opens the task, and the checkbox column stays separately clickable                                                          |
| `TaskSummaryFields`                                     | `items: [label, value][]`                                     | The inset a type renders its summary with: label over value in two or three columns                                                                                                                                           |
| `TaskListEmpty`, `TaskListSkeleton`                     | `status`, `onShowAll`                                         | The empty tab, with "Show all" except on All, and three placeholder cards                                                                                                                                                     |
| `TaskPagination`                                        | `page`, `pageCount`, `total`, `onPageChange`                  | Previous and next with where the reader is; nothing for one page                                                                                                                                                              |
| `useTaskSelection`                                      | `tasks`, `canSelect`, `scope`, `subjectLabel`                 | The selection state for `TaskList`: one subject at a time, other subjects locked until the selection is empty                                                                                                                 |
| `TaskBulkBar`, `TaskBulkConfirm`                        | `actions: TaskBulkActionView[]`, children; `title`, `tasks`   | The list's sticky top row: its children (the tabs), replaced in place while tasks are checked by the selected count, clear and one button per contributed action; the confirmation listing the tasks and how many are skipped |
| `TaskDetailSheet`, `TaskDetailBody`, `TaskDetailFooter` | `task`, children, `busy`, `onClose`                           | The task's title, status, subject and time in a fixed header, the type's detail and form in a scrolling body, and the type's actions in a fixed footer                                                                        |
| `matchesTaskStatusTab`, `useTaskTime`                   | —                                                             | Which tab a status belongs to, and the relative and absolute times the cards show                                                                                                                                             |

## Wiring data

Keep the selected source, subject, tab and page in the URL. Navigation counts are pending counts and do not follow the status tab: the To do / Done / All choice narrows only the list. Selecting another source clears the subject and the tab; selecting another subject clears the tab.

```tsx
<TaskCenterLayout
  label={scopeLabel}
  navigation={
    <TaskSourceNav
      sources={navSources}
      source={source}
      subject={subject}
      onSelect={select}
    />
  }
>
  <TaskBulkBar
    count={selection.selected.length}
    actions={bulkActions}
    onRun={confirm}
    onClear={selection.clear}
  >
    <TaskStatusTabs value={status} counts={counts} onValueChange={setStatus} />
  </TaskBulkBar>
  <TaskList
    tasks={cards}
    selection={selection.list}
    onOpen={setOpened}
    showSubject={!subject}
  />
  <TaskPagination
    page={page}
    pageCount={pageCount}
    total={total}
    onPageChange={setPage}
  />
</TaskCenterLayout>
```

`TaskCardData.time` is when a pending task arrived and when a closed one closed; sort the list by it. `status` is the index's `pending`, `completed` or `cancelled`, and `statusLabel` is how the source words it, such as "In review" for a request of one's own or "Unread" for a copy.

## What a task type contributes

The components never render business content of their own. Keep a registry beside the page, keyed by source and subject, through which each task type contributes:

- **A summary**: a node in `TaskCardData.summary`, usually `TaskSummaryFields`. A type without one shows no summary; never fall back to listing raw fields.
- **Batch actions**: shown in `TaskBulkBar` once a task of that type is checked. `canSelect` of `useTaskSelection` says whether any action of the task's type applies to it, normally only while it is pending. The first checked task fixes the subject, and tasks of other subjects stay disabled, since an action means different things to different types. Open tasks whose type has none show a disabled checkbox. Run an action through the type's own batch API, which must check each task again on the server and may succeed for only some of them.
- **The detail drawer's content**: one component per type rendered as `TaskDetailSheet`'s children, with the business detail and the form for handling the task in a `TaskDetailBody` and its actions in a `TaskDetailFooter`, so the actions read the form's state. Pass `busy` while an action submits, then close the drawer and refresh the list.

## Translations

The components translate only their own chrome — the tabs, day groups, empty states, selection hints and the bulk bar — with `useTranslation()` from `@nocobase/i18n/client`, in whichever namespace renders them, under the `taskCenterUi` key. Installing copies `locales/` but does not merge it, so add it to the locale resources of the namespace that renders the components:

```ts
// client/locales/en-US.ts
import taskCenterUi from '../extensions/nocobase-task-center-ui/locales/en-US.js';

export default { ...taskCenterUi, ...ownKeys };
```

Every lookup carries its English wording as the default, so a missing key reads as English rather than as the key.

## Styling

The components use the theme tokens only. The batch toolbar is tinted with the primary colour so the row reads as a different mode from the tabs it covers. The navigation column is fixed at 16rem so that source names and counts line up and the list keeps the rest. A pending task's icon tile and the To do count take the primary colour; closed tasks are dimmed. The theme has no success or warning colour, so the status badge is `secondary` while pending and `outline` once closed; set `statusVariant` on a task to override it. The item installs the shadcn `alert-dialog`, `badge`, `button`, `card`, `checkbox`, `collapsible`, `empty`, `input-group`, `sheet`, `skeleton`, `spinner` and `tabs` primitives.
