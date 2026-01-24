:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

### テキストの書式設定

テキストデータには様々なフォーマッターが用意されています。ここでは、各フォーマッターの構文、使用例、および結果を順番にご紹介します。

#### 1. :lowerCase

##### 構文
すべての文字を小文字に変換します。

##### 使用例
```
'My Car':lowerCase()   // 出力: "my car"
'my car':lowerCase()   // 出力: "my car"
null:lowerCase()       // 出力: null
1203:lowerCase()       // 出力: 1203
```

##### 結果
各使用例の出力結果は、コメントに示されている通りです。

#### 2. :upperCase

##### 構文
すべての文字を大文字に変換します。

##### 使用例
```
'My Car':upperCase()   // 出力: "MY CAR"
'my car':upperCase()   // 出力: "MY CAR"
null:upperCase()       // 出力: null
1203:upperCase()       // 出力: 1203
```

##### 結果
各使用例の出力結果は、コメントに示されている通りです。

#### 3. :ucFirst

##### 構文
文字列の最初の文字のみを大文字に変換し、残りの文字は変更しません。

##### 使用例
```
'My Car':ucFirst()     // 出力: "My Car"
'my car':ucFirst()     // 出力: "My car"
null:ucFirst()         // 出力: null
undefined:ucFirst()    // 出力: undefined
1203:ucFirst()         // 出力: 1203
```

##### 結果
出力結果はコメントに示されている通りです。

#### 4. :ucWords

##### 構文
文字列内の各単語の最初の文字を大文字に変換します。

##### 使用例
```
'my car':ucWords()     // 出力: "My Car"
'My cAR':ucWords()     // 出力: "My CAR"
null:ucWords()         // 出力: null
undefined:ucWords()    // 出力: undefined
1203:ucWords()         // 出力: 1203
```

##### 結果
出力結果は使用例に示されている通りです。

#### 5. :print(message)

##### 構文
元のデータに関わらず、常に指定されたメッセージを返します。これはフォールバックフォーマッターとして便利です。  
パラメーター：
- `message`：出力するテキスト

##### 使用例
```
'My Car':print('hello!')   // 出力: "hello!"
'my car':print('hello!')   // 出力: "hello!"
null:print('hello!')       // 出力: "hello!"
1203:print('hello!')       // 出力: "hello!"
```

##### 結果
すべての場合において、指定された文字列 "hello!" が返されます。

#### 6. :printJSON

##### 構文
オブジェクトまたは配列をJSON形式の文字列に変換して出力します。

##### 使用例
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// 出力: "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // 出力: ""my car""
```

##### 結果
出力結果は、変換されたJSON文字列です。

#### 7. :unaccent

##### 構文
テキストからアクセント記号を除去し、無アクセント形式に変換します。

##### 使用例
```
'crÃ¨me brulÃ©e':unaccent()   // 出力: "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // 出力: "CREME BRULEE"
'Ãªtre':unaccent()           // 出力: "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // 出力: "euieea"
```

##### 結果
各使用例の出力結果は、アクセント記号が除去されたテキストです。

#### 8. :convCRLF

##### 構文
テキスト内の改行コード（`\r\n` または `\n`）を、DOCX、PPTX、ODT、ODP、ODSなどのドキュメント形式に合わせた改行タグに変換します。  
**注意：** `:convCRLF` フォーマッターの前に `:html` を使用すると、`\r\n` は `<br>` タグに変換されます。

##### 使用例
```
// ODT形式の場合：
'my blue 
 car':convCRLF()    // 出力: "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // 出力: "my blue <text:line-break/> car"

// DOCX形式の場合：
'my blue 
 car':convCRLF()    // 出力: "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // 出力: "my blue </w:t><w:br/><w:t> car"
