:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

### 期間のフォーマット

#### 1. :formatI(patternOut, patternIn)

##### 構文
期間や間隔をフォーマットします。対応している出力形式は以下の通りです。
- `human+`、`human`（人間が読みやすい表示に適しています）
- `millisecond(s)`、`second(s)`、`minute(s)`、`hour(s)`、`year(s)`、`month(s)`、`week(s)`、`day(s)` といった単位（またはその省略形）です。

パラメータ：
- `patternOut`：出力形式（例：`'second'`、`'human+'` など）
- `patternIn`：オプション。入力単位（例：`'milliseconds'`、`'s'` など）

##### 例
```
// 実行環境の例：API オプション { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // 出力: 2
2000:formatI('seconds')      // 出力: 2
2000:formatI('s')            // 出力: 2
3600000:formatI('minute')    // 出力: 60
3600000:formatI('hour')      // 出力: 1
2419200000:formatI('days')   // 出力: 28

// フランス語での例：
2000:formatI('human')        // 出力: "quelques secondes"
2000:formatI('human+')       // 出力: "dans quelques secondes"
-2000:formatI('human+')      // 出力: "il y a quelques secondes"

// 英語での例：
2000:formatI('human')        // 出力: "a few seconds"
2000:formatI('human+')       // 出力: "in a few seconds"
-2000:formatI('human+')      // 出力: "a few seconds ago"

// 単位変換の例：
60:formatI('ms', 'minute')   // 出力: 3600000
4:formatI('ms', 'weeks')      // 出力: 2419200000
'P1M':formatI('ms')          // 出力: 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // 出力: 10296.085
```

##### 結果
出力結果は、入力値と単位変換に応じて、対応する期間または間隔として表示されます。