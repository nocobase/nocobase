:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

## ループ処理

ループ処理は、配列やオブジェクト内のデータを繰り返しレンダリングするために使用されます。ループの開始と終了を示すマーカーを定義することで、繰り返す内容を識別します。ここでは、いくつかの一般的なシナリオについて説明します。

### 配列の反復処理

#### 1. 構文の説明

- ループの現在の項目は`{d.array[i].プロパティ}`タグで定義し、次の項目は`{d.array[i+1].プロパティ}`で指定することで、ループ範囲を識別します。
- ループ時には、最初の行（`[i]`の部分）が自動的にテンプレートとして繰り返し使用されます。テンプレートにはループの例を一度だけ記述すれば十分です。

構文の例：
```
{d.配列名[i].プロパティ}
{d.配列名[i+1].プロパティ}
```

#### 2. 例：シンプルな配列のループ

##### データ
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### テンプレート
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### 結果
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. 例：ネストされた配列のループ

配列の中に配列がネストされている場合に適用でき、無限の階層までネスト可能です。

##### データ
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### テンプレート
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### 結果
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. 例：双方向ループ（高度な機能、v4.8.0以降）

双方向ループは、行と列の両方で同時に反復処理を行うことができ、比較表などの複雑なレイアウトを生成するのに適しています（注：現在、一部の形式はDOCX、HTML、MDテンプレートでのみ公式にサポートされています）。

##### データ
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### テンプレート
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### 結果
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. 例：ループイテレーター値へのアクセス（v4.0.0以降）

ループ内で現在の反復処理のインデックス値に直接アクセスできるため、特殊な書式設定の要件を満たすのに役立ちます。

##### テンプレートの例
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> 注：ドットの数は異なる階層のインデックス値を示します（例：`.i`は現在の階層、`..i`は上位の階層）。現在、逆順の問題が存在しますので、詳細は公式ドキュメントを参照してください。

### オブジェクトの反復処理

#### 1. 構文の説明

- オブジェクトのプロパティについては、`.att` を使用してプロパティ名を取得し、`.val` を使用してプロパティ値を取得できます。
- 反復処理では、各プロパティ項目が一つずつ処理されます。

構文の例：
```
{d.オブジェクト名[i].att}  // プロパティ名
{d.オブジェクト名[i].val}  // プロパティ値
```

#### 2. 例：オブジェクトプロパティの反復処理

##### データ
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### テンプレート
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### 結果
```
People namePeople age
paul10
jack20
bob30
```

### ソート処理

ソート機能を利用すると、テンプレート内で配列データを直接ソートできます。

#### 1. 構文の説明：昇順ソート

- ループタグ内でプロパティをソート基準として使用します。構文形式は次のとおりです。
  ```
  {d.array[ソートプロパティ, i].プロパティ}
  {d.array[ソートプロパティ+1, i+1].プロパティ}
  ```
- 複数のソート基準が必要な場合は、角括弧内に複数のソートプロパティをカンマで区切って指定します。

#### 2. 例：数値プロパティによるソート

##### データ
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### テンプレート
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### 結果
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. 例：複数プロパティによるソート

##### データ
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### テンプレート
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### 結果
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### フィルタリング処理

フィルタリング処理は、特定の条件に基づいてループ内のデータ行をフィルタリングするために使用されます。

#### 1. 構文の説明：数値フィルタリング

- ループタグに条件（例：`age > 19`）を追加します。構文形式は次のとおりです。
  ```
  {d.array[i, 条件].プロパティ}
  ```

#### 2. 例：数値フィルタリング

##### データ
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### テンプレート
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### 結果
```
People
John
Bob
```

#### 3. 構文の説明：文字列フィルタリング

- 文字列条件はシングルクォーテーションで指定します。形式の例：
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. 例：文字列フィルタリング

##### データ
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### テンプレート
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### 結果
```
People
Falcon 9
Falcon Heavy
```

#### 5. 構文の説明：最初のN項目をフィルタリング

- ループインデックス `i` を利用して、最初のN個の要素をフィルタリングできます。構文の例：
  ```
  {d.array[i, i < N].プロパティ}
  ```

#### 6. 例：最初の2項目をフィルタリング

##### データ
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### テンプレート
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### 結果
```
People
Falcon 9
Model S
```

#### 7. 構文の説明：最後のN項目を除外

- 負のインデックス `i` を使用して、末尾からの項目を表します。例えば：
  - `{d.array[i=-1].プロパティ}` は最後の項目を取得します。
  - `{d.array[i, i!=-1].プロパティ}` は最後の項目を除外します。

#### 8. 例：最後の1項目と最後の2項目を除外

##### データ
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### テンプレート
```
最後の項目: {d[i=-1].name}

最後の項目を除外:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

最後の2項目を除外:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### 結果
```
最後の項目: Falcon Heavy

最後の項目を除外:
Falcon 9
Model S
Model 3

最後の2項目を除外:
Falcon 9
Model S
```

#### 9. 構文の説明：スマートフィルタリング

- スマート条件ブロックを使用すると、複雑な条件に基づいて行全体を非表示にできます。形式の例：
  ```
  {d.array[i].プロパティ:ifIN('キーワード'):drop(row)}
  ```

#### 10. 例：スマートフィルタリング

##### データ
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### テンプレート
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### 結果
```
People
Model S
Model 3
```
（注：テンプレート内の「Falcon」を含む行は、スマートフィルタリング条件によって削除されます。）

### 重複排除処理

#### 1. 構文の説明

- カスタムイテレーターを使用すると、特定のプロパティ値に基づいて一意（重複しない）の項目を取得できます。構文は通常のループと似ていますが、重複する項目は自動的に無視されます。

形式の例：
```
{d.array[プロパティ].プロパティ}
{d.array[プロパティ+1].プロパティ}
```

#### 2. 例：一意なデータの選択

##### データ
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### テンプレート
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### 結果
```
Vehicles
Hyundai
Airbus
```