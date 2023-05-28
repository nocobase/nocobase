---
group:
  title: Schema Components
  order: 3
---

# Cascader

## Examples

### Cascader

<code src="./demos/demo1.tsx"></code>

### Asynchronous Data Source

<code src="./demos/demo2.tsx"></code>

## API

基于 antd 的 [Cascader](https://ant.design/components/cascader/#API) 附加的一些属性：

- `labelInValue` 是否把每个选项的 label 包装到 value 中
- `changeOnSelectLast` 必须选到最后一级
- `useLoadData` 可调用 hook 的 loadData

```ts
{
  useLoadData: (props) => {
    // 这里可以写 hook
    return function loadData(selectedOptions) {
      // Cascader 的 loadData
    }
  }
}
```
