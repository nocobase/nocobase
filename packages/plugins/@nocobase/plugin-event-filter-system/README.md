# Event Filter System

The Event Filter System plugin integrates two core systems in NocoBase:

1. **Event System**: Manages event publishing and subscriptions throughout the application.
2. **Filter System**: Provides data transformation capabilities across various data types.

## Features

- Structured event naming conventions
- Priority-based event filtering
- Asynchronous event handling
- Filter chains for data transformation
- Clear error handling strategies

## Installation

```bash
# Using yarn
yarn add @nocobase/plugin-event-filter-system

# Using npm
npm install @nocobase/plugin-event-filter-system
```

Then register the plugin in your NocoBase application:

```ts
// In your app.ts or similar file
import PluginEventFilterSystem from '@nocobase/plugin-event-filter-system';

app.registerPlugin(PluginEventFilterSystem);
```

## Usage

### Event System

The event system enables components to communicate without direct dependencies:

```ts
// Listen for an event
app.eventManager.on('core:form:submit', (ctx) => {
  console.log('Form submitted:', ctx.payload);
});

// Dispatch an event
const results = await app.eventManager.dispatchEvent('core:form:submit', {
  payload: { formData: {...} },
  source: { id: 'myForm' }
});
```

### Filter System

The filter system allows for transforming data through chainable filter functions:

```ts
// Register a filter
app.filterManager.addFilter('core:block:table:props', (props, context) => {
  // Modify the props
  return { ...props, customField: context.someValue };
}, { priority: 10 });

// Apply filters to data
const transformedData = await app.filterManager.applyFilter(
  'core:block:table:props',
  originalProps,
  { someValue: 'test' }
);
```

### React Hooks

The plugin also provides React hooks for components:

```tsx
import { useEventListener, useDispatchEvent, useAddFilter } from '@nocobase/plugin-event-filter-system';

function MyComponent() {
  // Listen for events
  useEventListener('core:page:loaded', (ctx) => {
    console.log('Page loaded:', ctx.payload);
  });
  
  // Add a filter
  useAddFilter('core:component:props', (props) => {
    return { ...props, enhanced: true };
  });
  
  // Get event dispatcher
  const dispatch = useDispatchEvent();
  
  const handleClick = () => {
    dispatch('core:button:click', { payload: { buttonId: 'myButton' } });
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

See the full documentation for more details on using the Event and Filter systems.
