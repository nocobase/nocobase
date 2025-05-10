# EventBus

## 事件触发单个action
全局监听事件，组件中触发事件

<code src="./demos/events/basic.tsx"></code>

## action触发另一个事件

<code src="./demos/events/basic-form.tsx"></code>

## action复用
多个按钮触发同一个action

<code src="./demos/events/action-reuse.tsx"></code>

## 多事件同步触发
同时触发多个事件，这些事件会同步执行

<code src="./demos/events/multi-sync-events.tsx"></code>

## 多事件异步触发
同时触发多个事件，这些事件会异步并行执行

<code src="./demos/events/multiple-async-events.tsx"></code>

# 事件流

## 事件流顺序执行多个action
通过EventFlowManager注册事件与多个action，依次执行

<code src="./demos/events/basic-eventflow.tsx"></code>

## 条件事件流
根据条件决定执行哪些动作的事件流

<code src="./demos/events/conditional-eventflow.tsx"></code>

## 条件触发事件流
根据事件级别的条件决定是否触发整个事件流

<code src="./demos/events/conditional-flow-trigger.tsx"></code>

## 事件流数据传递
演示如何在事件流的各个步骤之间传递数据

<code src="./demos/events/data-passing-eventflow.tsx"></code>

## 多按钮事件流
为不同按钮注册不同的事件流

<code src="./demos/events/multi-button-eventflow.tsx"></code>

## 可配置动作
通过配置弹窗修改动作参数，然后执行更新后的动作

<code src="./demos/events/configurable-action.tsx"></code>
