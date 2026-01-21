# Dialog Hook

## access Header/Footer

Use `useFlowView()` inside the dialog content to grab chrome helpers and close the view.

```tsx
import { useFlowContext, useFlowView } from '@nocobase/flow-engine';

export function DialogChrome() {
  const ctx = useFlowContext();
  const view = useFlowView();
  return (
    <>
      <view.Header title={`Dialog - ${ctx.model.uid}`} />
      <view.Footer>
        <button onClick={() => view.close()}>Close</button>
      </view.Footer>
    </>
  );
}
```
