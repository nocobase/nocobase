# Approval review

`@nocobase/approval-review` is an editable UI Library block for structured AI suggestions. It has no backend or commercial dependency. Check for an existing `client/extensions/nocobase-approval-review/` before installing; reuse it instead of recreating the UI. The maintained source is the UI Library Registry; installed copies belong to their application or plugin. Merge future Library changes into customized copies deliberately.

## Install

Configure `@nocobase` as `https://ui.nocobase.com/r/{name}.json` in `components.json`, then run from the owning application or plugin directory:

```bash
pnpm exec shadcn add @nocobase/approval-review --dry-run
pnpm exec shadcn add @nocobase/approval-review
```

This requires the Registry deployment containing this item. Before deployment use the built `/r/approval-review.json` URL from a local registry. Inside the NocoBase source workspace, follow [UI Library usage](https://ui.nocobase.com): copy every Registry file to its declared target and declare workspace/catalog dependencies. Do not run dependency-changing `shadcn add` against workspace manifests. Preserve existing primitives.

The block installs under `client/extensions/nocobase-approval-review/`; import `ApprovalReviewCard` and its types from `./extensions/nocobase-approval-review/index.js` relative to your client module. It installs `@nocobase/long-text` under `client/components/`, and uses button, badge, card, alert, popover, dropdown-menu, collapsible and tooltip primitives. Runtime dependencies are `@nocobase/i18n`, `lucide-react`, plus LongText's `cn` and the primitives' `@base-ui/react` and `class-variance-authority`. Client dependencies are peers in a plugin. Keep package-local `#components/*` mappings targeting client sources in development and compiled dist files when published, with the development condition pointing to `./client/*` and the published default pointing to `./dist/client/*`.

Merge each of the ten locale files into the matching owner locale, before owner overrides. For a plugin with isolated declarations:

```ts
import review, {
  type ApprovalReviewLocale,
} from '../extensions/nocobase-approval-review/locales/en-US.js';
const locale: ApprovalReviewLocale & { pageTitle: string } = {
  ...review,
  pageTitle: 'Approval',
};
export default locale;
```

Register those locales in the rendering namespace. All ten languages ship; missing registration falls back to English. Include installed `client/` source in the host's Tailwind scan, including plugin files (restart the development host after adding files). No CSS bundle or host-private source is imported. New upstream primitives may need explicit return/variant types for plugin `isolatedDeclarations`; preserve the target’s annotated primitives. The local installation acceptance uses maintained primitives and tests declaration output without changing installed files. Run the target's lint, typecheck, test and build and render in its actual theme.

## Controlled contract

`ReviewSnapshot` contains the displayed structured report: status, optional validated nextStep, findings, material coverage, basis, model, generatedAt and taskOpen. The next-step wording comes from the validated report; the UI never infers a recommendation from verdict counts. Older structured reports without that field show no invented recommendation. `ReviewFinding` contains checkId, title, verdict, summary and evidence. Verdicts are conforms, nonconforming, needs_verification and not_covered. Material status is read, partial_read, not_supported or missing. Map truncated material to partial_read and include the actual supplied range in its label; partial reads are listed and counted separately from fully read materials. Missing, unread and partially read material never establishes definitive conformity. Validate reports on the server; this renderer does not validate evidence or make approval decisions. Evidence is displayed as text unless the owner supplies `renderEvidence` with its own authorized navigation.

`status` is the latest attempt, independent from `review.status`. Keep a previous successful snapshot when the latest attempt runs, fails or is cancelled only while that snapshot remains authorized. `versions`, `selectedVersionId` and `onSelectVersion` control selection; changing versions only reads local authorized data. `attempts` is ordered generation history, including failures and inaccessible results. Only versions with authorized reports are selectable. Reconcile selection in the adapter when a version loses authorization.

```tsx
import {
  ApprovalReviewCard,
  type ReviewSnapshot,
  type ReviewStatus,
} from './extensions/nocobase-approval-review/index.js';

export function Suggestion({
  report,
  status,
  canGenerate,
  generate,
}: {
  report: ReviewSnapshot;
  status: ReviewStatus;
  canGenerate: boolean;
  generate: () => Promise<void>;
}) {
  return (
    <ApprovalReviewCard
      review={report}
      status={status}
      canGenerate={canGenerate}
      onGenerate={generate}
    />
  );
}
```

Supply `pending`, `cancelling`, `refreshing`, `canGenerate`, `canCancel`, `readOnly` and `disabledReason` from the host. `onGenerate`, `onCancel` and `onRefresh` accept void or Promise callbacks. Prefer promises: controls lock immediately until settlement; void callbacks must acknowledge through controlled status/busy props. Local guards prevent accidental duplicate clicks, but servers must deduplicate across mounts, tabs and network retries. `error` is a status-read/transport recovery slot; `failure` describes generation failure. `onActionError` lets the owner reconcile uncertain mutation results. A latest-generation failure may retain still-authorized historical versions. A status-read failure means access cannot be revalidated: the adapter must clear the displayed report and selectable versions, disable mutations, and offer read-only `onRefresh` until an authorized read succeeds. Clear `nextStep`, `findings`, `coverage`, `basis`, `model` and `generatedAt`, and reset `review.status` to `none`; passing an `error` slot alone does not clear controlled report props. Refreshing, mounting and version selection must never generate.

The adapter owns authenticated reads, permissions, task identity, model configuration access, generation request identity and idempotency, business routes, structured validation, Realtime subscription and retry reconciliation. Keep one request identity after an uncertain response; allocate a new one only for a deliberate new generation. Invalidation events contain no report data: reread authorized state on readiness, reconnect and invalidation. Installation alone does not register services, configure a model, grant access or enable post-approval history. The current Approval service allows only actionable assigned tasks; do not broaden that policy to expose completed-task reports.

Customize through existing props, evidence slots and composition first, then edit project-owned installed source. No plain-text mode, conversations, chat history or follow-up API is included. Installing Approval Example is not required.
