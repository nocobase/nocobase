:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/ai-employees/features/new-ai-employees)をご参照ください。
:::

# AI従業員の新規作成

組み込みのAI従業員でニーズが満たせない場合は、独自のAI従業員を作成してカスタマイズすることができます。

## 作成の開始

`AI employees` 管理ページに移動し、`New AI employee` をクリックします。

## 基本情報の設定

`Profile` タブで以下の設定を行います：

- `Username`：一意の識別子。
- `Nickname`：表示名。
- `Position`：役職の説明。
- `Avatar`：従業員のアバター。
- `Bio`：略歴。
- `About me`：システムプロンプト。
- `Greeting message`：チャットの挨拶メッセージ。

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## ロール設定（Role setting）

`Role setting` タブで、従業員のシステムプロンプト（System Prompt）を設定します。この内容は、会話における従業員のアイデンティティ、目標、業務範囲、および出力スタイルを定義します。

少なくとも以下の内容を含めることを推奨します：

- 役割の定義と責任範囲。
- タスク処理の原則と回答の構造。
- 禁止事項、情報の境界、およびトーンやスタイル。

必要に応じて変数（現在のユーザー、現在のロール、現在の言語、日時など）を挿入でき、プロンプトを異なる会話のコンテキストに自動的に適応させることができます。

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## スキルとナレッジの設定

`Skills` タブでスキルの権限を設定します。ナレッジベース機能が有効な場合は、ナレッジベース関連のタブで引き続き設定を行うことができます。

## 作成の完了

`Submit` をクリックして作成を完了します。