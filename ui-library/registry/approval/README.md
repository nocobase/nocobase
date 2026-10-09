# NocoBase approval components

Presentational components for an approval process, installed as one block, `approval-ui`, into `client/extensions/nocobase-approval-ui/` and imported from `#extensions/nocobase-approval-ui/index`. They depend on no plugin and fetch nothing: each takes data already shaped and translated for display, defined in `types.ts`, and the page that renders them maps its own approval data into those shapes. Until a page does, they are only a look; wired to a backend they become the real thing.

| Export                 | Takes                                          | Shows                                                                                                                                                                                                                               |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ApprovalProgress`     | `steps: ApprovalStep[]`, `copies`, `notice`    | Each stage a request went through, the one it is in and the ones ahead, with who decides each, what they answered and when an answer is due, a step several people decide counted against its pass mark, then whom it was copied to |
| `ApprovalTimeline`     | `lines: ApprovalTimelineLine[]`, `foldMuted`   | Everything that happened, oldest first, with what an action changed folded under its line and bookkeeping in a row folded into one line                                                                                             |
| `ApprovalRoutePreview` | `route: ApprovalRoute`, `applicantId`          | Who a new request would go to if it were submitted now: each stop or parallel branch, what added a stop, the stops it skips and why, what blocks it, and notes                                                                      |
| `ApprovalActionBar`    | `actions: ApprovalBarAction[]`, children       | Every action as a button while there are few (`maxButtons`, 4 by default), otherwise the primary ones as buttons and the rest under "More"; administration apart, and a form above the bar for an action that takes input           |
| `ApprovalBranches`     | `branches: ApprovalBranch[]`, `onOpen`         | A request split into parallel parts as a whole: how many of the required parts are finished, who holds each and where, and which one holds the request up                                                                           |
| `ApprovalReceipts`     | `receipts: ApprovalReceipt[]`, `confirm`       | Who a notice reached: how many read it and, when asked to, confirmed it, then each recipient with what they said                                                                                                                    |
| `ApprovalUiProvider`   | `personName`, `renderAvatar`, `formatDateTime` | How the application names and shows people and writes instants                                                                                                                                                                      |

## Wiring data

Write the mapping beside the page, in the application or plugin that knows the approval backend: read its data from your own routes, after your own permission checks, and turn it into the shapes above with your translations applied. Every label arrives as text — a stage's title, a task's state or answer as a badge, a policy such as "everyone approves", a history line's sentence — so the components carry no vocabulary of any backend. People are passed as ids and named through `ApprovalUiProvider`, so a page can show avatars and display names from its own user directory.

```tsx
<ApprovalUiProvider
  personName={nameOf}
  renderAvatar={(id) => <UserAvatar id={id} />}
>
  <ApprovalProgress steps={toSteps(detail)} copies={toCopies(detail)} />
  <ApprovalTimeline lines={toLines(detail)} />
  <ApprovalActionBar actions={toActions(detail)} busy={saving} />
</ApprovalUiProvider>
```

## Counts, deadlines and bookkeeping

A step that several people decide can carry a `tally`: everyone who has a say, the answers so far by kind with a `tone` — `positive`, `negative` or `neutral` — the `needed` positive answers marked on its bar, and its `rules` in words, such as "3 approvals pass" or "the chair may veto". A task still waiting can carry a `due` with its wording and whether it is `overdue`, which the progress shows beside it in the destructive colour once passed. A timeline line with `emphasis: 'muted'` is bookkeeping — a task given out, an approval started, a move the approval made on its own — and two or more in a row fold into one "system updates" line, so the decisions people made stand out; pass `foldMuted={false}` to list them all.

## Forms

An action's form is the page's: the bar draws the frame — its title, an optional `description` under it such as where a return sends the request and which opinions it keeps, the submit and cancel buttons, a loading and a failed state — and calls `render({ values, setValues, invalid, loaded, busy })` for the fields. `validate(values, loaded)` returns the names of the fields that are not valid yet and keeps the form from submitting while there are any. `load(signal)` runs when the form opens, such as paging through the people a task may be handed to, and its signal aborts when the form closes, so a late answer is dropped; `loadError` says what failed. `run` resolving `false` keeps the form open, as after a refusal the page reported. An action without a form runs at once unless it sets `confirm`. Children of the bar are further controls at its end, such as a menu of the page's own.

## Translations

The components translate only their own chrome — "in progress", "Copied to", "Who will decide", "More" and the like — with `useTranslation()` from `@nocobase/i18n/client`, in whichever namespace renders them, under the `approvalUi` key. Installing copies `locales/` but does not merge it, so add it to the locale resources of the namespace that renders the components:

```ts
// client/locales/en-US.ts
import approvalUi from '../extensions/nocobase-approval-ui/locales/en-US.js';

export default { ...approvalUi, ...ownKeys };
```

Every lookup carries its English wording as the default, so a missing key reads as English rather than as the key.

## Styling

The components use the theme tokens only. The progress tells states apart by icon as well as colour: a filled primary dot is done, a ringed one is current, a destructive cross is rejected, and a dashed outline is still ahead. The theme has no success or warning colour, so nothing here uses one; add them to the theme before giving an answer such as approval a colour of its own. Waiting is outlined so a column of people still to answer does not outweigh the answers already given; give answers the stronger variants. The item installs the shadcn `alert`, `badge`, `button` and `dropdown-menu` primitives.
