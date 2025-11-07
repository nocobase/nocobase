### 文本格式化

针对文本数据提供多种格式化器，下文依次介绍各格式化器的语法、示例和结果。

#### 1. :lowerCase

##### 语法说明
将所有字母转换为小写。

##### 示例
```
'My Car':lowerCase()   // 输出 "my car"
'my car':lowerCase()   // 输出 "my car"
null:lowerCase()       // 输出 null
1203:lowerCase()       // 输出 1203
```

##### 结果
各示例的输出结果如注释中所示。


#### 2. :upperCase

##### 语法说明
将所有字母转换为大写。

##### 示例
```
'My Car':upperCase()   // 输出 "MY CAR"
'my car':upperCase()   // 输出 "MY CAR"
null:upperCase()       // 输出 null
1203:upperCase()       // 输出 1203
```

##### 结果
各示例的输出结果如注释中所示。


#### 3. :ucFirst

##### 语法说明
仅将字符串的首字母转换为大写，其余保持不变。

##### 示例
```
'My Car':ucFirst()     // 输出 "My Car"
'my car':ucFirst()     // 输出 "My car"
null:ucFirst()         // 输出 null
undefined:ucFirst()    // 输出 undefined
1203:ucFirst()         // 输出 1203
```

##### 结果
输出结果见注释说明。


#### 4. :ucWords

##### 语法说明
将字符串中每个单词的首字母转换为大写。

##### 示例
```
'my car':ucWords()     // 输出 "My Car"
'My cAR':ucWords()     // 输出 "My CAR"
null:ucWords()         // 输出 null
undefined:ucWords()    // 输出 undefined
1203:ucWords()         // 输出 1203
```

##### 结果
输出结果如示例所示。


#### 5. :print(message)

##### 语法说明
始终返回指定的消息，无论原数据为何，用作兜底格式化器。  
参数：
- message：要打印的文本

##### 示例
```
'My Car':print('hello!')   // 输出 "hello!"
'my car':print('hello!')   // 输出 "hello!"
null:print('hello!')       // 输出 "hello!"
1203:print('hello!')       // 输出 "hello!"
```

##### 结果
均返回指定的 "hello!" 字符串。


#### 6. :printJSON

##### 语法说明
将对象或数组转化为 JSON 格式的字符串输出。

##### 示例
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// 输出 "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // 输出 ""my car""
```

##### 结果
示例中的输出结果即为转换后的 JSON 字符串。


#### 7. :unaccent

##### 语法说明
去除文本中的重音符号，使文本变为无重音格式。

##### 示例
```
'crÃ¨me brulÃ©e':unaccent()   // 输出 "creme brulee"
'CRÃME BRULÃE':unaccent()   // 输出 "CREME BRULEE"
'Ãªtre':unaccent()           // 输出 "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // 输出 "euieea"
```

##### 结果
各示例输出均去除了重音符号。


#### 8. :convCRLF

##### 语法说明
将文本中的回车换行符（`
` 或 `
`）转换为文档中的换行标记，适用于 DOCX、PPTX、ODT、ODP 和 ODS 等格式。  
注意：在 `:convCRLF` 格式化器之前使用 `:html` 时，`
` 会转换为 `<br>` 标签。

##### 示例
```
// 针对 ODT 格式：
'my blue 
 car':convCRLF()    // 输出 "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // 输出 "my blue <text:line-break/> car"

// 针对 DOCX 格式：
'my blue 
 car':convCRLF()    // 输出 "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // 输出 "my blue </w:t><w:br/><w:t> car"
