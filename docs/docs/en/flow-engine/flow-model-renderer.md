# Render FlowModel

`FlowModelRenderer` is the core React component for rendering a `FlowModel`. It is responsible for converting a `FlowModel` instance into a visual React component.

## Basic Usage

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Basic usage
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

For controlled field Models, use `FieldModelRenderer` to render:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Controlled field rendering
<FieldModelRenderer model={fieldModel} />
```

## Props

### FlowModelRendererProps

| Parameter | Type | Default | Description |
|------|------|--------|------|
| `model` | `FlowModel` | - | The FlowModel instance to render |
| `uid` | `string` | - | The unique identifier for the flow model |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Fallback content to display on rendering failure |
| `showFlowSettings` | `boolean \| object` | `false` | Whether to show the entry for flow settings |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | The interaction style for flow settings |
| `hideRemoveInSettings` | `boolean` | `false` | Whether to hide the remove button in the settings |
| `showTitle` | `boolean` | `false` | Whether to display the model title in the top-left corner of the border |
| `skipApplyAutoFlows` | `boolean` | `false` | Whether to skip applying auto flows |
| `inputArgs` | `Record<string, any>` | - | Extra context passed to `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Whether to wrap the outermost layer with the `FlowErrorFallback` component |
| `settingsMenuLevel` | `number` | - | Settings menu level: 1=current model only, 2=include child models |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Additional toolbar items |

### `showFlowSettings` Detailed Configuration

When `showFlowSettings` is an object, the following configurations are supported:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Show background
  showBorder: true,        // Show border
  showDragHandle: true,    // Show drag handle
  style: {},              // Custom toolbar style
  toolbarPosition: 'inside' // Toolbar position: 'inside' | 'above' | 'below'
}}
```

## Rendering Lifecycle

The entire rendering cycle calls the following methods in order:

1.  **model.dispatchEvent('beforeRender')** - `beforeRender` event
2.  **model.render()** - Executes the model's render method
3.  **model.onMount()** - Component mount hook
4.  **model.onUnmount()** - Component unmount hook

## Usage Examples

### Basic Rendering

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Loading...</div>}
    />
  );
}
```

### Rendering with Flow Settings

```tsx pure
// Show settings but hide the remove button
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Show settings and title
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Use context menu mode
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Custom Toolbar

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Custom Action',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Custom action');
      }
    }
  ]}
/>
```

### Skipping Auto Flows

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Field Model Rendering

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## Error Handling

`FlowModelRenderer` has a comprehensive built-in error handling mechanism:

-   **Automatic Error Boundary**: `showErrorFallback={true}` is enabled by default
-   **Auto Flow Errors**: Catches and handles errors during the execution of auto flows
-   **Rendering Errors**: Displays fallback content when model rendering fails

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Rendering failed, please try again</div>}
/>
```

## Performance Optimization

### Skipping Auto Flows

For scenarios where auto flows are not needed, you can skip them to improve performance:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Reactive Updates

`FlowModelRenderer` uses the `observer` from `@formily/reactive-react` for reactive updates, ensuring that the component automatically re-renders when the model's state changes.

## Notes

1.  **Model Validation**: Ensure the passed `model` has a valid `render` method.
2.  **Lifecycle Management**: The model's lifecycle hooks will be called at the appropriate times.
3.  **Error Boundary**: It is recommended to enable the error boundary in a production environment to provide a better user experience.
4.  **Performance Consideration**: For scenarios involving rendering a large number of models, consider using the `skipApplyAutoFlows` option.
