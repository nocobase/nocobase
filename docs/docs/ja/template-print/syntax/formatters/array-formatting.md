:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

### 配列の書式設定

#### 1. :arrayJoin(separator, index, count)

##### 構文の説明
文字列または数値の配列を1つの文字列に結合します。  
パラメーター:
- `separator`: 区切り文字（デフォルトはカンマ `,` です）
- `index`: オプション。結合を開始するインデックスを指定します。
- `count`: オプション。`index` から結合する項目の数を指定します（負の数を指定すると、末尾から数えられます）。

##### 例
```
['homer','bart','lisa']:arrayJoin()              // 出力 "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // 出力 "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // 出力 "homerbartlisa"
[10,50]:arrayJoin()                               // 出力 "10, 50"
[]:arrayJoin()                                    // 出力 ""
null:arrayJoin()                                  // 出力 null
{}:arrayJoin()                                    // 出力 {}
20:arrayJoin()                                    // 出力 20
undefined:arrayJoin()                             // 出力 undefined
['homer','bart','lisa']:arrayJoin('', 1)          // 出力 "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // 出力 "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // 出力 "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // 出力 "homerbart"
```

##### 結果
指定されたパラメーターに基づいて配列の要素を結合した文字列が出力されます。

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### 構文の説明
オブジェクトの配列を文字列に変換します。ネストされたオブジェクトや配列は処理されません。  
パラメーター:
- `objSeparator`: オブジェクト間の区切り文字（デフォルトは `, ` です）
- `attSeparator`: オブジェクト属性間の区切り文字（デフォルトは `:` です）
- `attributes`: オプション。出力するオブジェクト属性のリストを指定します。

##### 例
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// 出力 "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// 出力 "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// 出力 "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// 出力 "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// 出力 "2:homer"

['homer','bart','lisa']:arrayMap()    // 出力 "homer, bart, lisa"
[10,50]:arrayMap()                    // 出力 "10, 50"
[]:arrayMap()                         // 出力 ""
null:arrayMap()                       // 出力 null
{}:arrayMap()                         // 出力 {}
20:arrayMap()                         // 出力 20
undefined:arrayMap()                  // 出力 undefined
```

##### 結果
配列の要素をマッピングして結合した文字列が出力されますが、オブジェクト内のネストされた内容は無視されます。

#### 3. :count(start)

##### 構文の説明
配列内の行番号をカウントし、現在の行番号を出力します。  
例:
```
{d[i].id:count()}
```  
`id` の値に関わらず、現在の行カウントが出力されます。  
v4.0.0 以降、このフォーマッターは内部的に `:cumCount` に置き換えられました。

パラメーター:
- `start`: オプション。カウントの開始値を指定します。

##### 例と結果
実際に使用すると、配列要素の順序に従って行番号が表示されます。