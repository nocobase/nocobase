# 打开流配置表单（flowSettings.open）

<!-- markdownlint-disable MD010 MD033 MD029 -->

通过调用 flowEngine.flowSettings.open 和 model.openFlowSettings 方法，可以打开流配置表单。其中`model.openFlowSettings`是对`flowEngine.flowSettings.open`的封装，提供了更方便的调用方式。

## 方法签名

```ts
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;

flowEngine.flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;

interface FlowSettingsOpenOptions {
	model: FlowModel;               // 必填，所属的模型实例
	preset?: boolean;               // 仅渲染标记了 preset=true 的步骤（默认 false）
	flowKey?: string;               // 指定单个 flow
	flowKeys?: string[];            // 指定多个 flow（当同时提供 flowKey 时被忽略）
	stepKey?: string;               // 指定单个步骤（通常与 flowKey 搭配）
	uiMode?: 'dialog' | 'drawer';   // 展示容器，默认 'dialog'
	onCancel?: () => void;          // 取消按钮点击后触发（无参数）
	onSaved?: () => void;           // 配置保存成功后触发（无参数）
}
```

### 返回值

- 返回 `true`：已成功打开配置弹窗（对话框或抽屉）。
- 返回 `false`：未打开弹窗，通常因为没有任何可配置的步骤（例如步骤均无 `uiSchema` 或被 `hideInSettings` 过滤；或在 `preset: true` 时没有命中预设步骤）。

注意：返回值仅表示“是否打开了弹窗”，不代表用户是否点击了“确定”保存。保存成功与否可通过 `onSaved` 回调感知。

## 行为约定一览

- 必须提供 model 实例；用于读取 flow 定义、上下文与保存参数。
- 当同时提供 flowKey 与 flowKeys 时，以 flowKey 为准（只处理单个 flow）。
- 当提供 stepKey 时，应与某个 flowKey 组合使用；仅渲染该 flow 下命中的步骤。
- 情况 A：当外部明确指定了 flowKey + stepKey 且仅匹配到一个步骤时，采用“单步直出”表单（不使用折叠面板）。
- 情况 B：当未提供 stepKey，但最终仅匹配到一个步骤时，仍保持折叠面板的外观，以区别于上述“单步直出”样式。
- 情况 C：当命中多个 flow 时，按 flow 分组并在折叠面板中渲染每个步骤组。
- 当 `preset: true` 时，仅渲染标记了 `preset: true` 的步骤。
- uiMode 控制展示容器：'dialog' 或 'drawer'，由 model.context.viewer 提供具体实现。
- 保存顺序：对每个 step 执行 submit -> setStepParams -> beforeParamsSave -> 统一 model.save() -> afterParamsSave。

- 方法返回布尔值：`true` 表示已打开弹窗；`false` 表示未打开（例如没有可配置步骤），此时不会触发 `onSaved`/`onCancel` 回调。

> 提示：仅包含具备 uiSchema 且未被 hideInSettings 的步骤会被渲染到配置表单中。

---

## 情况 A：flowKey + stepKey 且唯一命中，单步直出（无折叠）

当明确指定了 flowKey 和 stepKey，并且最终只命中一个步骤时，界面会直接展示该步骤的表单，不再包裹折叠面板。

<code src="./case-a-single-step-direct.tsx"></code>

---

## 情况 B：单个 flow 且仅一个步骤，但不指定 stepKey（保持折叠样式）

当只指定 flowKey 且该 flow 仅有一个步骤时，会展示折叠面板外观（默认展开），用于区分与“单步直出”的视觉差异。

<code src="./case-b-single-flow-single-step-collapse.tsx"></code>

---

## 情况 C：多个 flow 命中，按 flow 分组渲染

当命中多个 flow（例如通过 flowKeys 指定多个 key）时，会对每个 flow 生成一个折叠面板分组，分组内再以折叠面板展示各个步骤。

<code src="./case-c-multi-flows-grouped.tsx"></code>

---

## uiMode：drawer 抽屉模式

通过设置 `uiMode: 'drawer'`，可以将默认的对话框切换为抽屉。

<code src="./ui-mode-drawer.tsx"></code>

---

## 仅渲染预设（preset）步骤

当传入 `preset: true` 时，配置弹窗中只会出现被标记为 `preset: true` 的步骤。例如下例中 flow 包含两个步骤，其中仅 `quick` 为预设步骤，因此弹窗中只会显示 `quick`。

<code src="./preset-only-steps.tsx"></code>

---

## flowKey 优先于 flowKeys 的示例

当同时传入 `flowKey` 与 `flowKeys` 时，会仅处理 `flowKey` 指定的单个 flow，忽略 `flowKeys`。

<code src="./priority-flowKey-over-flowKeys.tsx"></code>

---

## 保存与钩子

当点击“确定”保存时，FlowSettings 会对每个命中的步骤依次执行：

1. 表单提交校验
2. 将当前值写入 `model.setStepParams(flowKey, stepKey, values)`
3. 执行 `beforeParamsSave(ctx, current, previous)`
4. 统一调用 `model.save()`
5. 执行 `afterParamsSave(ctx, current, previous)`

若保存成功，默认通过 `model.context.message.success('Configuration saved')` 提示；若失败，则输出错误并通过 `message.error` 提示。

---

## 回调：onSaved 与 onCancel

在打开配置时可以传入两个可选的回调函数：

- `onSaved`: 当点击“确定”并成功完成所有步骤保存后触发（在弹窗关闭之后）。
- `onCancel`: 当点击“取消”关闭弹窗后触发。

示例：

```ts
// 推荐：通过 model.openFlowSettings 调用
const opened = await model.openFlowSettings({
	flowKey: 'myFlow',
	stepKey: 'general',
	onSaved: () => {
		console.log('Saved!');
	},
	onCancel: () => {
		console.log('Canceled.');
	},
});

if (!opened) {
	// 未打开弹窗时的兜底处理，例如：直接执行后续逻辑或提示用户
	console.log('No configurable steps, nothing opened.');
}

// 或者直接调用 flowEngine.flowSettings.open
const openedByEngine = await flowEngine.flowSettings.open({
	model,
	flowKey: 'myFlow',
	onSaved: () => {/* ... */},
	onCancel: () => {/* ... */},
});

if (!openedByEngine) {
	// 兜底处理
}
```
