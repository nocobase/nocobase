# ActionDefinition

ActionDefinition defines reusable actions that can be referenced in multiple flows and steps. An action is the core execution unit in the FlowEngine, encapsulating specific business logic.

## Type Definition

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## Registration Method

```ts
// Global registration (via FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // Processing logic
  }
});

// Model-level registration (via FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Processing logic
  }
});

// Use in a flow
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Reference global action
    },
    step2: {
      use: 'processDataAction', // Reference model-level action
    }
  }
});
```

## Property Descriptions

### name

**Type**: `string`  
**Required**: Yes  
**Description**: The unique identifier for the action

Used to reference the action in a step via the `use` property.

**Example**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Type**: `string`  
**Required**: No  
**Description**: The display title for the action

Used for UI display and debugging.

**Example**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Type**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Required**: Yes  
**Description**: The handler function for the action

The core logic of the action, which receives the context and parameters, and returns the processing result.

**Example**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Execute specific logic
    const result = await performAction(params);
    
    // Return result
    return {
      success: true,
      data: result,
      message: 'Action completed successfully'
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
**Description**: The default parameters for the action

Fills parameters with default values before the action is executed.

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
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Asynchronous default parameters
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**Type**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Required**: No  
**Description**: The UI configuration schema for the action

Defines how the action is displayed in the UI and its form configuration.

**Example**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'API URL',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'HTTP Method',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Timeout (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Required**: No  
**Description**: Hook function executed before saving parameters

Executed before the action parameters are saved, can be used for parameter validation or transformation.

**Example**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parameter validation
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // Parameter transformation
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Log changes
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Required**: No  
**Description**: Hook function executed after saving parameters

Executed after the action parameters are saved, can be used to trigger other operations.

**Example**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Log records
  console.log('Action params saved:', params);
  
  // Trigger event
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Update cache
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Type**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Required**: No  
**Description**: Whether to use raw parameters

If `true`, the raw parameters are passed directly to the handler function without any processing.

**Example**:
```ts
// Static configuration
useRawParams: true

// Dynamic configuration
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Type**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Required**: No  
**Description**: The UI display mode for the action

Controls how the action is displayed in the UI.

**Supported modes**:
- `'dialog'` - Dialog mode
- `'drawer'` - Drawer mode
- `'embed'` - Embed mode
- or a custom configuration object

**Example**:
```ts
// Simple mode
uiMode: 'dialog'

// Custom configuration
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// Dynamic mode
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Type**: `ActionScene | ActionScene[]`  
**Required**: No  
**Description**: The usage scenarios for the action

Restricts the action to be used only in specific scenarios.

**Supported scenes**:
- `'settings'` - Settings scene
- `'runtime'` - Runtime scene
- `'design'` - Design-time scene

**Example**:
```ts
scene: 'settings'  // Use only in the settings scene
scene: ['settings', 'runtime']  // Use in settings and runtime scenes
```

### sort

**Type**: `number`  
**Required**: No  
**Description**: The sorting weight for the action

Controls the display order of the action in a list. A smaller value means a higher position.

**Example**:
```ts
sort: 0  // Highest position
sort: 10 // Middle position
sort: 100 // Lower position
```

## Complete Example

```ts
class DataProcessingModel extends FlowModel {}

// Register data loading action
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Data loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'API URL',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'HTTP Method',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Timeout (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL is required');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// Register data processing action
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: 'Processor',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Options',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Format',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Encoding',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```