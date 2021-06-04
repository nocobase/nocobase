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

## 代码演示

### 基本用法

<code src="./demos/demo2.tsx"/>

### 内嵌区块

<code src="./demos/demo3.tsx"/>

### useDrag & useDrop

<code src="./demos/demo4.tsx"/>

### useColResize

<code src="./demos/demo5.tsx"/>

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

### useDrag

### useDrop

### useColResize

