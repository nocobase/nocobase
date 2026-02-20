### 数组格式化

#### 1. :arrayJoin(separator, index, count)

##### 语法说明
将一个字符串或数字数组拼接为一个字符串。  
参数：
- separator：分隔符（默认为逗号 `,`）
- index：可选，从该索引开始拼接
- count：可选，从 index 开始拼接的项数（可以为负数，表示从末尾开始计数）

##### 示例
```
['homer','bart','lisa']:arrayJoin()              // 输出 "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // 输出 "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // 输出 "homerbartlisa"
[10,50]:arrayJoin()                               // 输出 "10, 50"
[]:arrayJoin()                                    // 输出 ""
null:arrayJoin()                                  // 输出 null
{}:arrayJoin()                                    // 输出 {}
20:arrayJoin()                                    // 输出 20
undefined:arrayJoin()                             // 输出 undefined
['homer','bart','lisa']:arrayJoin('', 1)          // 输出 "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // 输出 "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // 输出 "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // 输出 "homerbart"
```

##### 结果
输出为根据参数拼接后的字符串。


#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### 语法说明
将对象数组转化为字符串，不处理嵌套对象或数组。  
参数：
- objSeparator：对象间的分隔符（默认为 `, `）
- attSeparator：对象属性间的分隔符（默认为 `:`）
- attributes：可选，指定要输出的对象属性列表

##### 示例
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// 输出 "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// 输出 "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// 输出 "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// 输出 "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// 输出 "2:homer"

['homer','bart','lisa']:arrayMap()    // 输出 "homer, bart, lisa"
[10,50]:arrayMap()                    // 输出 "10, 50"
[]:arrayMap()                         // 输出 ""
null:arrayMap()                       // 输出 null
{}:arrayMap()                         // 输出 {}
20:arrayMap()                         // 输出 20
undefined:arrayMap()                  // 输出 undefined
```

##### 结果
输出为拼接后的字符串，忽略对象中嵌套的内容。


#### 3. :count(start)

##### 语法说明
统计数组中的行号，并输出当前行号。  
例如：
```
{d[i].id:count()}
```  
不论 `id` 的值如何，均输出当前行计数。  
自 v4.0.0 起，该格式化器内部已替换为 `:cumCount`。

参数：
- start：可选，计数的起始值

##### 示例与结果
具体使用时，输出的行号将依照数组元素顺序显示。


