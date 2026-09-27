---
'@nocobase/app-plugin-authorization-example': patch
---

The example no longer defines its own team subject: the `example.sales.team` subject type, its team and membership tables, the team assignments and the `sales_dispatch` account are removed. `sales_proposal` holds the engineer set and the quote-7 handover directly, and `sales_coordinator` is a direct project manager without the engineer set. Order delivery relations target carriers (`authorizationExampleCarriers`, the `carrier` relation and `authorizationExampleOrderCarriers`) instead of teams. Inherited subjects are now demonstrated by `@nocobase/app-plugin-departments-example`. Default access, sharing rules and restriction rules are optional peers: the seed skips each rule plugin's rows when its Collection does not exist, so the example runs with the authorization plugin alone. The migration and seed were edited in place, so reset an existing example database before upgrading.
