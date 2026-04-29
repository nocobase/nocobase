# AI 従業員ノード

## 紹介

AI 従業員ノードは、ワークフロー内で AI 従業員に指定されたタスクを実行させ、構造化された情報を出力するために使用します。

ワークフローを作成した後、ワークフローノードの追加時に AI 従業員ノードを選択できます。

![20260420142250](https://static-docs.nocobase.com/20260420142250.png)

## ノード設定
### 事前準備

AI 従業員ノードを設定する前に、ワークフローの構築方法、LLM サービスの設定方法、組み込み AI 従業員の役割、および AI 従業員の作成方法について理解しておく必要があります。

以下のドキュメントを参照してください：
  - [ワークフロー](/workflow)
  - [LLM サービスの設定](/ai-employees/features/llm-service)
  - [組み込み AI 従業員](/ai-employees/features/built-in-employee)
  - [AI 従業員の新規作成](/ai-employees/features/new-ai-employees)

### タスク
#### AI 従業員の選択

このノードのタスクを処理する AI 従業員を選択します。ドロップダウンリストから、システム内で有効化されている組み込み AI 従業員または自分で作成した AI 従業員を選択します。

![20260420143554](https://static-docs.nocobase.com/20260420143554.png)

#### モデルの選択

AI 従業員を駆動する大規模言語モデルを選択します。ドロップダウンリストから、システム内で設定済みの LLM サービスが提供するモデルを選択します。

![20260420145057](https://static-docs.nocobase.com/20260420145057.png)

#### 操作ユーザーの選択

システム内のユーザーを選択して、AI 従業員にデータアクセス権限を提供します。AI 従業員がデータをクエリする際、そのユーザーの権限範囲に制限されます。

トリガーが操作ユーザーを提供する場合（例：`Custom action event`）、そのユーザーの権限が優先的に使用されます。

![20260420145244](https://static-docs.nocobase.com/20260420145244.png)

#### プロンプトとタスク説明

`Background` は AI に送信されるシステムプロンプトとして使用され、通常はタスクの背景情報や制約条件を記述します。

`Default user message` は AI に送信されるユーザープロンプトで、通常はタスク内容を記述し、AI に何をすべきかを伝えます。

![20260420174515](https://static-docs.nocobase.com/20260420174515.png)

#### 添付ファイル

`Attachments` は `Default user message` と一緒に AI に送信されます。通常、タスクで処理が必要なドキュメントや画像です。

添付ファイルは 2 種類のタイプをサポートしています：

1. `File(load via Files collection)` 主キーを使用して指定のファイルテーブルからデータを取得し、AI に送信する添付ファイルとして使用します。

![20260420150933](https://static-docs.nocobase.com/20260420150933.png)

2. `File via URL` 指定の URL からファイルを取得し、AI に送信する添付ファイルとして使用します。

![20260420151702](https://static-docs.nocobase.com/20260420151702.png)

#### スキルとツール

通常、AI 従業員には複数のスキルとツールがバインドされています。ここでは、現在のタスクで特定のスキルやツールのみを使用するように制限できます。

デフォルトは `Preset` で、AI 従業員にプリセットされたスキルとツールを使用します。`Customer` に設定すると、AI 従業員の特定のスキルやツールのみを選択して使用できます。

![20260426231701](https://static-docs.nocobase.com/20260426231701.png)

#### Web 検索

`Web search` スイッチは、現在のノードの AI が Web 検索機能を使用するかどうかを制御します。AI 従業員の Web 検索については [Web 検索](/ai-employees/features/web-search) を参照してください。

![20260426231945](https://static-docs.nocobase.com/20260426231945.png)

### フィードバックと通知
#### 構造化出力

ユーザーは [JSON Schema](https://json-schema.org/) 仕様に従って、AI 従業員ノードの最終出力のデータ構造を定義できます。

![20260426232117](https://static-docs.nocobase.com/20260426232117.png)

ワークフロー内の他のノードが AI 従業員ノードのデータを取得する際にも、この `JSON Schema` に基づいてオプションが生成されます。

![20260426232509](https://static-docs.nocobase.com/20260426232509.png)

##### デフォルト値

デフォルトで以下の `JSON Schema` 定義が提供されています。これはオブジェクトを定義し、そのオブジェクトには result という名前の文字列型プロパティが含まれます。また、プロパティにはタイトル「Result」が設定されています。

```json
{
  "type": "object",
  "properties": {
    "result": {
      "title": "Result",
      "type": "string",
      "description": "The text message sent to the user"
    }
  }
}
```

この定義に基づき、AI 従業員ノードは定義に適合する JSON 構造のデータを出力します。

```json
{
  result: "Some text generated from LLM "
}
```

#### 承認設定

ノードは 3 つの承認モードをサポートしています：

- `No required` AI の出力内容は人手による審査が不要です。AI が出力を完了すると、ワークフローが自動的に続行されます。
- `Human decision` AI の出力内容は必ず審査者に通知され、人手による審査が行われます。審査完了後にワークフローが続行されます。
- `AI decision` AI が審査者に出力内容の人手審査を通知するかどうかを判断します。

![20260426232232](https://static-docs.nocobase.com/20260426232232.png)

承認モードが `No required` でない場合、ノードには 1 人以上の審査者を設定する必要があります。

AI 従業員ノード内の AI がすべての内容を出力し終えると、そのノードに設定されたすべての審査者に通知が送信されます。通知された審査者のうち 1 人が承認操作を完了すれば、ワークフローの続行が可能です。

![20260426232319](https://static-docs.nocobase.com/20260426232319.png)
