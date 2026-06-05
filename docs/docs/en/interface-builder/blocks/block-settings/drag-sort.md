# Drag-and-drop sorting

## Introduction

Drag-and-drop sorting relies on a sorting field and is used to manually order block records. 


:::info{title=Tip}
* When the same sorting field is used across multiple blocks, mixing drag operations may break existing order.
* For table drag-and-drop sorting, the sorting field must not use grouping rules.
* Tree tables only support sorting nodes at the same level.

:::


## Drag-sort setup

Create a "Sort" field. Sorting fields are no longer created automatically when building a table, so you need to create one manually.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

When enabling drag-and-drop sorting in a table, select the sorting field.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Drag sorting table rows


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Sorting rules


Assume the current order is:

```
[1,2,3,4,5,6,7,8,9]
```

When one item (for example, 5) moves forward to position 3, only 3, 4, and 5 change their order values: 5 takes position 3, and 3 and 4 each shift back by one.

```
[1,2,5,3,4,6,7,8,9]
```

Then move 6 back to position 8. 6 takes position 8, and 7 and 8 each shift forward by one.

```
[1,2,5,3,4,7,8,6,9]
```
