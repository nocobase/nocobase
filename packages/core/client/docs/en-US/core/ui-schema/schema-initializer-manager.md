# SchemaInitializerManager

## Methods

### schemaInitializerManager.add()

Add SchemaInitializer instance.

- Type

```tsx | pure
class SchemaInitializerManager {
    add<P1 = any, P2 = any>(...schemaInitializerList: SchemaInitializer<P1, P2>[]): void
}
```

- Example

```tsx | pure
const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Add block',
  items: [
    {
      name: 'demo',
      type: 'item',
      title: 'Demo'
    }
  ],
});

class MyPlugin extends Plugin {
    async load() {
        this.app.schemaInitializerManager.add(myInitializer);
    }
}
```

### schemaInitializerManager.get()

Get SchemaInitializer instance.

- Type

```tsx | pure
class SchemaInitializerManager {
    get<P1 = ButtonProps, P2 = {}>(name: string): SchemaInitializer<P1, P2> | undefined
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
       const myInitializer = this.app.schemaInitializerManager.get('MyInitializer');
    }
}
```

### schemaInitializerManager.getAll()

Get all SchemaInitializer instances.

- Type

```tsx | pure
class SchemaInitializerManager {
    getAll(): Record<string, SchemaInitializer<any, any>>
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const list = this.app.schemaInitializerManager.getAll();
    }
}
```

### app.schemaInitializerManager.has()

Check if a specific SchemaInitializer instance exists.

- Type

```tsx | pure
class SchemaInitializerManager {
    has(name: string): boolean
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const hasMyInitializer = this.app.schemaInitializerManager.has('MyInitializer');
    }
}
```

### schemaInitializerManager.remove()

Remove SchemaInitializer instance.

- Type

```tsx | pure
class SchemaInitializerManager {
    remove(name: string): void
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        this.app.schemaInitializerManager.remove('MyInitializer');
    }
}
```

### schemaInitializerManager.addItem()

Add an Item to the SchemaInitializer instance, the difference between this method and directly calling schemaInitializer.add() is that it can ensure that the item is added only when the instance exists.

- Type

```tsx | pure
class SchemaInitializerManager {
    addItem(schemaInitializerName: string, itemName: string, data: Omit<SchemaInitializerItemType, 'name'>): void
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        // Method 1: Get first, then add sub-items, make sure it is registered
        const myInitializer = this.app.schemaInitializerManager.get('MyInitializer');
        if (myInitializer) {
            myInitializer.add('b', { type: 'item', title: 'B' })
        }

        // Method 2: Use addItem, ensure that it is added only when MyInitializer is registered
        this.app.schemaInitializerManager.addItem('MyInitializer', 'b', {
            type: 'item',
            title: 'B'
        })
    }
}
```

### schemaInitializerManager.removeItem()

Remove an Item from the SchemaInitializer instance, the difference between this method and directly calling schemaInitializer.remove() is that it can ensure that the item is removed only when the instance exists.

- Type

```tsx | pure
class SchemaInitializerManager {
    removeItem(schemaInitializerName: string, itemName: string): void
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        // Method 1: Get first, then remove sub-items, make sure it is registered
        const myInitializer = this.app.schemaInitializerManager.get('MyInitializer');
        if (myInitializer) {
            myInitializer.remove('a')
        }

        // Method 2: Use removeItem, ensure that it is removed only when MyInitializer is registered
        this.app.schemaInitializerManager.remove('MyInitializer', 'a')
    }
}
```
