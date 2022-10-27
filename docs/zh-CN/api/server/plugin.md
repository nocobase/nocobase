# Plugin

```ts
const app = new Application();

class MyPlugin extends Plugin {
  
}

app.plugin(MyPlugin, { name: 'my-plugin' });
```

## 属性

### `options`

插件配置信息

### `name`

插件标识，只读

### `model`

插件模型数据

## 实例方法

### `beforeLoad()`

加载前，如事件或类注册

### `load()`

加载配置

### `install()`

插件安装逻辑
