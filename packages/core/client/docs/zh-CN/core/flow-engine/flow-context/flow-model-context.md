# FlowModelContext

`FlowModelContext` 是每个模型实例的专属上下文对象，用于在模型树中共享与模型强相关的服务、配置和临时数据。通过 `model.setContext()` 注册，通过 `model.ctx` 访问。

---

## ✨ 设计理念

- **解耦与复用**：提供一种机制，在模型树中共享信息，避免层层传参。
- **自动向下传播**：父模型设置的上下文自动传递给子模型。
- **局部可覆盖**：子模型可以通过同名属性覆盖父模型提供的上下文值，实现本地控制。

---

## 🔧 基本用法

### 设置上下文

```ts
model.setContext({
  foo: value,
  bar: otherValue,
});
````

### 访问上下文

```ts
const value = this.ctx.foo;
```

---

## 📥 向下共享与同名覆盖

### 向下共享

父模型设置的上下文会自动传递给子模型，无需显式传参。

```ts
class TableModel extends FlowModel {
  onInit() {
    this.setContext({
      tableModel: this, // 向子模型共享自身实例
    });
  }

  getName() {
    return 'users';
  }
}

class ColumnModel extends FlowModel {
  getTableNameFromParent() {
    return this.ctx.tableModel?.getName();
  }
}
```

### 同名覆盖

子模型可以通过 `setContext` 注册同名字段，覆盖父模型的值。访问 `this.ctx.xxx` 时会优先使用子模型的上下文。

```ts
class ParentModel extends FlowModel {
  onInit() {
    this.setContext({
      formLayout: 'horizontal',
    });
  }
}

class ChildModel extends FlowModel {
  onInit() {
    this.setContext({
      formLayout: 'vertical',
    });
  }

  renderForm() {
    console.log(this.ctx.formLayout); // 输出: 'vertical'
  }
}
```

> ✅ 说明：这种“覆盖”仅影响当前模型及其子树的访问，不会影响父模型或兄弟模型。

---

## ⚠️ 注意事项

* **避免滥用**：不要将所有数据都放入上下文，只应放置需要跨模型共享的服务或配置。
* **注意命名冲突**：建议使用命名空间方式组织上下文内容，避免污染。
* **完善类型提示**：

  ```ts
  interface MyContext {
    tableModel?: TableModel;
    formLayout?: string;
  }

  class ColumnModel extends FlowModel<MyContext> {
    get layout() {
      return this.ctx.formLayout;
    }
  }
  ```

---

## 📌 总结

| 特性     | 描述                              |
| ------ | ------------------------------- |
| 自动向下共享 | 父模型设置的上下文，子模型可直接访问              |
| 局部同名覆盖 | 子模型通过 `setContext` 可覆盖父模型同名字段   |
| 动态注册   | 任意时刻可调用 `setContext()` 注册或修改上下文 |
| 类型支持   | 可结合 TypeScript 泛型提供上下文类型提示      |
| 轻量灵活   | 无需依赖注入框架，适合模型树结构下的上下文共享与复用      |
