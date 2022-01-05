---
nav:
  path: /client
group:
  path: /client
---

# RecordProvider

## RecordProvider

提供静态记录的上下文

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

## AsyncRecordProvider

提供动态记录的上下文，可以是 request 或 resource & action

request

```tsx | pure
<AsyncRecordProvider
  request={'/api/xxx'}
></AsyncRecordProvider>
```

resource & action

```tsx | pure
<AsyncRecordProvider
  resource={resource}
  action={'list'}
></AsyncRecordProvider>
```

## useAsyncRecord()

```ts
const { data, loading } = useAsyncRecord();
```

## Examples

<code src="./demos/demo1.tsx"/>
