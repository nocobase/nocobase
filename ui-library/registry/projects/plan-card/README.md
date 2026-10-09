# Plan card

An operation plan of the projects plugin as the application's own source: the card with the plan's changes row by row (what each creates or changes, as "was → becomes" for an update, whom it wakes and what it risks, its error, and once executed a link to what it made), the second confirmation before executing risky rows or voiding, the undo dialog with its preview of what will be reverted and what is left alone, and the editor of an open plan's rows. It installs into `client/extensions/nocobase-plan-card/`.

Everything that has to stay consistent across upgrades stays in `@nocobase/app-plugin-projects`. The plan as pure data — its effective status, what may be done with it, its rows with unsaved edits applied, indenting and outdenting new issues, the edit request, its countdown, the hues of its statuses and risk flags — comes from `@nocobase/app-plugin-projects/client/plan-model`. Reading and acting come from the hooks in `@nocobase/app-plugin-projects/client/kit`: `usePlanQuery`, `usePlanMutations` (execute, check again and void with the plan's revision, edit, undo; a conflict reloads the plan, and executing or undoing refreshes issues and projects), `usePlanUndoPreview` (the dry run), `usePlanLookup`, `usePlanIssue` and `useCreateLabel` for names and choices, and `useViewer` with `canUseSetting`. What the plugin words for a plan stays in its namespace wherever the card renders: a row's heading (`usePlanRowTitle`), a field's value (`usePlanValueText`), a failure (`usePlanErrorText`), and a plan's title and description (`usePlanWording`, which `PlanWordingContext` lets the application reword).

| File                   | Exports                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `plan-card.tsx`        | `PlanCard`, `PlanCardProps` and `PlanCardParts`, what `frame` lays out                                           |
| `plan-row.tsx`         | `PlanRowItem`, one change as a list item, and `WakeTags`                                                         |
| `plan-editor.tsx`      | `PlanEditor`, the rows as an editable table over `property-fields`, with `PlanEditorProps` and `PlanEditorState` |
| `plan-confirm.tsx`     | `usePlanConfirm`: the second confirmation of executing risky rows and of voiding                                 |
| `plan-undo.tsx`        | `PlanUndoDialog`                                                                                                 |
| `plan-issue-links.tsx` | `PlanIssueLinks`, the issues a plan is about as links under its title                                            |
| `plan-issues.ts`       | `planIssues`, the issues a plan is about as data, and `PlanIssueHref`                                            |
| `plan-tag.tsx`         | `PlanTag`, a pill in a plan hue, and `PlanStatusTag`                                                             |
| `plan-text.ts`         | `usePlanCardText`, `usePlanNotify`, `fieldLabel` and `relativeTime`                                              |
| `locales/en-US.ts`     | the English resource (default export) and its `PlanCardLocale` type                                              |
| `locales/zh-CN.ts`     | the Chinese resource                                                                                             |

It installs `property-fields` and `markdown-view` beside it, in `client/components/`: the editor's project, priority, owner and executor selects (an agent with its icon, a person with theirs), its label chips with their colour dots and creation, and the dates of an update are `property-fields`; a new issue's description and a comment are `markdown-view`.

## Prerequisites

- `@nocobase/app-plugin-projects` registered on the server and the client.
- A `QueryClientProvider` above the card whose cache the plugin's plan announcements refresh — the application client's. When the card renders under another cache, such as a chat panel's, wrap it in the application's.
- A router: the title links to the plan's page (`/issues/plans/:planId`), the plan's issues to theirs (`/issues/:key`), and an executed row to what it made (`/issues/:issueId`, `/projects/:projectId`), the plugin's routes.

## Wiring

```tsx
import { PlanCard } from '#extensions/nocobase-plan-card/plan-card';

<PlanCard planId={plan.id} plan={plan} />;
```

`plan` is optional: pass it when the page has listed the plan already, and the card keeps it current from there. `defaultExpanded` overrides whether the rows show at first (a closed plan folds by default), `editable={false}` hides Edit, `linkTitle={false}` drops the link on a plan's own page, and `onChange` hears the plan after each action.

Under its title the card links each issue the plan is about: its source issue, the issues its rows change, comment on or link, the parents and blockers of the issues it creates and, once executed, the issues it created. `firstIssueId` puts the issue the plan was opened from first, and `issueHref` decides where each link goes, such as back to the issue page a plan was opened over rather than a new copy of it.

`frame` lays the plan out in the caller's own frame instead of the card, so a page that already has a header for it, such as an inbox's detail pane, shows one title rather than two: the function receives the plan's `title` and `href`, its facts as `meta`, its `actions` at the default button size (execute primary, the others outline), and its `content` (the plan's issues, description, notices and rows, always shown, with the dialogs the actions open), and returns what renders.

```tsx
<PlanCard
  planId={planId}
  frame={({ title, href, meta, actions, content }) => (
    <article>
      <InboxDetailHeader titleId='plan-title' title={title} href={href} meta={meta} actions={actions} … />
      {content}
    </article>
  )}
/>
```

A plan another plugin proposed may be stored in English, such as a status rule's suggestion. Provide `PlanWordingContext` from `@nocobase/app-plugin-projects/client/kit` with a function answering its title and description in the reader's language, or null to keep what is stored.

`PlanEditor` works on its own too, such as a page that drafts issues and creates them: give it `onExecuted` for the footer's execute button ("Create N issues" when every row creates one), `rowMarks` to highlight what a revision changed, `below` for something between the table and the footer, and `locked` while something else revises the rows.

## Translations

The card looks up `planCard.*` keys in the namespace it renders in, each with its English text as the default. Spread the block's resources into the application's locale files, which installing does not do:

```ts
import planCardEnUS from '#extensions/nocobase-plan-card/locales/en-US';

const enUS = {
  ...planCardEnUS,
  // The application's own keys, which may reword the card's.
};
```

The values a row shows (status, priority and label names, people, projects), the row headings and the failures come from the projects plugin's own translations, so they need nothing here.

## Customizing

The block holds no state that must survive an upgrade: change the layout, the wording or the fields freely. Keep the actions on `usePlanMutations`, which carries the plan's revision and refreshes what the plan changed, and the plan rules on `client/plan-model`, so the card stays in step with the server's.
