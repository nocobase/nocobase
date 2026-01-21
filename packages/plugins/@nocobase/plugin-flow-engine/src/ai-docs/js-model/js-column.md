# JSColumnModel presets

JSColumnModel renders table cells with raw JavaScript. The CRM-oriented presets below live in `.md` files but only use plain JavaScript (no imports). Each file contains named helper functions that expect the standard JS column context (`ctx.element`, `ctx.record`, `ctx.viewer`, `ctx.React` if you want JSX). Copy the helper and either call it (`renderAccountIdentityColumn(ctx);`) or inline the body inside your column.

## When to reuse these files

- **Accounts table columns** – `@nocobase/plugin-flow-engine/js-model/example/js-column/js_columns_for_accounts_en.md`
  - `renderAccountIdentityColumn`: clickable name + industry/type badges.
  - `renderAccountHealthScore`: dynamic bar that scores data completeness.
  - `renderAccountRelationshipBadges`: drawers that list related leads/contacts/opportunities.
  - `renderAccountRevenuePotential`: compares annual revenue with pipeline value.
- **Contacts table columns** – `@nocobase/plugin-flow-engine/js-model/example/js-column/js_columns_for_contacts_en.md`
  - `renderContactIdentityColumn`: avatar, role, and parent account in a single cell.
  - `renderContactEngagementColumn`: last interaction channel/time indicator.
  - `renderContactChannelColumn`: preferred outreach channel with quick actions.
- **Opportunities pipeline columns** – `@nocobase/plugin-flow-engine/js-model/example/js-column/js_columns_for_opportunities_en.md`
  - `renderOpportunityStageTracker`: highlight where the deal currently sits.
  - `renderOpportunitySummary`: show owner/account/value at a glance.
  - `renderOpportunityStakeholderColumn`: chip list + drawer for stakeholders.
- **Quotation review columns** – `@nocobase/plugin-flow-engine/js-model/example/js-column/js_columns_for_quotations_en.md`
  - `renderQuoteSummaryColumn`: quote number, client, amount, expiry.
  - `renderQuoteFinancialsColumn`: discount, margin, and top line items.
  - `renderQuoteStatusColumn`: approval badge with remaining validity.
- **Support ticket queues** – `@nocobase/plugin-flow-engine/js-model/example/js-column/js_columns_for_tickets_en.md`
  - `renderTicketStatusColumn`: status/priority pill with requester context.
  - `renderTicketAgingColumn`: SLA usage meter and last reply time.
  - `renderTicketAssignmentColumn`: assignee details with action buttons.

## How to use the presets

1. Open the TypeScript file via the plugin-relative path above (the AI tooling automatically maps `@nocobase/...` to the storage index).
2. Copy the helper function that matches your scenario into a JS column. Adjust field names, collection name, and any `openView` UIDs.
3. Keep DOM mutations inside `ctx.element`. Functions already guard against repeated event bindings and avoid external CDNs.

There is no `index.md` aggregator inside `example/js-column`. Reference the files directly so AI tooling can resolve each helper without extra indirection.
