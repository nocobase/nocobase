---
title: 'Default data access'
---

# Default data access

Default data access adds a shared record scope for people who already hold the action. Northstar account managers can use completed, non-sensitive orders as operational references alongside their own work.

## Common reference orders

```text
Keep account managers' owned-order viewing scope.
Add completed, non-sensitive orders as a default viewing scope for everyone who already has View orders permission.
Allow administrators to adjust this condition in Team access.
Add viewing only, not editing or transport actions on other people's orders.
```

Alice can view both owned orders and qualifying reference orders. Default scope is combined with existing scope by union rather than replacing it.

## It does not grant the action

People without View orders permission do not gain it from the default scope. Viewing completed records does not grant editing.

Configure each action separately within the resource's default rule. Use [sharing](./sharing-rules.md) for selected collaborators and [restrictions](./restriction-rules.md) for boundaries that apply across sources.
