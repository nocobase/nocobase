---
title: "Dialog Hook"
description: "Dialog Hook implementation for Viewer."
---

# Dialog Hook

## useFlowView helper

```tsx
import { useFlowView } from '@nocobase/flow-engine';

export function DialogButtons() {
  const view = useFlowView();
  return <button onClick={() => view.close()}>Close dialog</button>;
}
```
