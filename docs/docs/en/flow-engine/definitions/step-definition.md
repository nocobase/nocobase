# StepDefinition

StepDefinition defines a single step in a flow. Each step can be an action, event handling, or other operation. A step is the basic execution unit of a flow.

## Type Definition

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## Usage

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Custom processing logic
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Property Descriptions

### key

**Type**: `string`  
**Required**: No  
**Description**: The unique identifier for the step within the flow.

If not provided, the key name of the step in the `steps` object will be used.

**Example**:
```ts
steps: {
  loadData: {  // key is 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Type**: `string`  
**Required**: No  
**Description**: The name of a registered ActionDefinition to use.

The `use` property allows you to reference a registered action, avoiding duplicate definitions.

**Example**:
```ts
// Register the action first
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Data loading logic
  }
});

// Use it in a step
steps: {
  step1: {
    use: 'loadDataAction',  // Reference the registered action
    title: 'Load Data'
  }
}
```

### title

**Type**: `string`  
**Required**: No  
**Description**: The display title of the step.

Used for UI display and debugging.

**Example**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Type**: `number`  
**Required**: No  
**Description**: The execution order of the step. The smaller the value, the earlier it executes.

Used to control the execution order of multiple steps in the same flow.

**Example**:
```ts
steps: {
  step1: { sort: 0 },  // Executes first
  step2: { sort: 1 },  // Executes next
  step3: { sort: 2 }   // Executes last
}
```

### handler

**Type**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Required**: No  
**Description**: The handler function for the step.

When the `use` property is not used, you can define the handler function directly.

**Example**:
```ts
handler: async (ctx, params) => {
  // Get context information
  const { model, flowEngine } = ctx;
  
  // Processing logic
  const result = await processData(params);
  
  // Return result
  return { success: true, data: result };
}
```

### defaultParams

**Type**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Required**: No  
**Description**: The default parameters for the step.

Fills parameters with default values before the step is executed.

**Example**:
```ts
// Static default parameters
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamic default parameters
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Asynchronous default parameters
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**Type**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Required**: No  
**Description**: The UI configuration schema for the step.

Defines how the step is displayed in the interface and its form configuration.

**Example**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Required**: No  
**Description**: A hook function that runs before the parameters are saved.

Executes before the step parameters are saved, and can be used for parameter validation or transformation.

**Example**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parameter validation
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Parameter transformation
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Required**: No  
**Description**: A hook function that runs after the parameters are saved.

Executes after the step parameters are saved, and can be used to trigger other operations.

**Example**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Record logs
  console.log('Step params saved:', params);
  
  // Trigger other operations
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Type**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Required**: No  
**Description**: The UI display mode for the step.

Controls how the step is displayed in the interface.

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
    width: 800,
    title: 'Step Configuration'
  }
}

// Dynamic mode
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Type**: `boolean`  
**Required**: No  
**Description**: Whether it is a preset step.

Parameters for steps with `preset: true` need to be filled in at creation time. Those without this flag can be filled in after the model is created.

**Example**:
```ts
steps: {
  step1: {
    preset: true,  // Parameters must be filled in at creation time
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Parameters can be filled in later
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Type**: `boolean`  
**Required**: No  
**Description**: Whether the step parameters are required.

If `true`, a configuration dialog will open before adding the model.

**Example**:
```ts
paramsRequired: true  // Parameters must be configured before adding the model
paramsRequired: false // Parameters can be configured later
```

### hideInSettings

**Type**: `boolean`  
**Required**: No  
**Description**: Whether to hide the step in the settings menu.

**Example**:
```ts
hideInSettings: true  // Hide in settings
hideInSettings: false // Show in settings (default)
```

### isAwait

**Type**: `boolean`  
**Required**: No  
**Default**: `true`  
**Description**: Whether to wait for the handler function to complete.

**Example**:
```ts
isAwait: true  // Wait for the handler function to complete (default)
isAwait: false // Do not wait, execute asynchronously
```

## Complete Example

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true,
      paramsRequired: true,
      defaultParams: {
        source: 'api',
        timeout: 5000
      },
      uiMode: 'dialog'
    },
    processData: {
      handler: async (ctx, params) => {
        const data = await ctx.model.getData();
        return processData(data, params);
      },
      title: 'Process Data',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration'
        }
      }
    }
  }
});
```