# JSON Template Parser

A powerful and flexible JSON template parser for NocoBase that supports dynamic template rendering with custom filters and scoped functions.

## Features

- Template-based JSON transformation
- Custom filter support
- Scoped function handling
- Liquid template syntax
- Nested object and array support

## Installation

```bash
npm install @nocobase/json-template-parser
```

## Basic Usage

```typescript
import { createJSONTemplateParser } from '@nocobase/json-template-parser';

const parser = createJSONTemplateParser();
const template = {
  name: "Hello {{name}}",
  age: "{{age}}"
};

const result = await parser.render(template, {
  name: "John",
  age: 25
});
// Result: { name: "Hello John", age: "25" }
```

## API Reference

### JSONTemplateParser

#### Methods

##### `render(template: string | object, data: object, context?: object): Promise<any>`

Renders a template with provided data and context.

- `template`: The template string or object to render
- `data`: Data object containing values for template variables
- `context`: Optional context object for additional rendering context

##### `registerFilter(filter: Filter): void`

Registers a custom filter for template processing.

```typescript
interface Filter {
  name: string;
  title: string;
  handler: (...args: any[]) => any;
  group: string;
  uiSchema?: any;
  sort: number;
}
```

##### `registerFilterGroup(group: FilterGroup): void`

Registers a group of filters.

```typescript
interface FilterGroup {
  name: string;
  title: string;
  sort: number;
}
```

## Scope Functions

Scope functions are special functions that start with `$` and provide advanced data manipulation capabilities. They are defined in the data object passed to the render method. Scope functions enable dynamic data fetching, transformation, and complex computations during template rendering.

### Key Concepts

1. **Namespace**: Scope functions are identified by a `$` prefix (e.g., `$user`, `$settings`). This creates a dedicated namespace for accessing related data.

2. **Lazy Evaluation**: Fields are only evaluated when they are actually used in the template, providing better performance.

3. **Context Awareness**: Scope functions have access to:
   - `fields`: List of fields requested in the template
   - `data`: The complete data object passed to render
   - `context`: Additional context provided during rendering

4. **Two-Phase Processing**:
   - `getValue`: Retrieves the raw value for a field
   - `afterApplyHelpers`: Post-processes the value after filters are applied

### Detailed Interface

```typescript
interface ScopeFnWrapper {
  (params: {
    fields: string[];      // List of fields used in template
    data: any;            // Complete data object
    context?: Record<string, any>;  // Additional context
  }): Promise<{
    getValue: (params: { 
      field: string[];    // Field path being accessed
      keys: string[];     // Full path in template
    }) => any;
    afterApplyHelpers: (params: { 
      field: string[];    // Field path
      keys: string[];     // Full path
      value: any;         // Value after filters
    }) => any;
  }>;
}
```

### Common Use Cases

#### 1. Dynamic Data Fetching

```typescript
const template = {
  user: "{{$api.user}} ({{$api.role}})"
};

await parser.render(template, {
  $api: async ({ fields }) => {
    // Fetch only required fields
    const data = await fetchUserData(fields);
    
    return {
      getValue: ({ field }) => data[field],
      afterApplyHelpers: ({ value }) => value
    };
  }
});
```

#### 2. Computed Properties

```typescript
const template = {
  total: "{{$calc.sum}}",
  average: "{{$calc.average}}"
};

await parser.render(template, {
  numbers: [1, 2, 3, 4, 5],
  $calc: ({ data }) => ({
    getValue: ({ field }) => {
      const numbers = data.numbers;
      switch (field) {
        case 'sum':
          return numbers.reduce((a, b) => a + b, 0);
        case 'average':
          return numbers.reduce((a, b) => a + b, 0) / numbers.length;
      }
    },
    afterApplyHelpers: ({ value }) => value
  })
});
```

#### 3. Context-Based Transformation

```typescript
const template = {
  greeting: "{{$i18n.welcome}}",
  message: "{{$i18n.notification}}"
};

await parser.render(template, {
  $i18n: ({ context }) => ({
    getValue: ({ field }) => {
      const translations = {
        en: {
          welcome: "Welcome",
          notification: "You have new messages"
        },
        es: {
          welcome: "Bienvenido",
          notification: "Tienes nuevos mensajes"
        }
      };
      return translations[context.language][field];
    },
    afterApplyHelpers: ({ value }) => value
  })
}, { language: 'es' });
```

#### 4. Nested Data Access with Validation

```typescript
const template = {
  permissions: "{{$acl.user.permissions}}",
  role: "{{$acl.user.role.name}}"
};

await parser.render(template, {
  $acl: ({ fields }) => {
    const userData = {
      permissions: ['read', 'write'],
      role: { name: 'admin', level: 1 }
    };

    return {
      getValue: ({ field, keys }) => {
        // Safely traverse nested paths
        return keys.reduce((obj, key) => obj?.[key], userData);
      },
      afterApplyHelpers: ({ value, keys }) => {
        // Validate sensitive data
        if (keys.includes('permissions')) {
          return Array.isArray(value) ? value : [];
        }
        return value;
      }
    };
  }
});
```

### Best Practices

1. **Field Optimization**:
   ```typescript
   $data: ({ fields }) => {
     // Only fetch required fields
     const requiredData = await fetchDataForFields(fields);
     return {
       getValue: ({ field }) => requiredData[field]
     };
   }
   ```

2. **Error Handling**:
   ```typescript
   getValue: ({ field }) => {
     try {
       return computeValue(field);
     } catch (error) {
       console.error(`Error computing ${field}:`, error);
       return null; // Provide fallback value
     }
   }
   ```

3. **Caching Results**:
   ```typescript
   $cached: ({ fields }) => {
     const cache = new Map();
     return {
       getValue: ({ field }) => {
         if (!cache.has(field)) {
           cache.set(field, expensiveComputation(field));
         }
         return cache.get(field);
       }
     };
   }
   ```

4. **Context Utilization**:
   ```typescript
   $data: ({ context }) => ({
     getValue: ({ field }) => {
       return context.isAdmin 
         ? sensitiveData[field] 
         : limitedData[field];
     }
   })
   ```

### Performance Considerations

1. Use the `fields` parameter to optimize data fetching
2. Implement caching for expensive computations
3. Avoid unnecessary transformations in `afterApplyHelpers`
4. Keep scope functions focused and specific
5. Use appropriate error handling and fallbacks

## Advanced Examples

### Using Custom Filters

```typescript
const parser = createJSONTemplateParser();

// Register a filter group
parser.registerFilterGroup({
  name: 'string',
  title: 'String Operations',
  sort: 1
});

// Register a custom filter
parser.registerFilter({
  name: 'uppercase',
  title: 'Convert to Uppercase',
  handler: (value) => String(value).toUpperCase(),
  group: 'string',
  sort: 1
});

const template = {
  message: "{{name | uppercase}}"
};

const result = await parser.render(template, {
  name: "john"
});
// Result: { message: "JOHN" }
```

### Nested Templates

```typescript
const template = {
  user: {
    info: {
      fullName: "{{firstName}} {{lastName}}",
      contact: {
        email: "{{email}}",
        phone: "{{phone}}"
      }
    },
    stats: ["{{stat1}}", "{{stat2}}"]
  }
};

const result = await parser.render(template, {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "123-456-7890",
  stat1: "Active",
  stat2: "Premium"
});
```

## License

This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
For more information, please refer to: https://www.nocobase.com/agreement