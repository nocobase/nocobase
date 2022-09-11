# 查询操作符

相当于 Sequelize 中的 [Op](https://sequelize.org/docs/v6/core-concepts/model-querying-basics/#operators) 对象。

为了支持 JSON 化，NocoBase 中将查询操作符转换为以 `$` 为前缀的字符串标识。

另外，NocoBase 也提供了扩展操作符的方式，详见 [`registerOperators()`](../database#registeroperators)。

## 操作符列表

### `'$isFalsy'`

判断值是否为假值。仅包含 `null` 和 `false`，不含 `0` 和 空字符串 `''`。

### `'$isTruly'`

判断值是否为真值。`true`，不含其他 JS 中转换为逻辑值后为 `true` 的值，如 `1`、`'abc'` 等。

### `'$includes'`

判断字符串是否包含指定子串。

### `'notIncludes'`

判断字符串是否不包含指定子串。

### `'$startsWith'`

判断字符串是否以指定子串开头。

### `'$notStatsWith'`

判断字符串是否不以指定子串开头。

### `'$endsWith'`

判断字符串是否以指定子串结尾。

### `'$notEndsWith'`

判断字符串是否不以指定子串结尾。
