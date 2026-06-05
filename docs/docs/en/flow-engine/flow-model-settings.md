# FlowModel Flow and Configuration

FlowModel provides a "Flow"-based approach to implement component configuration logic, making component behavior and configuration more extensible and visual.

## Custom Model

You can create a custom component model by extending `FlowModel`. The model needs to implement the `render()` method to define the component's rendering logic.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Registering a Flow

Each model can register one or more **Flows** to describe the component's configuration logic and interaction steps.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Button Settings',
  steps: {
    general: {
      title: 'General Configuration',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Button Title',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

Description

-   `key`: The unique identifier for the Flow.
-   `title`: The name of the Flow, used for UI display.
-   `steps`: Defines the configuration steps (Step). Each step includes:
    -   `title`: The step title.
    -   `uiSchema`: The configuration form structure (compatible with Formily Schema).
    -   `defaultParams`: Default parameters.
    -   `handler(ctx, params)`: Triggered on save to update the model's state.

## Rendering the Model

When rendering a component model, you can use the `showFlowSettings` parameter to control whether to enable the configuration feature. If `showFlowSettings` is enabled, a configuration entry (such as a settings icon or button) will automatically appear in the upper-right corner of the component.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Manually Opening the Configuration Form with openFlowSettings

In addition to opening the configuration form through the built-in interaction entry, you can also manually call
`openFlowSettings()`.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Parameter Definitions

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Required, the model instance it belongs to
  preset?: boolean;               // Renders only steps marked as preset=true (default false)
  flowKey?: string;               // Specify a single Flow
  flowKeys?: string[];            // Specify multiple Flows (ignored if flowKey is also provided)
  stepKey?: string;               // Specify a single step (usually used with flowKey)
  uiMode?: 'dialog' | 'drawer';   // The container for displaying the form, default 'dialog'
  onCancel?: () => void;          // Callback when cancel is clicked
  onSaved?: () => void;           // Callback after the configuration is saved successfully
}
```

### Example: Opening a Specific Flow's Configuration Form in Drawer Mode

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Button settings saved');
  },
});
```