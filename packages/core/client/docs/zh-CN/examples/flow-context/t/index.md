# ctx.t()

## 示例

### 在 FlowModel 中使用

```ts
class MyModel {
  render() {
    return <div>{this.context.t("Hello", { ns: 'ns1' })}</div>
  }
}
```

### 在 FlowStep 中使用

```ts
MyModel.registerFlow({
  title: escapeT('MyFlow', { ns }),
  steps: {
    step1: {
      title: escapeT('Title', { ns }),
      handler(ctx) {
        ctx.t('Hello');
      },
    },
  },
});
```

### 在 React 组件中使用

```tsx | pure
function MyComponent() {
  const ctx = useFlowEngineContext();
  return <div>{ctx.t("Hello", { ns: 'ns1' })}</div>
}
```

### 在自定义类中使用

```ts
class MyClass {
  constructor(protected ctx: FlowEngineContext | FlowModelContext | FlowRuntimeContext) {}
  myMethod() {
    this.ctx.t("Hello", { ns: 'ns1' });
  }
}
```

### 在自定义函数中使用

```ts
function myFunction(ctx: FlowEngineContext | FlowModelContext | FlowRuntimeContext) {
  ctx.t("Hello", { ns: 'ns1' });
}
```

### 在插件中使用

```ts
class MyPlugin {
  load() {
    this.t('Hello', { ns: 'ns1' });
  }
}

const myPlugin = usePlugin(MyPlugin);
myPlugin.t('Hello', { ns: 'ns1' });
```

