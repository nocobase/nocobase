# SchemaInitializerManager

## 实例方法

### schemaInitializerManager.add()

添加 SchemaInitializer 实例。

- 类型

```tsx | pure
class SchemaInitializerManager {
    add<P1 = any, P2 = any>(...schemaInitializerList: SchemaInitializer<P1, P2>[]): void
}
```

- 示例

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

获取一个 SchemaInitializer 实例。

- 类型

```tsx | pure
class SchemaInitializerManager {
    get<P1 = ButtonProps, P2 = {}>(name: string): SchemaInitializer<P1, P2> | undefined
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
       const myInitializer = this.app.schemaInitializerManager.get('MyInitializer');
    }
}
```

### schemaInitializerManager.getAll()

获取所有的 SchemaInitializer 实例。

- 类型

```tsx | pure
class SchemaInitializerManager {
    getAll(): Record<string, SchemaInitializer<any, any>>
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const list = this.app.schemaInitializerManager.getAll();
    }
}
```

### app.schemaInitializerManager.has()

判断是否有存在某个 SchemaInitializer 实例。

- 类型

```tsx | pure
class SchemaInitializerManager {
    has(name: string): boolean
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const hasMyInitializer = this.app.schemaInitializerManager.has('MyInitializer');
    }
}
```

### schemaInitializerManager.remove()

移除 SchemaInitializer 实例。

- 类型

```tsx | pure
class SchemaInitializerManager {
    remove(name: string): void
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        this.app.schemaInitializerManager.remove('MyInitializer');
    }
}
```

### schemaInitializerManager.addItem()

添加 SchemaInitializer 实例的 Item 项，其和直接 schemaInitializer.add() 方法的区别是，可以确保在实例存在时才会添加。

- 类型

```tsx | pure
class SchemaInitializerManager {
    addItem(schemaInitializerName: string, itemName: string, data: Omit<SchemaInitializerItemType, 'name'>): void
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        // 方式1：先获取，再添加子项，需要确保已注册
        const myInitializer = this.app.schemaInitializerManager.get('MyInitializer');
        if (myInitializer) {
            myInitializer.add('b', { type: 'item', title: 'B' })
        }

        // 方式2：通过 addItem，内部确保在 MyInitializer 注册时才会添加
        this.app.schemaInitializerManager.addItem('MyInitializer', 'b', {
            type: 'item',
            title: 'B'
        })
    }
}
```

### schemaInitializerManager.removeItem()

移除 实例的 Item 项，其和直接 schemaInitializer.remove() 方法的区别是，可以确保在实例存在时才会移除。

- 类型

```tsx | pure
class SchemaInitializerManager {
    removeItem(schemaInitializerName: string, itemName: string): void
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        // 方式1：先获取，再删除子项，需要确保已注册
        const myInitializer = this.app.schemaInitializerManager.get('MyInitializer');
        if (myInitializer) {
            myInitializer.remove('a')
        }

        // 方式2：通过 addItem，内部确保在 MyInitializer 注册时才会移除
        this.app.schemaInitializerManager.remove('MyInitializer', 'a')
    }
}
```
