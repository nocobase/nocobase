# SchemaSettingsManager

## Methods

### schemaSettingsManager.add()

Used to add a SchemaSettings instance.

- Type

```tsx | pure
class SchemaSettingsManager {
    add<T = any>(...schemaSettingList: SchemaSetting<T>[]): void
}
```

- Example

```tsx | pure
const mySchemaSettings = new SchemaSetting({
  name: 'MySchemaSettings',
  title: 'Add block',
  items: [
    {
      name: 'demo',
      type: 'item',
      componentProps:{
          title: 'Demo'
      }
    }
  ],
});

class MyPlugin extends Plugin {
    async load() {
        this.app.schemaSettingsManager.add(mySchemaSettings);
    }
}
```

### schemaSettingsManager.get()

Get a SchemaSettings instance.

- Type

```tsx | pure
class SchemaSettingsManager {
    get<T = any>(name: string): SchemaSetting<T> | undefined
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
       const mySchemaSettings = this.app.schemaSettingsManager.get('MySchemaSettings');
    }
}
```

### schemaSettingsManager.getAll()

Get all SchemaSettings instances.

- Type

```tsx | pure
class SchemaSettingsManager {
    getAll(): Record<string, SchemaInitializer<any, any>>
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const list = this.app.schemaSettingsManager.getAll();
    }
}
```

### app.schemaSettingsManager.has()

Check if a specific SchemaSettings instance exists.

- Type

```tsx | pure
class SchemaSettingsManager {
    has(name: string): boolean
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const hasMySchemaSettings = this.app.schemaSettingsManager.has('MySchemaSettings');
    }
}
```

### schemaSettingsManager.remove()

Remove SchemaSettings instance.

- Type

```tsx | pure
class SchemaSettingsManager {
    remove(name: string): void
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        this.app.schemaSettingsManager.remove('MySchemaSettings');
    }
}
```

### schemaSettingsManager.addItem()

Add an Item to the SchemaSettings instance, the difference between this method and directly calling schemaInitializer.add() is that it can ensure that the item is added only when the instance exists.

- Type

```tsx | pure
class SchemaSettingsManager {
    addItem(schemaInitializerName: string, itemName: string, data: Omit<SchemaInitializerItemType, 'name'>): void
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        // Method 1: Get first, then add sub-items, make sure it is registered
        const mySchemaSettings = this.app.schemaSettingsManager.get('MySchemaSettings');
        if (mySchemaSettings) {
            mySchemaSettings.add('b', { type: 'item', componentProps:{ title: 'B' } })
        }

        // Method 2: Use addItem, ensure that it is added only when MySchemaSettings is registered
        this.app.schemaSettingsManager.addItem('MySchemaSettings', 'b', {
            type: 'item',
            componentProps:{ title: 'B' }
        })
    }
}
```

### schemaSettingsManager.removeItem()

Remove an Item from the SchemaSettings instance, the difference between this method and directly calling schemaInitializer.remove() is that it can ensure that the item is removed only when the instance exists.

- Type

```tsx | pure
class SchemaSettingsManager {
    removeItem(schemaInitializerName: string, itemName: string): void
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        // Method 1: Get first, then remove sub-items, make sure it is registered
        const mySchemaSettings = this.app.schemaSettingsManager.get('MySchemaSettings');
        if (mySchemaSettings) {
            mySchemaSettings.remove('a')
        }

        // Method 2: Use addItem, ensure that it is removed only when MySchemaSettings is registered
        this.app.schemaSettingsManager.remove('MySchemaSettings', 'a')
    }
}
```
