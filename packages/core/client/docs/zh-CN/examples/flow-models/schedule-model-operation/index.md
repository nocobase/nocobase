# scheduleModelOperation

下面的示例用于演示 `scheduleModelOperation` 如何实现「事件流（Event flow）」在静态流（内置流）中的插入与顺序控制。

## 1. 用 `on.phase` 配置静态流顺序（对应事件流编辑器选项）

<code src="./static-flow-phase.tsx"></code>

## 2. 直接使用 `scheduleModelOperation({ when })` 指定锚点

<code src="./schedule-when.tsx"></code>

