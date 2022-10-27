# Plugin

## 示例

```ts
const app = new Application();

class MyPlugin extends Plugin {
  afterAdd() {}
  beforeLoad() {}
  load() {}
  install() {}
  afterEnable() {}
  afterDisable() {}
  remove() {}
}

app.plugin(MyPlugin, { name: 'my-plugin' });
```

## 属性

### `options`

插件配置信息

### `name`

插件标识，只读

## 实例方法

### `afterAdd()`

插件 add/addStatic 之后

### `beforeLoad()`

插件加载前，如事件或类注册

### `load()`

加载插件，配置之类

### `install()`

插件安装逻辑，如初始化数据

### `afterEnable()`

插件激活之后的逻辑

### `afterDisable()`

插件禁用之后的逻辑

### `remove()`

用于实现插件删除逻辑