---
title: "Hooks"
description: "Shared helpers used by the following snippets."
---

# Hooks

## Setup

Shared helpers used by the following snippets.

```ts
// Extend FlowModel when registering this class with the engine (import omitted intentionally).
class LoadingAwareModel {
  async onDispatchEventStart(eventName) {
    if (eventName === 'beforeRender') {
      this.setState({
        profile: await this.context.asyncProfile,
      });
    }
  }
}
```

## Await Async Property

Use this snippet to await async property.

```ts
return await property;
```
