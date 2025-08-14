# 打开流配置表单（flowSettings.open）

<!-- markdownlint-disable MD010 MD033 MD029 -->

通过调用 flowEngine.flowSettings.open 和 model.openFlowSettings 方法，可以打开流配置表单。其中`model.openFlowSettings`是对`flowEngine.flowSettings.open`的封装，提供了更方便的调用方式。

## 方法签名

```ts
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>);

flowEngine.flowSettings.open(options: FlowSettingsOpenOptions);

interface FlowSettingsOpenOptions {
	model: FlowModel;               // 必填，所属的模型实例
	preset?: boolean;               // 仅渲染标记了 preset=true 的步骤（默认 false）
	flowKey?: string;               // 指定单个 flow
	flowKeys?: string[];            // 指定多个 flow（当同时提供 flowKey 时被忽略）
	stepKey?: string;               // 指定单个步骤（通常与 flowKey 搭配）
	uiMode?: 'dialog' | 'drawer';   // 展示容器，默认 'dialog'
}
```

## 行为约定一览

- 必须提供 model 实例；用于读取 flow 定义、上下文与保存参数。
- 当同时提供 flowKey 与 flowKeys 时，以 flowKey 为准（只处理单个 flow）。
- 当提供 stepKey 时，应与某个 flowKey 组合使用；仅渲染该 flow 下命中的步骤。
- 情况 A：当外部明确指定了 flowKey + stepKey 且仅匹配到一个步骤时，采用“单步直出”表单（不使用折叠面板）。
- 情况 B：当未提供 stepKey，但最终仅匹配到一个步骤时，仍保持折叠面板的外观，以区别于上述“单步直出”样式。
- 情况 C：当命中多个 flow 时，按 flow 分组并在折叠面板中渲染每个步骤组。
- 当 `preset: true` 时，仅渲染标记了 `preset: true` 的步骤；若无匹配步骤，将通过 `message.info` 提示并不会打开配置视图。
- uiMode 控制展示容器：'dialog' 或 'drawer'，由 model.context.viewer 提供具体实现。
- 保存顺序：对每个 step 执行 submit -> setStepParams -> beforeParamsSave -> 统一 model.save() -> afterParamsSave。

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
