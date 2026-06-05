:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

## 条件判断

条件判断は、データの値に基づいてドキュメント内のコンテンツの表示・非表示を動的に制御する機能です。主に3つの条件記述方法があります。

- **インライン条件**: テキストを直接出力したり、別のテキストに置き換えたりします。
- **条件ブロック**: ドキュメント内の特定の範囲（複数のタグ、段落、テーブルなど）を表示・非表示にします。
- **スマート条件**: 1つのタグで対象要素（行、段落、画像など）を直接削除または保持します。より簡潔な構文が特徴です。

すべての条件は、論理判断フォーマッター（例: `ifEQ`、`ifGT` など）で始まり、その後に実行アクションのフォーマッター（例: `show`、`elseShow`、`drop`、`keep` など）が続きます。

### 概览

条件判断でサポートされている論理演算子とアクションフォーマッターは以下の通りです。

- **論理演算子**
  - **ifEQ(value)**: データが指定された値と等しいかどうかを判断します。
  - **ifNE(value)**: データが指定された値と等しくないかどうかを判断します。
  - **ifGT(value)**: データが指定された値より大きいかどうかを判断します。
  - **ifGTE(value)**: データが指定された値以上かどうかを判断します。
  - **ifLT(value)**: データが指定された値より小さいかどうかを判断します。
  - **ifLTE(value)**: データが指定された値以下かどうかを判断します。
  - **ifIN(value)**: データが配列または文字列に含まれているかどうかを判断します。
  - **ifNIN(value)**: データが配列または文字列に含まれていないかどうかを判断します。
  - **ifEM()**: データが空（`null`、`undefined`、空文字列、空配列、空オブジェクトなど）かどうかを判断します。
  - **ifNEM()**: データが空でないかどうかを判断します。
  - **ifTE(type)**: データの型が指定された型（例: `"string"`、`"number"`、`"boolean"` など）と等しいかどうかを判断します。
  - **and(value)**: 論理「AND」。複数の条件を結合するために使用します。
  - **or(value)**: 論理「OR」。複数の条件を結合するために使用します。

- **アクションフォーマッター**
  - **:show(text) / :elseShow(text)**: インライン条件で使用し、指定されたテキストを直接出力します。
  - **:hideBegin / :hideEnd** および **:showBegin / :showEnd**: 条件ブロックで使用し、ドキュメントのセクションを非表示または表示します。
  - **:drop(element) / :keep(element)**: スマート条件で使用し、指定されたドキュメント要素を削除または保持します。

続いて、それぞれの使用方法について、詳細な構文、例、および結果をご紹介します。

### インライン条件

#### 1. `:show(text) / :elseShow(text)`

##### 構文
```
{データ:条件:show(テキスト)}
{データ:条件:show(テキスト):elseShow(代替テキスト)}
```

##### 例
データが以下のようになっているとします。
```json
{
  "val2": 2,
  "val5": 5
}
```
テンプレートは以下の通りです。
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### 結果
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case（多重条件判断）

##### 構文
連続する条件フォーマッターを使用して、`switch-case` に似た構造を構築します。
```
{データ:ifEQ(値1):show(結果1):ifEQ(値2):show(結果2):elseShow(デフォルト結果)}
```
または `or` 演算子を使用して実現することもできます。
```
{データ:ifEQ(値1):show(結果1):or(データ):ifEQ(値2):show(結果2):elseShow(デフォルト結果)}
```

##### 例
データ:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
テンプレート:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### 結果
```
val1 = A
val2 = B
val3 = C
```

#### 3. 複数変数での条件判断

##### 構文
論理演算子 `and` または `or` を使用して、複数の変数をテストできます。
```
{データ1:ifEQ(条件1):and(.データ2):ifEQ(条件2):show(結果):elseShow(代替結果)}
{データ1:ifEQ(条件1):or(.データ2):ifEQ(条件2):show(結果):elseShow(代替結果)}
```

##### 例
データ:
```json
{
  "val2": 2,
  "val5": 5
}
```
テンプレート:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### 結果
```
and = KO
or = OK
```

### 論理演算子とフォーマッター

以下の各セクションで説明するフォーマッターは、すべてインライン条件形式を採用しており、構文は以下の通りです。
```
{データ:フォーマッター(パラメーター):show(テキスト):elseShow(代替テキスト)}
```

