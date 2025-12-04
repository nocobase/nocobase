:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 応用

## はじめに

主要な大規模言語モデル（LLM）はツールを使用する能力を持っています。AI従業員プラグインには、LLMが利用できる一般的なツールがいくつか組み込まれています。

AI従業員の設定ページで設定するスキルは、まさにこのLLMが使用するツールとなります。

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## スキルの設定

AI従業員プラグインの設定ページに移動し、`AI employees` タブをクリックしてAI従業員管理ページを開きます。

スキルを設定したいAI従業員を選択し、`Edit` ボタンをクリックしてAI従業員編集ページに進みます。

`Skills` タブで `Add Skill` ボタンをクリックすると、現在のAI従業員にスキルを追加できます。

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## スキルの概要

### Frontend

Frontend グループでは、AI従業員がフロントエンドコンポーネントと対話できるようになります。

- `Form filler` スキルを使用すると、AI従業員が生成したフォームデータを、ユーザーが指定したフォームに自動入力できます。

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Data modeling

Data modeling グループのスキルは、AI従業員にNocoBaseの内部APIを呼び出してデータモデリングを行う能力を与えます。

- `Intent Router` (意図ルーター) は、ユーザーが**コレクション**の構造を変更したいのか、それとも新しい**コレクション**の構造を作成したいのかを判断します。
- `Get collection names` は、システム内に存在するすべての**コレクション**名を取得します。
- `Get collection metadata` は、指定された**コレクション**の構造情報を取得します。
- `Define collections` は、AI従業員がシステム内で**コレクション**を作成できるようにします。

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` は、AI従業員に**ワークフロー**を実行する能力を与えます。**ワークフロー**プラグインで `Trigger type` を `AI employee event` に設定した**ワークフロー**は、AI従業員が使用できるスキルとしてここに表示されます。

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

Code Editor グループのスキルは、主にAI従業員がコードエディタと対話できるようにします。

- `Get code snippet list` は、プリセットされたコードスニペットのリストを取得します。
- `Get code snippet content` は、指定されたコードスニペットの内容を取得します。

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Others

- `Chart generator` は、AI従業員にグラフを生成する能力を与え、会話中に直接グラフを出力できます。

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)