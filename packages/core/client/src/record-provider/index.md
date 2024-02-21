---
group:
  title: Client
  order: 1
---

# RecordProvider

「Record」在这里有着特殊的意义，表示数据表的行记录。

## RecordProvider

提供当前行记录的上下文

```tsx | pure
<RecordProvider record={{}}></RecordProvider>
```

## useRecord_deprecated ()

```ts
interface User {
  id: number;
  username: string;
  password: string;
}

const record = useRecord_deprecated <User>();
```
