# SchemaSettingsManager

## 实例方法

### schemaSettingsManager.add()

添加 SchemaSettings 实例。

- 类型

```tsx | pure
class SchemaSettingsManager {
    add<T = any>(...schemaSettingList: SchemaSetting<T>[]): void
}
```

- 示例

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

获取一个 SchemaSettings 实例。

- 类型

```tsx | pure
class SchemaSettingsManager {
    get<T = any>(name: string): SchemaSetting<T> | undefined
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
       const mySchemaSettings = this.app.schemaSettingsManager.get('MySchemaSettings');
    }
}
```

### schemaSettingsManager.getAll()

获取所有的 SchemaSettings 实例。

- 类型

```tsx | pure
class SchemaSettingsManager {
    getAll(): Record<string, SchemaInitializer<any, any>>
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const list = this.app.schemaSettingsManager.getAll();
    }
}
```

### app.schemaSettingsManager.has()

判断是否有存在某个 SchemaSettings 实例。

- 类型

```tsx | pure
class SchemaSettingsManager {
    has(name: string): boolean
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const hasMySchemaSettings = this.app.schemaSettingsManager.has('MySchemaSettings');
    }
}
```

### schemaSettingsManager.remove()

移除 SchemaSettings 实例。

- 类型

```tsx | pure
class SchemaSettingsManager {
    remove(name: string): void
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        this.app.schemaSettingsManager.remove('MySchemaSettings');
    }
}
```

### schemaSettingsManager.addItem()

添加 SchemaSettings 实例的 Item 项，其和直接 schemaInitializer.add() 方法的区别是，可以确保在实例存在时才会添加。

- 类型

```tsx | pure
class SchemaSettingsManager {
    addItem(schemaInitializerName: string, itemName: string, data: Omit<SchemaInitializerItemType, 'name'>): void
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        // 方式1：先获取，再添加子项，需要确保已注册
        const mySchemaSettings = this.app.schemaSettingsManager.get('MySchemaSettings');
        if (mySchemaSettings) {
            mySchemaSettings.add('b', { type: 'item', componentProps:{ title: 'B' } })
        }

        // 方式2：通过 addItem，内部确保在 mySchemaSettings 注册时才会添加
        this.app.schemaSettingsManager.addItem('MySchemaSettings', 'b', {
            type: 'item',
            componentProps:{ title: 'B' }
        })
    }
}
```

### schemaSettingsManager.removeItem()

移除 实例的 Item 项，其和直接 schemaInitializer.remove() 方法的区别是，可以确保在实例存在时才会移除。

- 类型

```tsx | pure
class SchemaSettingsManager {
    removeItem(schemaInitializerName: string, itemName: string): void
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        // 方式1：先获取，再删除子项，需要确保已注册
        const mySchemaSettings = this.app.schemaSettingsManager.get('MySchemaSettings');
        if (mySchemaSettings) {
            mySchemaSettings.remove('a')
        }

        // 方式2：通过 addItem，内部确保在 mySchemaSettings 注册时才会移除
        this.app.schemaSettingsManager.remove('MySchemaSettings', 'a')
    }
}
```
