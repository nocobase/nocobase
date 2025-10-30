## 条件判断

条件判断允许根据数据的值来动态控制文档中内容的显示或隐藏。提供了三种主要的条件写法：

- **内联条件**：直接输出文本（或替换为其他文本）。
- **条件块**：对文档中一段区域进行显示或隐藏，适用于多个 标签、段落、表格等。
- **智能条件**：通过一条标签直接移除或保留目标元素（如行、段落、图片等），语法更简洁。

所有条件均以一个逻辑判断格式器开始（例如 ifEQ、ifGT 等），后续跟随执行动作的格式器（如 show、elseShow、drop、keep 等）。


### 概览

条件判断中支持的逻辑操作符及动作格式器包括：

- **逻辑操作符**
  - **ifEQ(value)**：判断数据是否等于指定值
  - **ifNE(value)**：判断数据是否不等于指定值
  - **ifGT(value)**：判断数据是否大于指定值
  - **ifGTE(value)**：判断数据是否大于或等于指定值
  - **ifLT(value)**：判断数据是否小于指定值
  - **ifLTE(value)**：判断数据是否小于或等于指定值
  - **ifIN(value)**：判断数据是否包含在数组或字符串中
  - **ifNIN(value)**：判断数据是否不包含在数组或字符串中
  - **ifEM()**：判断数据是否为空（如 null、undefined、空字符串、空数组或空对象）
  - **ifNEM()**：判断数据是否非空
  - **ifTE(type)**：判断数据的类型是否等于指定类型（例如 "string"、"number"、"boolean" 等）
  - **and(value)**：逻辑“与”，用于连接多个条件
  - **or(value)**：逻辑“或”，用于连接多个条件

- **动作格式器**
  - **:show(text) / :elseShow(text)**：用于内联条件，直接输出指定文本
  - **:hideBegin / :hideEnd** 与 **:showBegin / :showEnd**：用于条件块，隐藏或显示文档块
  - **:drop(element) / :keep(element)**：用于智能条件，移除或保留指定文档元素

接下来分别介绍各个用法的详细语法、示例与结果。


### 内联条件

#### 1. :show(text) / :elseShow(text)

##### 语法
```
{数据:条件:show(文本)}
{数据:条件:show(文本):elseShow(替代文本)}
```

##### 示例
假设数据为：
```json
{
  "val2": 2,
  "val5": 5
}
```
模板如下：
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### 结果
```
val2 = 2
val2 = low
val5 = high
```


#### 2. Switch Case（多重条件判断）

##### 语法
使用连续的条件格式器构建类似 switch-case 的结构：
```
{数据:ifEQ(值1):show(结果1):ifEQ(值2):show(结果2):elseShow(默认结果)}
```
或用 or 操作符实现：
```
{数据:ifEQ(值1):show(结果1):or(数据):ifEQ(值2):show(结果2):elseShow(默认结果)}
```

##### 示例
数据：
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
模板：
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### 结果
```
val1 = A
val2 = B
val3 = C
```


#### 3. 多变量条件判断

##### 语法
使用逻辑操作符 and/or 可以测试多个变量：
```
{数据1:ifEQ(条件1):and(.数据2):ifEQ(条件2):show(结果):elseShow(替代结果)}
{数据1:ifEQ(条件1):or(.数据2):ifEQ(条件2):show(结果):elseShow(替代结果)}
```

##### 示例
数据：
```json
{
  "val2": 2,
  "val5": 5
}
```
模板：
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### 结果
```
and = KO
or = OK
```


### 逻辑操作符及格式器

以下各节中介绍的格式器均采用内联条件形式，语法格式为：
```
{数据:格式器(参数):show(文本):elseShow(替代文本)}
```

#### 1. :and(value)

##### 语法
```
{数据:ifEQ(值):and(新的数据或条件):ifGT(其他值):show(文本):elseShow(替代文本)}
```

##### 示例
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### 结果
如果 `d.car` 等于 `'delorean'` 且 `d.speed` 大于 80，则输出 `TravelInTime`；否则输出 `StayHere`。


#### 2. :or(value)

##### 语法
```
{数据:ifEQ(值):or(新的数据或条件):ifGT(其他值):show(文本):elseShow(替代文本)}
```

##### 示例
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### 结果
如果 `d.car` 等于 `'delorean'` 或 `d.speed` 大于 80，则输出 `TravelInTime`；否则输出 `StayHere`。


#### 3. :ifEM()

##### 语法
```
{数据:ifEM():show(文本):elseShow(替代文本)}
```

##### 示例
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### 结果
对于 `null` 或空数组，输出 `Result true`；否则输出 `Result false`。


#### 4. :ifNEM()

##### 语法
```
{数据:ifNEM():show(文本):elseShow(替代文本)}
```

##### 示例
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### 结果
对于非空数据（如数字 0 或字符串 'homer'），输出 `Result true`；空数据则输出 `Result false`。


#### 5. :ifEQ(value)

##### 语法
```
{数据:ifEQ(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### 结果
若数据等于指定值则输出 `Result true`，否则输出 `Result false`。


#### 6. :ifNE(value)

##### 语法
```
{数据:ifNE(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result false`，第二个例子输出 `Result true`。


#### 7. :ifGT(value)

##### 语法
```
{数据:ifGT(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result true`，第二个例子输出 `Result false`。


#### 8. :ifGTE(value)

##### 语法
```
{数据:ifGTE(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result true`，第二个例子输出 `Result false`。


#### 9. :ifLT(value)

##### 语法
```
{数据:ifLT(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result true`，第二个例子输出 `Result false`。


#### 10. :ifLTE(value)

##### 语法
```
{数据:ifLTE(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result true`，第二个例子输出 `Result false`。


#### 11. :ifIN(value)

##### 语法
```
{数据:ifIN(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### 结果
两个例子均输出 `Result true`（因为字符串中包含 'is'，数组中包含 2）。


#### 12. :ifNIN(value)

##### 语法
```
{数据:ifNIN(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result false`（因为字符串中包含 'is'），第二个例子输出 `Result false`（因为数组中包含 2）。


#### 13. :ifTE(type)

##### 语法
```
{数据:ifTE('类型'):show(文本):elseShow(替代文本)}
```

##### 示例
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result true`（'homer' 为字符串），第二个例子输出 `Result true`（10.5 为数字）。


### 条件块

条件块用于对文档中一段区域进行显示或隐藏，常用于包裹多个标签或整段文本。

#### 1. :showBegin / :showEnd

##### 语法
```
{数据:ifEQ(条件):showBegin}
文档块内容
{数据:showEnd}
```

##### 示例
数据：
```json
{
  "toBuy": true
}
```
模板：
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### 结果
条件成立时，中间的内容显示：
```
Banana
Apple
Pineapple
Grapes
```


#### 2. :hideBegin / :hideEnd

##### 语法
```
{数据:ifEQ(条件):hideBegin}
文档块内容
{数据:hideEnd}
```

##### 示例
数据：
```json
{
  "toBuy": true
}
```
模板：
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### 结果
条件成立时，中间的内容被隐藏，输出：
```
Banana
Grapes
```


