# FlowModelContext

> FlowModelContext 继承自 FlowContext，详见 [FlowContext](./flow-context)

`FlowModelContext` 是每个模型实例的专属上下文对象，基于 `FlowContext` 实现。它用于在模型树结构中，通过代理（delegate）机制共享与模型强相关的服务、配置和临时数据，实现模型间的解耦与复用。

---

## 设计理念

- **模型树内共享**：父模型通过代理（delegate）机制将上下文能力传递给子模型，子模型可直接访问父模型或全局上下文。
- **同名覆盖**：子模型注册同名属性时会覆盖父模型的值，仅影响当前模型及其子树。
- **动态注册**：支持运行时动态注册属性和方法，灵活扩展模型能力。
- **类型安全**：可结合 TypeScript 泛型提供上下文类型提示。

---

## 代理（delegate）机制说明

- `FlowModelContext` 通过代理（delegate）机制可访问 `FlowEngineContext` 的属性和方法，实现全局能力共享。
- 子模型的 `FlowModelContext` 通过代理（delegate）机制可访问父模型的上下文（同步关系），支持同名覆盖。
- 异步父子模型不会建立代理（delegate）关系，避免状态污染。
- 代理链可多层嵌套，支持复杂模型树结构下的上下文访问。

---

## 注册与访问

### 注册属性

```ts
model.context.defineProps({
  foo: value,
  bar: () => 'computed',
  asyncData: async () => fetchData(),
});
```

### 注册方法

```ts
model.context.defineMethods({
  getUser() { /* ... */ },
  async fetchData() { /* ... */ },
});
```

### 访问上下文

```ts
const value = model.context.foo;
const data = await model.context.asyncData;
const user = model.context.getUser();
```

---

## 常用方法

| 方法                                       | 说明                                                         |
|--------------------------------------------|--------------------------------------------------------------|
| `model.context.getAction(name)`            | 获取 Action 定义（模型类级优先，未命中回退全局）。            |
| `model.context.getActions()`               | 获取合并后的 Action（Map），类级覆盖同名全局项。               |
| `model.context.runAction(name, params?)`   | 执行解析后的 Action（合并默认参数，按需解析表达式）。          |


## 典型用法

### 1. 父模型向子模型共享自身实例

```ts
class TableModel extends FlowModel {
  onInit() {
    this.context.defineProps({
      tableModel: this,
    });
  }
}

class ColumnModel extends FlowModel {
  getTableName() {
    return this.context.tableModel?.getName();
  }
}
```

### 2. 同名覆盖

```ts
class ParentModel extends FlowModel {
  onInit() {
    this.context.defineProps({
      layout: 'horizontal',
    });
  }
}

class ChildModel extends FlowModel {
  onInit() {
    this.context.defineProps({
      layout: 'vertical',
    });
  }
  getLayout() {
    return this.context.layout; // 'vertical'
  }
}
```

---

## 注意事项

- **避免滥用**：仅将需要跨模型共享的服务或配置放入上下文。
- **命名冲突**：建议使用命名空间方式组织上下文内容，避免污染。
- **类型提示**：结合 TypeScript 泛型提升开发体验。
- **代理链可多层嵌套**，但建议保持上下文结构清晰。

---

## 总结

- `FlowModelContext` 通过代理（delegate）机制实现模型树内上下文共享与复用。
- 支持同名覆盖、动态注册、类型安全。
- 适合复杂模型树结构下的服务、配置、数据共享与隔离。
