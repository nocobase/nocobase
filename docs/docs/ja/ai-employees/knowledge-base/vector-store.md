:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ベクターストア

## 概要

知識ベースでは、ドキュメントを保存する際にドキュメントをベクトル化し、ドキュメントを検索する際に検索語をベクトル化します。これらの処理には、いずれも元のテキストをベクトル化するために `Embedding model` を使用する必要があります。

AI 知識ベースプラグインでは、ベクターストアは `Embedding model` とベクトルデータベースを紐付けたものです。

## ベクターストアの管理

AI Employees プラグインの設定ページに移動し、`Vector store` タブをクリックして `Vector store` を選択すると、ベクターストア管理ページが表示されます。

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

右上にある `Add new` ボタンをクリックして、新しいベクターストアを追加します。

- `Name` 入力欄にベクターストアの名前を入力します。
- `Vector store` で、すでに設定済みのベクトルデータベースを選択します。詳細は[ベクトルデータベース](/ai-employees/knowledge-base/vector-database)をご参照ください。
- `LLM service` で、すでに設定済みの LLM サービスを選択します。詳細は[LLM サービス管理](/ai-employees/quick-start/llm-service)をご参照ください。
- `Embedding model` 入力欄に、使用する `Embedding` モデルの名前を入力します。

`Submit` ボタンをクリックして、ベクターストア情報を保存します。

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)