```

##### 結果
出力結果は、対象となるドキュメント形式に応じた改行マーカーを示します。

#### 9. :substr(begin, end, wordMode)

##### 構文
文字列に対して部分文字列操作を行います。`begin` インデックス（0から始まる）から始まり、`end` インデックスの直前で終了します。  
オプションのパラメーター `wordMode`（ブール値または `last`）は、単語の途中で分割せずに単語の完全性を保つかどうかを制御します。

##### 使用例
```
'foobar':substr(0, 3)            // 出力: "foo"
'foobar':substr(1)               // 出力: "oobar"
'foobar':substr(-2)              // 出力: "ar"
'foobar':substr(2, -1)           // 出力: "oba"
'abcd efg hijklm':substr(0, 11, true)  // 出力: "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // 出力: "abcd efg "
```

##### 結果
パラメーターに応じて抽出された部分文字列が出力されます。

#### 10. :split(delimiter)

##### 構文
指定された区切り文字 `delimiter` を使用して文字列を配列に分割します。  
パラメーター：
- `delimiter`：区切り文字となる文字列

##### 使用例
```
'abcdefc12':split('c')    // 出力: ["ab", "def", "12"]
1222.1:split('.')         // 出力: ["1222", "1"]
'ab/cd/ef':split('/')      // 出力: ["ab", "cd", "ef"]
```

##### 結果
使用例の結果は、指定された区切り文字で分割された配列です。

#### 11. :padl(targetLength, padString)

##### 構文
文字列の左側に指定された文字を埋め込み、最終的な文字列の長さを `targetLength` にします。  
もし目標の長さが元の文字列の長さより短い場合、元の文字列がそのまま返されます。  
パラメーター：
- `targetLength`：目標とする合計の長さ
- `padString`：埋め込みに使用する文字列（デフォルトはスペース）

##### 使用例
```
'abc':padl(10)              // 出力: "       abc"
'abc':padl(10, 'foo')       // 出力: "foofoofabc"
'abc':padl(6, '123465')     // 出力: "123abc"
'abc':padl(8, '0')          // 出力: "00000abc"
'abc':padl(1)               // 出力: "abc"
```

##### 結果
各使用例の出力は、左側が埋め込まれた文字列です。

#### 12. :padr(targetLength, padString)

##### 構文
文字列の右側に指定された文字を埋め込み、最終的な文字列の長さを `targetLength` にします。  
パラメーターは `:padl` と同じです。

##### 使用例
```
'abc':padr(10)              // 出力: "abc       "
'abc':padr(10, 'foo')       // 出力: "abcfoofoof"
'abc':padr(6, '123465')     // 出力: "abc123"
'abc':padr(8, '0')          // 出力: "abc00000"
'abc':padr(1)               // 出力: "abc"
```

##### 結果
出力は、右側が埋め込まれた文字列です。

#### 13. :ellipsis(maximum)

##### 構文
テキストが指定された文字数を超えた場合、末尾に省略記号 "..." を追加します。  
パラメーター：
- `maximum`：許容される最大文字数

##### 使用例
```
'abcdef':ellipsis(3)      // 出力: "abc..."
'abcdef':ellipsis(6)      // 出力: "abcdef"
'abcdef':ellipsis(10)     // 出力: "abcdef"
```

##### 結果
使用例は、必要に応じて省略記号が追加され、切り詰められたテキストを示しています。

#### 14. :prepend(textToPrepend)

##### 構文
指定されたテキストを文字列の先頭に追加します。  
パラメーター：
- `textToPrepend`：プレフィックスとなるテキスト

##### 使用例
```
'abcdef':prepend('123')     // 出力: "123abcdef"
```

##### 結果
出力は、指定されたプレフィックスが追加されたテキストです。

#### 15. :append(textToAppend)

##### 構文
指定されたテキストを文字列の末尾に追加します。  
パラメーター：
- `textToAppend`：サフィックスとなるテキスト

##### 使用例
```
'abcdef':append('123')      // 出力: "abcdef123"
```

##### 結果
出力は、指定されたサフィックスが追加されたテキストです。

#### 16. :replace(oldText, newText)

##### 構文
テキスト内のすべての `oldText` を `newText` に置き換えます。  
パラメーター：
- `oldText`：置き換えられる古いテキスト
- `newText`：置き換える新しいテキスト  
  **注意：** `newText` が `null` の場合、一致するテキストは削除されます。

##### 使用例
```
'abcdef abcde':replace('cd', 'OK')    // 出力: "abOKef abOKe"
'abcdef abcde':replace('cd')          // 出力: "abef abe"
'abcdef abcde':replace('cd', null)      // 出力: "abef abe"
'abcdef abcde':replace('cd', 1000)      // 出力: "ab1000ef ab1000e"
```

##### 結果
出力結果は、指定された部分が置き換えられた後の文字列です。

#### 17. :len

##### 構文
文字列または配列の長さを返します。

##### 使用例
```
'Hello World':len()     // 出力: 11
'':len()                // 出力: 0
[1,2,3,4,5]:len()       // 出力: 5
[1,'Hello']:len()       // 出力: 2
```

##### 結果
対応する長さの数値が出力されます。

#### 18. :t

##### 構文
翻訳辞書に基づいてテキストを翻訳します。  
使用例と結果は、実際の翻訳辞書の設定によって異なります。

#### 19. :preserveCharRef

##### 構文
デフォルトでは、XML内の一部の不正な文字（`&`、`>`、`<` など）は削除されます。このフォーマッターは文字参照（例：`&#xa7;` は変更されずに保持されます）を保持し、特定のXML生成シナリオに適しています。  
使用例と結果は、具体的な使用シナリオによって異なります。