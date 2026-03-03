:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/template-print/syntax/formatters/currency-formatting)をご参照ください。
:::

### 通貨のフォーマット

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### 構文の説明
通貨の数値をフォーマットします。小数点以下の桁数や特定の出力形式を指定できます。  
パラメータ：
- precisionOrFormat：オプションパラメータです。数値（小数点以下の桁数を指定）または特定のフォーマット識別子のいずれかを使用できます：
  - 整数：デフォルトの小数点精度を変更します。
  - `'M'`：主要な通貨名称のみを出力します。
  - `'L'`：数値と通貨記号を出力します（デフォルト）。
  - `'LL'`：数値と主要な通貨名称を出力します。
- targetCurrency：オプション。ターゲット通貨コード（USD、EUR などの大文字）。グローバル設定を上書きします。

##### 示例
```
'1000.456':formatC()      // "$2,000.91" を出力
'1000.456':formatC('M')    // "dollars" を出力
'1':formatC('M')           // "dollar" を出力
'1000':formatC('L')        // "$2,000.00" を出力
'1000':formatC('LL')       // "2,000.00 dollars" を出力
```

##### 結果
出力結果は API オプションおよび為替レートの設定に基づきます。


#### 2. :convCurr(target, source)

##### 構文の説明
数値をある通貨から別の通貨に変換します。為替レートは API オプション経由で渡すか、またはグローバルに設定できます。  
パラメータを指定しない場合、自動的に `options.currencySource` から `options.currencyTarget` に変換されます。  
パラメータ：
- target：オプション。ターゲット通貨コード（デフォルトは `options.currencyTarget` に等しい）。
- source：オプション。ソース通貨コード（デフォルトは `options.currencySource` に等しい）。

##### 示例
```
10:convCurr()              // 20 を出力
1000:convCurr()            // 2000 を出力
1000:convCurr('EUR')        // 1000 を出力
1000:convCurr('USD')        // 2000 を出力
1000:convCurr('USD', 'USD') // 1000 を出力
```

##### 結果
出力は変換後の通貨数値です。