---
title: "Drawer Hook"
description: "Drawer Hook implementation for Viewer."
---

# Drawer Hook

## hook inside drawer

```tsx
import { useFlowView } from '@nocobase/flow-engine';

export function DrawerControls() {
  const view = useFlowView();
  return <button onClick={() => view.close()}>Done</button>;
}
```
