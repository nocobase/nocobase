# Drag-and-Drop Sorting

## Introduction

Drag-and-drop sorting relies on a sort field to manually reorder records within a block.

:::info{title=Tip}
* When the same sort field is used for drag-and-drop sorting across multiple blocks, it may disrupt the existing order.
* When using drag-and-drop sorting in a table, the sort field cannot have grouping rules configured.
* Tree tables only support sorting nodes within the same level.
:::

## Configuration

Add a "Sort" type field. Sort fields are no longer automatically generated when creating a collection; they must be created manually.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

When enabling drag-and-drop sorting for a table, you need to select a sort field.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)

## Drag-and-Drop Sorting for Table Rows

![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)

## Sorting Rules Explanation

Assume the current order is:

```
[1,2,3,4,5,6,7,8,9]
```

When an element (e.g., 5) is moved forward to the position of 3, only the sort values of 3, 4, and 5 will change: 5 takes the position of 3, and 3 and 4 each move back one position.

```
[1,2,5,3,4,6,7,8,9]
```

If you then move 6 backward to the position of 8, 6 takes the position of 8, and 7 and 8 each move forward one position.

```
[1,2,5,3,4,7,8,6,9]
```