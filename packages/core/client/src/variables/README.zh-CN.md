---
group:
  title: Client
  order: 1
---

# useVariables

## 使用方法

```ts
const { registerVariable, parseVariable } = useVariables();

// 注册变量
registerVariable({
  name: '$user',
  // 如果确定变量中不需要按需加载 `关系字段` 数据，则可以省略该字段
  collectionName: 'users',
  ctx: {
    name: '张三',
    nickname: '小张',
  },
});

// 解析变量
const userName = await parseVariable('{{ $user.name }}');
console.log(userName); // '张三'
```

## 内置全局变量
在 `VariablesProvider` 内部注册了一些全局都会用到的变量，这些变量在 `useBuiltinVariables` 中被定义，可以通过修改 `useBuiltinVariables` 的返回值来修改内置的变量。

## 本地变量
在使用 `useVariables` 中的 `parseVariable` 方法时，除了可以根据内置的全局变量进行解析之外，还可以使用一些临时的本地变量。

```ts
const { parseVariable } = useVariables();
const localVariable = {
  name: '$user',
  // 如果确定变量中不需要按需加载 `关系字段` 数据，则可以省略该字段
  collectionName: 'users',
  ctx: {
    name: '张三',
    nickname: '小张',
  },
}

// 使用本地变量进行解析
const userName = await parseVariable('{{ $user.name }}', localVariable);
console.log(userName); // '张三'
```

注册的本地变量在解析完之后会自动被销毁，且不会影响到全局变量的值。

### useLocalVariables
该 hook 封装了一些比较通用但又不能作为全局变量的变量。
