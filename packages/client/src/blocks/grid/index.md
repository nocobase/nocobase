---
title: Grid - 栅格
nav:
  title: 组件
  path: /client
group:
  order: 2
  title: Blocks 
  path: /client/blocks
---

# Grid - 栅格

基于行（Row）和列（Col）来定义区块（Block）的外部框架。

## 列宽说明

最大支持四列，如果要支持越多列，需要处理的比例也越多。

### 列宽比例

一列：不可更改列宽

- 100%

两列：可以改变列宽，最小列宽 25%，最大列宽 75%，区间节点 50%。改变列宽时，另一列相应增加或减少

- 50% | 50%
- 25% | 75%
- 75% | 25%

三列：可以改变列宽，最小列宽 25%，最大列宽 50%，区间节点 33%。改变列宽时，等比变为非等比，宽度调节器左右两列，变宽的变为 50%，变窄的变为 25%，剩余一列变为 25%；非等比变等比，调整 50% 的列变窄或 25% 的列变宽，此时全部列宽都变为 33.3333%

- 33.33% | 33.33% | 33.33%
- 25% | 25% | 50%
- 25% | 50% | 25%
- 50% | 25% | 25%

四列：不可改变列宽，全部 25%

- 25% | 25% | 25% | 25%

### 新增列

一列变两列，两列宽都为 50%

- 50% | 50%

两列变三列，如果是等比，全部列宽变为 33.33%；非等比列，最大列宽变为 50%，其余的列宽变为 25%

- 33.33% | 33.33% | 33.33%
- 25% | 25% | 50%
- 25% | 50% | 25%
- 50% | 25% | 25%

三列变四列，全部列宽变为 25%

- 25% | 25% | 25% | 25%

### 减少列

四列减一列，全部列都变为 33.333%

- 33.33% | 33.33% | 33.33%

三列减一列，如果是等比，所有列都变为 50%，其他情况，最宽列变为 50%，其余不变，依旧为 25%

- 50% | 50%
- 25% | 75%
- 75% | 25%

两列减一列，剩余列变为 100%

- 100%

## 代码演示

### useDrag & useDrop

<code src="./demos/demo4.tsx"/>

### useColResize

<code src="./demos/demo5.tsx"/>

### Grid

<code src="./demos/demo6.tsx"/>

## API 说明

### Grid

只能在同一个 Grid 里拖拽布局

### Grid.Row

行

### Grid.Column

列

### Grid.Block

区块

### BlockOptions

```ts
interface BlockOptions {
  rowOrder: number;
  columnOrder: number;
  blockOrder: number;
}
```

- rowOrder：第几行
- columnOrder：第几列
- blockOrder：某单元格内部区块排序

### blocks2properties

原始 schema 需要至少 grid->row->col->block->custom 五层嵌套，写起来非常繁琐，`blocks2properties` 方法可以简化配置。

### useDrag & useDrop

拖拽 hooks

原生态的 

### useDrop

### useColResize
