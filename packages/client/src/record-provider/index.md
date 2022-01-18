---
nav:
  path: /client
group:
  path: /client
---

# RecordProvider

「Record」在这里有着特殊的意义，表示数据表的行记录。

## RecordProvider

提供当前行记录的上下文

```tsx | pure
<RecordProvider record={{}}></RecordProvider>
```

## useRecord()

```ts
interface User {
  id: number;
  username: string;
  password: string;
}

const record = useRecord<User>();
```
