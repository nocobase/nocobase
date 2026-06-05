# EventDefinition

EventDefinition defines the event handling logic in a flow, used to respond to specific event triggers. Events are an important mechanism in the FlowEngine for triggering flow execution.

## Type Definition

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

EventDefinition is actually an alias for ActionDefinition, so it has the same properties and methods.

## Registration Method

```ts
// Global registration (via FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Event handling logic
  }
});

// Model-level registration (via FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Event handling logic
  }
});

// Usage in a flow
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Reference a registered event
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Property Descriptions

### name

**Type**: `string`  
**Required**: Yes  
**Description**: The unique identifier for the event.

Used to reference the event in a flow via the `on` property.

**Example**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Type**: `string`  
**Required**: No  
**Description**: The display title for the event.

Used for UI display and debugging.

**Example**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Type**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Required**: Yes  
**Description**: The handler function for the event.

The core logic of the event, which receives the context and parameters, and returns the processing result.

**Example**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Execute event handling logic
    const result = await handleEvent(params);
    
    // Return the result
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**Type**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Required**: No  
**Description**: The default parameters for the event.

Populates parameters with default values when the event is triggered.

**Example**:
```ts
// Static default parameters
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Dynamic default parameters
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Asynchronous default parameters
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Type**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Required**: No  
**Description**: The UI configuration schema for the event.

Defines the display method and form configuration for the event in the UI.

**Example**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Prevent Default',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Stop Propagation',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Custom Data',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Key',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Value',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Required**: No  
**Description**: Hook function executed before saving parameters.

Executed before event parameters are saved, can be used for parameter validation or transformation.

**Example**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parameter validation
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Parameter transformation
  params.eventType = params.eventType.toLowerCase();
  
  // Log changes
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Required**: No  
**Description**: Hook function executed after saving parameters.

Executed after event parameters are saved, can be used to trigger other actions.

**Example**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Log
  console.log('Event params saved:', params);
  
  // Trigger event
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Update cache
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Type**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Required**: No  
**Description**: The UI display mode for the event.

Controls how the event is displayed in the UI.

**Supported modes**:
- `'dialog'` - Dialog mode
- `'drawer'` - Drawer mode
- `'embed'` - Embed mode
- Or a custom configuration object

**Example**:
```ts
// Simple mode
uiMode: 'dialog'

// Custom configuration
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Event Configuration'
  }
}

// Dynamic mode
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Built-in Event Types

The FlowEngine has the following common event types built-in:

- `'click'` - Click event
- `'submit'` - Submit event
- `'reset'` - Reset event
- `'remove'` - Remove event
- `'openView'` - Open view event
- `'dropdownOpen'` - Dropdown open event
- `'popupScroll'` - Popup scroll event
- `'search'` - Search event
- `'customRequest'` - Custom request event
- `'collapseToggle'` - Collapse toggle event

## Complete Example

```ts
class FormModel extends FlowModel {}

// Register form submit event
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Validate form data
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Process form submission
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Form submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Enable Validation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Prevent Default',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Stop Propagation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Custom Handlers',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Handler Name',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Form data is required when validation is enabled');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// Register data change event
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Log data change
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Trigger related actions
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Data change logged successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// Using events in a flow
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Form Processing',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validate Form',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Process Form',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Save Form',
      sort: 2
    }
  }
});
```