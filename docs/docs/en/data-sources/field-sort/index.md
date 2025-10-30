# Sort Field

<PluginInfo name="field-sort"></PluginInfo>

## Introduction

Sort fields are used to sort records in the collection, supporting group first then sort (sort1).

:::warning
Since the sort field is a field in the current collection, when sorting by group, it does not support the same record being divided into multiple groups.
:::

## Installation

Built-in plugin, no separate installation required.

## User Manual

### Create a Sort Field

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

When creating sort fields, the sort values will be initialized:

- If group sorting is not selected, initialization will be based on the primary key field and creation date field.
- If group sorting is selected, the data will be grouped first, and then initialization will be based on the primary key field and creation date field.

:::warning{title="Explanation of Transaction Consistency"}
- When creating a field, if the sort value initialization fails, the sort field will not be created;
- Within a certain range, if a record moves from position A to position B, the sort values of all records in the AB interval will change. If one fails, the move will fail, and the sort values of the related records will not change.
:::

#### Example 1: Create the sort1 field

The sort1 field is not grouped

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

The sort fields of each record will be initialized based on the primary key field and creation date field.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Example 2: Create a sort2 field based on Class ID grouping

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

At this time, all records in the collection will be grouped first (grouped by Class ID), and then the sort field (sort2) will be initialized. The initial values of each record are:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Drag-and-Drop Sorting

Sort fields are mainly used for drag-and-drop sorting of various block records. The blocks currently supporting drag-and-drop sorting include tables and boards.

:::warning
- When the same sort field is used for drag-and-drop sorting, mixed use of multiple blocks may disrupt the existing order;
- The field for table drag-and-drop sorting cannot choose a sort field with a grouping rule;
  - Exception: In a one-to-many relationship table block, the foreign key can serve as a group;
- Currently, only the board block supports group drag-and-drop sorting.
:::

#### Drag-and-Drop Sorting of Table Rows

Table block

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Relationship table block

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
In a one-to-many relationship block

- If an ungrouped sort field is selected, all records may participate in the sorting;
- If it is first grouped based on the foreign key and then sorted, the sorting rule will only affect the data within the current group.

The final effect is consistent, but the number of records participating in sorting is different, for more explanation, see [Sorting Rule Explanation](#Sorting Rule Explanation)
:::

#### Drag-and-Drop Sorting of Board Cards

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Sorting Rule Explanation

#### Displacement between ungrouped (or same group) elements

Suppose there is a set of data

```
[1,2,3,4,5,6,7,8,9]
```

When an element, suppose 5, moves forward to position 3, at this time, only the sequence numbers 3,4,5 have changed, 5 occupies the position of 3, and 3,4 each move back one position.

```
[1,2,5,3,4,6,7,8,9]
```

At this time, continue to move 6 back to position 8, 6 occupies the position of 8, 7,8 each move forward one position.

```
[1,2,5,3,4,7,8,6,9]
```

#### Movement of elements between different groups

When sorting by group, when a record moves to another group, the group where it belongs will also change. As shown in the example below:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

When 1 moves to 6 (default behind), the group where 1 belongs will also change from A to B

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Sort changes are unrelated to the data displayed on the screen

For example, there is a set of data

```
[1,2,3,4,5,6,7,8,9]
```

The screen only shows

```
[1,5,9]
```

When 1 moves to position 9, the positions of the intervening 2,3,4,5,6,7,8 data will all change

```
[2,3,4,5,6,7,8,9,1]
```

The screen displays

```
[5,9,1]
```