```

##### 结果
输出结果根据不同文档格式显示换行标记。


#### 9. :substr(begin, end, wordMode)

##### 语法说明
对字符串进行切割操作，从 `begin` 索引开始（基于 0），到 `end` 索引前结束。  
可选参数 `wordMode`（布尔值或 `last`）用于控制是否保持单词完整，不在单词中间断开。

##### 示例
```
'foobar':substr(0, 3)            // 输出 "foo"
'foobar':substr(1)               // 输出 "oobar"
'foobar':substr(-2)              // 输出 "ar"
'foobar':substr(2, -1)           // 输出 "oba"
'abcd efg hijklm':substr(0, 11, true)  // 输出 "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // 输出 "abcd efg "
```

##### 结果
根据参数不同，输出相应的字符串片段。


#### 10. :split(delimiter)

##### 语法说明
用指定分隔符 `delimiter` 将字符串拆分为数组。  
参数：
- delimiter：分隔符字符串

##### 示例
```
'abcdefc12':split('c')    // 输出 ["ab", "def", "12"]
1222.1:split('.')         // 输出 ["1222", "1"]
'ab/cd/ef':split('/')      // 输出 ["ab", "cd", "ef"]
```

##### 结果
示例结果为拆分后的数组。


#### 11. :padl(targetLength, padString)

##### 语法说明
从字符串左侧填充指定字符，使最终字符串长度达到 `targetLength`。  
若目标长度小于原字符串长度，则返回原字符串。  
参数：
- targetLength：目标总长度
- padString：用于填充的字符串，默认为空格

##### 示例
```
'abc':padl(10)              // 输出 "       abc"
'abc':padl(10, 'foo')       // 输出 "foofoofabc"
'abc':padl(6, '123465')     // 输出 "123abc"
'abc':padl(8, '0')          // 输出 "00000abc"
'abc':padl(1)               // 输出 "abc"
```

##### 结果
各示例输出为填充后的字符串。


#### 12. :padr(targetLength, padString)

##### 语法说明
从字符串右侧填充指定字符，使最终字符串长度达到 `targetLength`。  
参数同上。

##### 示例
```
'abc':padr(10)              // 输出 "abc       "
'abc':padr(10, 'foo')       // 输出 "abcfoofoof"
'abc':padr(6, '123465')     // 输出 "abc123"
'abc':padr(8, '0')          // 输出 "abc00000"
'abc':padr(1)               // 输出 "abc"
```

##### 结果
输出为右侧填充后的字符串。


#### 13. :ellipsis(maximum)

##### 语法说明
如果文本超过指定字符数，则在末尾添加省略号 “...”。  
参数：
- maximum：允许的最大字符数

##### 示例
```
'abcdef':ellipsis(3)      // 输出 "abc..."
'abcdef':ellipsis(6)      // 输出 "abcdef"
'abcdef':ellipsis(10)     // 输出 "abcdef"
```

##### 结果
示例结果为截断并添加省略号的文本。


#### 14. :prepend(textToPrepend)

##### 语法说明
在文本前面添加指定前缀。  
参数：
- textToPrepend：前缀文本

##### 示例
```
'abcdef':prepend('123')     // 输出 "123abcdef"
```

##### 结果
输出为添加前缀后的字符串。


#### 15. :append(textToAppend)

##### 语法说明
在文本后面添加指定后缀。  
参数：
- textToAppend：后缀文本

##### 示例
```
'abcdef':append('123')      // 输出 "abcdef123"
```

##### 结果
输出为添加后缀后的字符串。


#### 16. :replace(oldText, newText)

##### 语法说明
将文本中所有匹配的 `oldText` 替换为 `newText`。  
参数：
- oldText：要替换的旧文本
- newText：替换成的新文本  
  注意：如果 newText 为 null，则表示删除匹配项。

##### 示例
```
'abcdef abcde':replace('cd', 'OK')    // 输出 "abOKef abOKe"
'abcdef abcde':replace('cd')          // 输出 "abef abe"
'abcdef abcde':replace('cd', null)      // 输出 "abef abe"
'abcdef abcde':replace('cd', 1000)      // 输出 "ab1000ef ab1000e"
```

##### 结果
输出结果为替换后的字符串。


#### 17. :len

##### 语法说明
返回字符串或数组的长度。

##### 示例
```
'Hello World':len()     // 输出 11
'':len()                // 输出 0
[1,2,3,4,5]:len()       // 输出 5
[1,'Hello']:len()       // 输出 2
```

##### 结果
输出为对应的长度数值。


#### 18. :t

##### 语法说明
根据翻译词典对文本进行翻译。  
示例和结果依据实际翻译词典配置而定。


#### 19. :preserveCharRef

##### 语法说明
默认情况下，会移除 XML 中的某些非法字符（如 &、>、< 等），此格式化器可保留字符引用（例如 `&#xa7;` 保持不变），适用于特定的 XML 生成场景。  
示例和结果依据具体使用场景而定。


