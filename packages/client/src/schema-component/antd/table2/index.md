---
nav:
  path: /client
group:
  path: /schema-components
---

## Table2

<code src="./demos/demo1.tsx" />

```tsx | pure
<Table useEvents={{
  onLoad() {
    field.value = [];
    field.data.selectedRowKeys = [];
  }
}}>
```

```ts
const useEvents = () => {
  const field = useField();
  return {
    onLoad() {

    },
    onRowDragEnd(fromIndex, toIndex) {

    },
    onRowSelectionChange() {

    }
  }
}
```
