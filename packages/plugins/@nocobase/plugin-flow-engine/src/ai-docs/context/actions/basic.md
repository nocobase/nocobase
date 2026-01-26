---
title: "Run Action"
description: "Run action."
---

# Basic

## Run Action

Use this snippet to run action.

```ts
return ctx.runAction(name, params);
```

## Get Action Definition

Use this snippet to get action definition.

```ts
return ctx.getAction(name);
```

## List Actions

Use this snippet to list actions.

```ts
return Array.from(ctx.getActions().entries());
```
