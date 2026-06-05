# FlowDefinition

FlowDefinition defines the basic structure and configuration of a flow and is one of the core concepts of the FlowEngine. It describes the flow's metadata, trigger conditions, execution steps, etc.

## Type Definition

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## Registration Method

```ts
class MyModel extends FlowModel {}

// Register a flow through the model class
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## Property Descriptions

### key

**Type**: `string`  
**Required**: Yes  
**Description**: The unique identifier for the flow.

It is recommended to use a consistent `xxxSettings` naming style, for example:
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

This naming convention facilitates identification and maintenance, and it is recommended to be used consistently across the project.

**Example**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Type**: `string`  
**Required**: No  
**Description**: The human-readable title of the flow.

It is recommended to maintain a style consistent with the key, using `Xxx settings` naming, for example:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

This naming convention is clearer and easier to understand, facilitating UI display and team collaboration.

**Example**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Type**: `boolean`  
**Required**: No  
**Default**: `false`  
**Description**: Whether the flow can only be executed manually.

- `true`: The flow can only be triggered manually and will not execute automatically.
- `false`: The flow can be executed automatically (it defaults to automatic execution when the `on` property is not present).

**Example**:
```ts
manual: true  // Execute manually only
manual: false // Can be executed automatically
```

### sort

**Type**: `number`  
**Required**: No  
**Default**: `0`  
**Description**: The execution order of the flow. The smaller the value, the earlier it executes.

Negative numbers can be used to control the execution order of multiple flows.

**Example**:
```ts
sort: -1  // Execute with priority
sort: 0   // Default order
sort: 1   // Execute later
```

### on

**Type**: `FlowEvent<TModel>`  
**Required**: No  
**Description**: The event configuration that allows this flow to be triggered by `dispatchEvent`.

Used only to declare the trigger event name (string or `{ eventName }`), does not include a handler function.

**Supported event types**:
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
- Or any custom string

**Example**:
```ts
on: 'click'  // Triggered on click
on: 'submit' // Triggered on submit
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Type**: `Record<string, StepDefinition<TModel>>`  
**Required**: Yes  
**Description**: The definition of the flow's steps.

Defines all the steps contained in the flow, with each step having a unique key.

**Example**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**Type**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Required**: No  
**Description**: Flow-level default parameters.

When the model is instantiated (createModel), it populates the initial values for the step parameters of the "current flow". It only fills in missing values and does not overwrite existing ones. The fixed return shape is: `{ [stepKey]: params }`

**Example**:
```ts
// Static default parameters
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Dynamic default parameters
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Asynchronous default parameters
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Complete Example

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```