#### 1. `:and(value)`

##### 構文
```
{データ:ifEQ(値):and(新しいデータまたは条件):ifGT(他の値):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### 結果
`d.car` が `'delorean'` と等しく、かつ `d.speed` が 80 より大きい場合、`TravelInTime` が出力されます。それ以外の場合は `StayHere` が出力されます。

#### 2. `:or(value)`

##### 構文
```
{データ:ifEQ(値):or(新しいデータまたは条件):ifGT(他の値):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### 結果
`d.car` が `'delorean'` と等しい、または `d.speed` が 80 より大きい場合、`TravelInTime` が出力されます。それ以外の場合は `StayHere` が出力されます。

#### 3. `:ifEM()`

##### 構文
```
{データ:ifEM():show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### 結果
`null` または空の配列の場合、`Result true` が出力されます。それ以外の場合は `Result false` が出力されます。

#### 4. `:ifNEM()`

##### 構文
```
{データ:ifNEM():show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### 結果
空でないデータ（数値の `0` や文字列の `'homer'` など）の場合、`Result true` が出力されます。空のデータの場合は `Result false` が出力されます。

#### 5. `:ifEQ(value)`

##### 構文
```
{データ:ifEQ(値):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### 結果
データが指定された値と等しい場合、`Result true` が出力されます。それ以外の場合は `Result false` が出力されます。

#### 6. `:ifNE(value)`

##### 構文
```
{データ:ifNE(値):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### 結果
最初の例では `Result false` が出力され、2番目の例では `Result true` が出力されます。

#### 7. `:ifGT(value)`

##### 構文
```
{データ:ifGT(値):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### 結果
最初の例では `Result true` が出力され、2番目の例では `Result false` が出力されます。

#### 8. `:ifGTE(value)`

##### 構文
```
{データ:ifGTE(値):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### 結果
最初の例では `Result true` が出力され、2番目の例では `Result false` が出力されます。

#### 9. `:ifLT(value)`

##### 構文
```
{データ:ifLT(値):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### 結果
最初の例では `Result true` が出力され、2番目の例では `Result false` が出力されます。

#### 10. `:ifLTE(value)`

##### 構文
```
{データ:ifLTE(値):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### 結果
最初の例では `Result true` が出力され、2番目の例では `Result false` が出力されます。

#### 11. `:ifIN(value)`

##### 構文
```
{データ:ifIN(値):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### 結果
どちらの例でも `Result true` が出力されます（文字列に `'is'` が含まれ、配列に `2` が含まれるため）。

#### 12. `:ifNIN(value)`

##### 構文
```
{データ:ifNIN(値):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### 結果
最初の例では `Result false` が出力されます（文字列に `'is'` が含まれるため）。2番目の例でも `Result false` が出力されます（配列に `2` が含まれるため）。

#### 13. `:ifTE(type)`

##### 構文
```
{データ:ifTE('型'):show(テキスト):elseShow(代替テキスト)}
```

##### 例
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### 結果
最初の例では `Result true` が出力されます（`'homer'` は文字列のため）。2番目の例でも `Result true` が出力されます（`10.5` は数値のため）。

### 条件ブロック

条件ブロックは、ドキュメント内の特定の範囲を表示または非表示にするために使用されます。通常、複数のタグやテキストブロック全体を囲むのに適しています。

#### 1. `:showBegin / :showEnd`

##### 構文
```
{データ:ifEQ(条件):showBegin}
ドキュメントブロックの内容
{データ:showEnd}
```

##### 例
データ:
```json
{
  "toBuy": true
}
```
テンプレート:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### 結果
条件が満たされた場合、中間のコンテンツは以下のように表示されます。
```
Banana
Apple
Pineapple
Grapes
```

#### 2. `:hideBegin / :hideEnd`

##### 構文
```
{データ:ifEQ(条件):hideBegin}
ドキュメントブロックの内容
{データ:hideEnd}
```

##### 例
データ:
```json
{
  "toBuy": true
}
```
テンプレート:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### 結果
条件が満たされた場合、中間のコンテンツは非表示になり、以下が出力されます。
```
Banana
Grapes
```