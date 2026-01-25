## 格式化工具

格式化器用于将原始数据转换成便于阅读的文本。格式化器通过冒号（:）应用于数据，可以链式调用，每个格式化器的输出会作为下一个的输入。有些格式化器支持常量参数或动态参数。


### 概览

#### 1. 语法说明
格式化器的基本调用形式为：
```
{d.属性:formatter1:formatter2(...)}
```  
例如，将字符串 `"JOHN"` 转换为 `"John"` 的示例中，先用 `lowerCase` 将所有字母转为小写，再用 `ucFirst` 将首字母大写。

#### 2. 示例
数据：
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
模板：
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. 结果
渲染后输出：
```
My name is John. I was born on January 31, 2000.
```


### 常量参数

#### 1. 语法说明
许多格式化器支持一个或多个常量参数，用逗号分隔，并放在圆括号中以修改输出。例如，`:prepend(myPrefix)` 会在文本前添加 “myPrefix”。  
注意：如果参数中包含逗号或空格，必须用单引号包裹，如 `prepend('my prefix')`。

#### 2. 示例
模板示例（见具体格式化器的用法）。

#### 3. 结果
输出会在文本前添加指定的前缀。


### 动态参数

#### 1. 语法说明
格式化器支持动态参数，参数以点号（.）开头且不加引号。  
可使用两种方式：
- **绝对 JSON 路径**：以 `d.` 或 `c.` 开头（根数据或补充数据）。
- **相对 JSON 路径**：以单个点（.）开头，表示从当前父级对象中查找属性。

例如：
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
也可写为相对路径：
```
{d.subObject.qtyB:add(.qtyC)}
```
若需访问上一级或更高层数据，可使用多个点：
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. 示例
数据：
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
模板中使用：
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // 结果：8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // 结果：8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // 结果：28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // 结果：6 (3 + 3)
```

#### 3. 结果
各示例分别得到 8、8、28、6。

> **注意：** 使用自定义迭代器或数组过滤器作为动态参数是不允许的，如：
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```


