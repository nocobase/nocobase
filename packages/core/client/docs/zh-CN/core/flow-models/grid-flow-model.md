# GridModel

## 参数说明

### rows

- 类型定义：
  ```ts
  type Rows = Record<rowKey: string, string[][]>;
  ```
- 说明：
  - `rowKey`：唯一的字符串，表示每一行的 key。
  - `rows` 是一个三维数组结构：
    - 第一维（对象的 key）：行
    - 第二维（数组）：列
    - 第三维（数组）：每个单元格（列）内可以放多个 block 的 uid
  - 示例：
    ```ts
    rows: {
      row1: [           // 第一行
        ['block1'],     // 第一列，只有一个 block
        ['block2'],     // 第二列，只有一个 block
      ],
      row2: [
        ['block3', 'block4'], // 第一列，有两个 block
        ['block5'],           // 第二列
      ],
    }
    ```
  - 特性：
    - 如果某个 block uid 不在 items 中，会被自动过滤。
    - 如果 items 中有 block uid 不在 rows 中，会自动作为新行追加到最后，每个 uid 单独一行。

### sizes

- 类型定义：
  ```ts
  type Sizes = Record<rowKey: string, number[]>;
  ```
- 说明：
  - `sizes` 的 key 必须与 `rows` 的 key 对应。
  - `sizes[rowKey]` 是一个数组，表示该行每一列的宽度（单位为 24 格）。
  - 未设置的列会自动等分剩余宽度。例如 2 列未设置，则各 50%；3 列未设置，则各 33.33%。
  - 所有宽度会自动减去列间距（16px）。
  - 示例：
    ```ts
    sizes: {
      row1: [8, 16],   // row1 两列，宽度分别为 8/24 和 16/24
      row2: [12, 12],  // row2 两列，宽度各 12/24
      // row3 未设置，自动等分
    }
    ```

---

## 示例

### 基本用法

默认会将 items 转为 stepParams 的 rows

<code src="./demos/grid-model-basic.tsx"></code>

### 两列

```ts
{
  stepParams: {
    defaultFlow: {
      grid: {
        // 两行
        rows: {
          row1: [['block1'], ['block2']], // 两列
          row2: [['block3']], // 一列
        },
      },
    },
  },
}
```

每一行的 value 是一个二维数组，外层数组表示行，内层数组表示每个单元格（列）内的 block uid 列表。

<code src="./demos/grid-model.tsx"></code>

### 设置宽度 - sizes

24 格布局，支持自定义每行每列的宽度。未设置的列自动等分剩余宽度。

```ts
{
  stepParams: {
    defaultFlow: {
      grid: {
        rows: {
          row1: [['block1'], ['block2']],
          row2: [['block3'], ['block4']],
          row3: [['block5'], ['block6']], // 等比宽度
        },
        sizes: {
          row1: [8, 16],      // row1 两列，宽度分别为 8/24 和 16/24
          row2: [16, 8],      // row2 两列，宽度分别为 16/24 和 8/24
          // row3 未设置，自动等分（2列各 50%）
        },
      },
    },
  },
}
```

- `sizes` 的 key 必须与 `rows` 的 key 对应。
- `sizes[rowKey]` 是一个数组，表示该行每一列的宽度（单位为 24 格）。
- 如果某行的 `sizes` 未设置，或某列未设置宽度，则自动等分剩余宽度。
- 所有宽度会自动减去列间距（16px）。

<code src="./demos/grid-model-sizes.tsx"></code>
