# 事件流

本示例展示了如何在 NocoBase 中为组件和区块添加事件流，实现自定义交互行为。

## 按钮的点击事件

通过流程定义为按钮绑定事件，实现点击后的自定义逻辑。

<code src="./index.tsx"></code>

## 使用 BlockModel.setDecoratorProps() 添加卡片点击事件

卡片为区块的装饰器，通过设置装饰器属性，为卡片组件添加点击事件，实现自定义响应。

<code src="./block-model.tsx"></code>

## 利用 Model 的 context.ref 实现原生 onclick 监听

通过获取组件的原生 DOM 引用，直接绑定原生事件，实现更灵活的事件处理。

<code src="./context-ref.tsx"></code>

## 通过 element.addEventListener() 方式处理

`element.addEventListener()` 是独立的，允许同一个事件添加多个监听函数。

<code src="./event-listener.tsx"></code>

## on.phase（执行时机）

除了声明触发事件 `eventName` 外，还可以通过 `phase / flowKey / stepKey` 把 flow 的步骤插入到其它 flow 的指定位置执行。

<code src="./execution-timing.tsx"></code>
