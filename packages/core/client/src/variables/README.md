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
const userName = await parseVariable('$user.name');
console.log(userName); // '张三'
```
