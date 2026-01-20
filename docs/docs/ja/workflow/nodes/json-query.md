---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::



# JSON 計算

## はじめに

このノードは、さまざまなJSON計算エンジンを活用し、上流ノードから生成される複雑なJSONデータを計算したり、構造を変換したりして、後続のノードで利用しやすい形に整えます。例えば、SQL操作やHTTPリクエストノードの結果を、このノードで必要な値や変数形式に変換し、次のノードでスムーズに利用できるようにします。

## ノードの作成

ワークフロー設定画面で、フロー内のプラス（「+」）ボタンをクリックすると、「JSON 計算」ノードを追加できます。

![Create Node](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=ヒント}
通常、「JSON 計算」ノードは、他のデータノードの下に作成して解析を行うのが一般的です。
:::

## ノードの設定

### 解析エンジン

JSON 計算ノードは、さまざまな解析エンジンを通じて異なる構文をサポートしています。ご自身の好みや各エンジンの特徴に基づいて、最適なエンジンを選択できます。現在、以下の3種類の解析エンジンに対応しています。

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Engine Selection](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### データソース

データソースは、上流ノードの結果、またはワークフローのコンテキスト内のデータオブジェクトのいずれかになります。通常、SQLノードやHTTPリクエストノードの結果のように、組み込みの構造を持たないデータオブジェクトが該当します。

![Data Source](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=ヒント}
通常、コレクション関連ノードのデータオブジェクトは、コレクション設定情報によってすでに構造化されているため、JSON 計算ノードで解析する必要はほとんどありません。
:::

### 解析式

解析要件と選択した解析エンジンに基づいて、カスタムの解析式を定義します。

![Parsing Expression](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=ヒント}
エンジンごとに異なる解析構文が提供されます。詳細については、リンク先のドキュメントを参照してください。
:::

`v1.0.0-alpha.15` 以降のバージョンでは、式で変数を使用できるようになりました。変数は、実際のエンジンが実行される前に事前解析され、文字列テンプレートのルールに従って具体的な文字列値に置き換えられます。その後、式の他の静的文字列と結合されて最終的な式が形成されます。この機能は、例えばJSONコンテンツの一部を動的なキーで解析する必要がある場合など、式を動的に構築したいときに非常に便利です。

### プロパティマッピング

計算結果がオブジェクト（またはオブジェクトの配列）である場合、プロパティマッピングを利用して、必要なプロパティを子変数としてマッピングし、後続のノードで利用できるようにすることができます。

![Property Mapping](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=ヒント}
オブジェクト（またはオブジェクトの配列）の結果に対してプロパティマッピングを行わない場合、オブジェクト全体（またはオブジェクトの配列全体）がノードの結果に単一の変数として保存されます。そのため、オブジェクトのプロパティ値を直接変数として利用することはできません。
:::

## 例

解析対象のデータが、先行するSQLノードでクエリされた注文データのセットであると仮定します。

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

データ内の2つの注文それぞれの合計金額を解析・計算し、対応する注文IDと組み合わせてオブジェクトとして構成し、注文の合計金額を更新したい場合は、以下のように設定します。

![Example - Parse SQL Configuration](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. JSONata 解析エンジンを選択します。
2. SQL ノードの結果をデータソースとして選択します。
3. JSONata 式 `$[0].{"id": id, "total": products.(price * quantity)}` を使用して解析します。
4. プロパティマッピングを選択し、`id` と `total` を子変数としてマッピングします。

最終的な解析結果は以下のようになります。

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

その後、結果として得られた注文配列をループ処理し、各注文の合計金額を更新します。

![Update the total price of the corresponding order](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)