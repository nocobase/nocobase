# PluginManager

应用插件管理器的实例，由应用自动创建，可以通过 `app.pm` 访问。

## 实例方法

### `create()`

在本地创建一个插件脚手架

**签名**

```ts
create(name, options): void;
```

### `addStatic()`

**签名**

```ts
addStatic(plugin: any, options?: PluginOptions): Plugin;
```

**示例**

```ts
pm.addStatic('nocobase');
```

### `add()`

**签名**

```ts
async add(plugin: any, options?: PluginOptions): Promise<Plugin>;
async add(plugin: string[], options?: PluginOptions): Promise<Plugin[]>;
```

**示例**

```ts
await pm.add(['test'], {
  builtIn: true,
  enabled: true,
});
```

### `get()`

获取插件实例

### `enable()`

### `disable()`

### `remove()`

### `upgrade()`
