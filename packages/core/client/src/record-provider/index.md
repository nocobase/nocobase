---
group:
  title: Client
  order: 1
---

# CollectionRecordProvider

「Record」在这里有着特殊的意义，表示数据表的行记录。

## CollectionRecordProvider

提供当前行记录的上下文

```tsx | pure
<CollectionRecordProvider record={{}}></CollectionRecordProvider>
```

## useRecord ()

```ts
interface User {
  id: number;
  username: string;
  password: string;
}

const record = useRecord <User>();
```
