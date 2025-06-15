# FlowSubModel

在 NocoBase 流引擎中，**子模型（SubModel）** 是构建复杂模型树结构的核心能力。通过子模型机制，可以灵活地实现模型的嵌套、分组、组合等多层级结构，满足各种业务场景下的需求。

---

## 什么是子模型？

子模型是指挂载在某个父模型之下的模型实例。每个 FlowModel 实例都可以包含多个子模型，这些子模型可以是对象（如 `page.header`、`page.content`、`page.footer`），也可以是数组（如 `page.tabs`、`table.columns`、`form.fields`）。通过子模型机制，可以实现如表单分组、区块嵌套、动态字段等复杂结构。

---

## 子模型的类型

- **对象子模型**  
  以对象形式存在，每个字段只允许有一个子模型。例如：`page.header`、`page.content`、`page.footer`。

- **数组子模型**  
  以数组形式存在，每个字段可以包含多个子模型。例如：`page.tabs`、`table.columns`、`form.fields`。

---

## 子模型的常见用途

- 表单、表格等组件的分组与嵌套
- 区块、字段、操作等模型的组合
- 动态添加、删除、排序子元素
- 复杂业务流程的多层级建模

---

## 子模型的管理方法

FlowModel 提供了丰富的 API 用于子模型的创建、添加、遍历和父子关系维护：

| 方法 | 说明 |
|------|------|
| `setSubModel(subKey, options)` | 创建并设置对象字段的子模型 |
| `addSubModel(subKey, options)` | 创建并添加数组字段的子模型 |
| `mapSubModels(subKey, callback)` | 遍历指定 key 的子模型并处理 |
| `setParent(parent)` | 设置父模型 |
| `createRootModel(options)` | 创建根模型（通常由 flowEngine 调用） |

---

## 用法示例

<code src="./demos/flow-sub-model.tsx"></code>

```ts
// 创建根模型
const model = flowEngine.createModel({ use: 'PageModel', props: { name: 'Demo' } });

// 设置对象子模型
model.setSubModel('header', { use: 'HeaderModel', props: { title: '页眉' } });

// 添加数组子模型
model.addSubModel('tabs', { use: 'TabModel', props: { label: 'Tab1' } });
model.addSubModel('tabs', { use: 'TabModel', props: { label: 'Tab2' } });

// 遍历所有 tabs 子模型
model.mapSubModels('tabs', (tab) => {
  console.log(tab.props.label);
});
```

---

## 子模型的父子关系

- 每个子模型都自动维护对父模型的引用（`parent`）。
- 父模型通过 `subModels` 管理所有子模型。
- 通过 `setParent` 方法可手动设置父模型，但一般无需手动操作。

---

## 子模型的使用场景

作为组件渲染

```tsx | pure
model.mapSubModels('tabs', (tab) => {
  return <FlowModelRenderer model={tab} />
});
```

作为属性值使用

```tsx | pure
await model.applySubModelsAutoFlows(ctx);
const columns = model.mapSubModels('columns', (column) => column.getProps());
<Table columns={columns} />
```

---

## 子模型组件

NocoBase 提供了 AddSubModelButton、AddBlockModelButton AddFieldModelButton 组件，方便在界面上动态添加、删除子模型，提升开发体验：

- 用于向任意父模型添加任意类型的子模型。
- 支持自定义菜单项、回调、按钮内容等。
- 适用于绝大多数子模型添加场景。

**主要 Props：**

| Prop | 类型 | 说明 |
|------|------|------|
| `model` | `FlowModel` **(必填)** | 当前父模型实例 |


AddSubModelButton 示例

```tsx | pure
<AddSubModelButton
  model={currentModel}
  subModelKey={'items'}
  items={[
    {
      key: 'subModel1',
      label: '子模型 1',
      disabled: true,
      icon: <span>🔧</span>,
      createModelOptions: {
        use: 'SubModel1',
        stepParams: {
          myflow: {
            step1: {
              title: '子模型 1',
            },
          },
        },
      },
    },
    {
      key: 'subModel2',
      label: '子模型 2',
      icon: <span>🛠️</span>,
      createModelOptions: {
        use: 'SubModel1',
        stepParams: {
          myflow: {
            step1: {
              title: '子模型 2',
            },
          },
        },
      },
    },
    {
      key: 'b-group',
      label: '模型 B 组',
      icon: <span>🛠️</span>,
      children: [
        {
          key: 'b1',
          label: '模型 B1',
          icon: <span>🛠️</span>,
          createModelOptions: {
            use: 'SubModel1',
            stepParams: {
              myflow: {
                step1: {
                  title: '子模型 B1',
                },
              },
            },
          },
        },
        {
          key: 'b2',
          label: '模型 B2',
          icon: <span>🛠️</span>,
          createModelOptions: {
            use: 'SubModel1',
            stepParams: {
              myflow: {
                step1: {
                  title: '子模型 B2',
                },
              },
            },
          },
        },
      ],
    },
  ]}
>
  添加子模型
</AddSubModelButton>
```
---

## 注意事项

- 推荐通过 `setSubModel` 和 `addSubModel` 方法管理子模型，避免直接操作 `subModels` 字段。
- 子模型字段不存在时会自动初始化为合适的类型（对象或数组）。
- 子模型的类型和结构建议通过泛型参数进行类型约束，提升类型安全和开发体验。
- 组件添加子模型时，通常会自动维护父子关系和数据同步。

---

通过子模型机制与配套组件，NocoBase 支持灵活的模型树结构和动态 UI 组织，是低代码建模和流程引擎的基础能力之一。
