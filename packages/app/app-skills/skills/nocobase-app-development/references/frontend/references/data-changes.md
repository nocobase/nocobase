# Keeping views current after a write

One record often appears at once in a list, its detail, a dashboard card and a count. After a create, edit or delete the server confirmed, every view that reads it shows the new data the next time it is visible. Default and Examples ship the mechanism as application source: `client/hooks/use-data-changes.ts` and the `scopes`/`merge` options of `client/hooks/use-list-data.ts`. The Examples Projects page (`client/pages/skill-projects/`, published as the [executable list and edit example](executable-list-edit.md)) is the runnable reference.

## The contract

- **Views declare what they read** as scopes: slash-separated paths named after the business entity and its relations, such as `orders`, `orders/42` or `customers/7/contacts`. Pass them to `useListData(path, { scopes })`. Name scopes after the data, never after a route or a page.
- **A write names what it changed** with `announceDataChange({ scopes, results })`, once, after the request settles. Scopes overlap when one is a whole-segment prefix of the other, so `orders/42` affects views reading `orders` and `orders/42`, but not `orders/43` or `ordersArchive`. A write that moves a record between relations names both sides, such as `customers/7/contacts` and `customers/8/contacts`.
- **Results carry the server's final value**: `results[scope]` is the success response for that exact scope, in the shape a read of it returns, or `null` when the record no longer exists. A view declaring exactly that one scope (an open detail) shows the result at once and sends no request; for `null` it drops the record's data at once and reports a 404 `ApiClientError` (reason `RECORD_REMOVED`), so a slow or failed read can never show it again. A page that deleted its own record keeps its last value on screen while it returns.
- **Other affected views read again**: a visible view reads immediately; a covered view (`active: false`, under a detail page, dialog or drawer) sends nothing and reads once when shown again. `merge(current, change)` may apply the results to the shown rows first, building on the latest merged rows so changes announced together accumulate, such as adding a created row in the default order or dropping a deleted one; the verification read still follows. Do not merge into searched or re-sorted rows where the server decides placement.
- **Newer results win**: a result or a new read cancels every read started before it, so a slow earlier response never replaces a later write. Writes from one form are already serialized by its `useSubmission` lock.
- **Unaffected and unmounted views do nothing**: no global refresh, no polling. A view that mounts later reads fresh data anyway. This is not realtime: changes made in another tab or by another user arrive through [realtime topics](api.md) when the business needs them.

## Outcomes

| Write outcome                                     | Feedback                                             | Announce                                             |
| ------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Success                                           | Success toast; close or return                       | `scopes` and `results` from the response             |
| Delete success, or 404 on delete                  | Success (or "already deleted"); return to the source | `results: { [scope]: null }`                         |
| 404 on edit or a missing record                   | Missing-record message, no Retry                     | `scopes` only, so stale views show the missing state |
| Network failure, timeout, 5xx, or failed recovery | Unknown-result message; keep input and operation key | `scopes` only, so views read what actually happened  |
| Validation, 403 or other definite rejection       | Error where the action started; keep input           | Nothing: no data changed                             |

Never show success before the server confirms it, and never resubmit automatically after an unknown result: retrying is the person's choice and reuses the original operation key ([submission protection](../../submission.md)).

## Example

```tsx
// client/pages/orders/scopes.ts: one place names the entity.
export const ordersScope = 'orders';
export const orderScope = (id: string) => `${ordersScope}/${id}`;

// The list and a count card both read every order; the list keeps its URL query.
const list = useListData<OrderList>(`orders?${query}`, {
  active,
  keepPreviousData: true,
  scopes: [ordersScope],
  merge: (current, change) => dropDeletedRows(current, change),
});
const count = useListData<{ data: { total: number } }>('orders/summary', {
  active,
  keepPreviousData: true,
  scopes: [ordersScope],
});

// The detail reads one order and takes a saved result without a request.
const detail = useListData<{ data: Order }>(`orders/${id}`, {
  scopes: [orderScope(id)],
  active: !deleted,
});

// The edit dialog, after a confirmed save:
const scope = orderScope(saved.data.id);
announceDataChange({ scopes: [scope], results: { [scope]: saved } });

// The detail, after a confirmed delete: stop reading it, announce, then return.
setDeleted(true);
announceDataChange({ scopes: [scope], results: { [scope]: null } });
await navigate({ pathname: owner, search: routeSearches.get(owner) ?? '' });
```

A child route needs no `reload` or `onSaved` callbacks through `<Outlet context>`; keep the context only for state that is not server data, such as the selected rows of a batch action. A view that is not a `useListData` read, such as a TanStack Query snapshot or a chart adapter, subscribes with `useDataChange(scopes, onChange)` and refetches there, honoring its own visibility.

## Returning and direct links

A covered list keeps its search, filters, ordering, page, page size and source tab, and reads once on return; an emptied last page then follows the existing [page correction](table.md#delete-and-recover-a-list). A deleted detail returns to its source with `useRouteSearches()`, which also covers a directly opened detail URL: it returns to the list's default query, and the list, which was never read while covered, reads once. A detail whose record is gone or forbidden shows the missing or denied state and never its earlier content.

## Verify

Test with a list, a detail and a count of the same entity: create, edit from the detail and delete from the detail, then return. Assert the detail shows the saved value before any return read, the list keeps its query and page, the count changes, covered views send no request until shown, unaffected views send none, a held earlier read cannot replace a later result, and failed, denied, missing and unknown outcomes show no success and repeat no write.
