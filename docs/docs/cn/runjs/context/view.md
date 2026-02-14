# ctx.view

当前激活的视图控制器（弹窗、抽屉、气泡层、嵌入式区域等），用于访问视图级信息和操作。由 FlowViewContext 提供，仅在通过 `ctx.viewer` 或 `ctx.openView` 打开的视图内容中可用。

## 适用场景

| 场景 | 说明 |
|------|------|
| **弹窗/抽屉内容** | 在 `content` 中通过 `ctx.view.close()` 关闭当前视图，或使用 `Header`、`Footer` 渲染标题和底部 |
| **表单提交后** | 提交成功后调用 `ctx.view.close(result)` 关闭并回传结果 |
| **JSBlock / Action** | 根据 `ctx.view.type` 判断当前视图类型，或读取 `ctx.view.inputArgs` 中的打开参数 |
| **关联选择、子表格** | 读取 `inputArgs` 中的 `collectionName`、`filterByTk`、`parentId` 等做数据加载 |

> 注意：`ctx.view` 仅在有视图上下文的 RunJS 环境中可用（如 `ctx.viewer.dialog()` 的 content 内、弹窗表单、关联选择器内部）；在普通页面或后端上下文中为 `undefined`，使用时建议做可选链判断（`ctx.view?.close?.()`）。

## 类型定义

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // 流配置视图中可用
};
```

## 常用属性和方法

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | 当前视图类型 |
| `inputArgs` | `Record<string, any>` | 打开视图时传入的参数，见下方 |
| `Header` | `React.FC \| null` | 头部组件，用于渲染标题、操作区 |
| `Footer` | `React.FC \| null` | 底部组件，用于渲染按钮等 |
| `close(result?, force?)` | `void` | 关闭当前视图，可传 `result` 回传给调用方 |
| `update(newConfig)` | `void` | 更新视图配置（如宽度、标题） |
| `navigation` | `ViewNavigation \| undefined` | 页面内视图导航，含 Tab 切换等 |

> 目前仅 `dialog` 和 `drawer` 支持 `Header` 和 `Footer`。

## inputArgs 常见字段

不同打开场景下 `inputArgs` 字段不同，常见包括：

| 字段 | 说明 |
|------|------|
| `viewUid` | 视图 UID |
| `collectionName` | 数据表名 |
| `filterByTk` | 主键筛选（单条详情） |
| `parentId` | 父级 ID（关联场景） |
| `sourceId` | 来源记录 ID |
| `parentItem` | 父项数据 |
| `scene` | 场景（如 `create`、`edit`、`select`） |
| `onChange` | 选择/变更后的回调 |
| `tabUid` | 当前 Tab UID（页面内） |

通过 `ctx.getVar('ctx.view.inputArgs.xxx')` 或 `ctx.view.inputArgs.xxx` 访问。

## 示例

### 关闭当前视图

```ts
// 提交成功后关闭弹窗
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// 关闭并回传结果
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### 在 content 中使用 Header / Footer

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="编辑" extra={<Button size="small">帮助</Button>} />
      <div>表单内容...</div>
      <Footer>
        <Button onClick={() => close()}>取消</Button>
        <Button type="primary" onClick={handleSubmit}>确定</Button>
      </Footer>
    </div>
  );
}
```

### 根据视图类型或 inputArgs 做分支

```ts
if (ctx.view?.type === 'embed') {
  // 嵌入式视图中隐藏头部
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // 用户选择器场景
}
```

## 与 ctx.viewer、ctx.openView 的关系

| 用途 | 推荐用法 |
|------|----------|
| **打开新视图** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` 或 `ctx.openView()` |
| **操作当前视图** | `ctx.view.close()`、`ctx.view.update()` |
| **获取打开参数** | `ctx.view.inputArgs` |

`ctx.viewer` 负责「打开」视图，`ctx.view` 表示「当前」所在视图实例；`ctx.openView` 用于打开已配置的流程视图。

## 注意事项

- `ctx.view` 仅在视图内部可用，普通页面中为 `undefined`
- 使用可选链：`ctx.view?.close?.()` 避免在无视图上下文时报错
- `close(result)` 的 `result` 会传递给 `ctx.viewer.open()` 返回的 Promise

## 相关

- [ctx.openView()](./open-view.md)：打开已配置的流程视图
- [ctx.modal](./modal.md)：轻量级弹窗（信息、确认等）

> `ctx.viewer` 提供 `dialog()`、`drawer()`、`popover()`、`embed()` 等方法打开视图，其打开的 `content` 内可访问 `ctx.view`。
