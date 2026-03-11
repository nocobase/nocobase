:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/ai-employees/quick-start)をご参照ください。
:::

# クイックスタート

5分でAI従業員の最小構成を完了させましょう。

## プラグインのインストール

AI従業員はNocoBaseの組み込みプラグイン（`@nocobase/plugin-ai`）であるため、個別のインストールは不要です。

## モデルの設定

以下のいずれかの入口からLLMサービスを設定できます：

1. 管理画面の入口：`システム設定 -> AI従業員 -> LLMサービス`。
2. フロントエンドのショートカット：AI対話パネルの `モデルスイッチャー` でモデルを選択する際、「LLMサービスを追加」のショートカットをクリックすると直接設定画面へ移動します。

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

通常、以下の項目を確認する必要があります：
1. プロバイダー（Provider）を選択。
2. APIキーを入力。
3. `有効なモデル`（Enabled Models）を設定。デフォルトの Recommend（推奨）のままで問題ありません。

## 組み込み従業員の有効化

組み込みのAI従業員はデフォルトですべて有効になっており、通常は手動で一つずつ有効にする必要はありません。

利用範囲を調整（特定の従業員を有効/無効化）したい場合は、`システム設定 -> AI従業員` のリストページにある `有効`（Enabled）スイッチで変更できます。

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## 共同作業を開始する

アプリケーションページの右下にあるショートカット入口にマウスを合わせ、AI従業員を選択します。
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

クリックしてAI対話ダイアログを開きます：

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

また、以下の操作も可能です：  
* ブロックの追加
* 添付ファイルの追加
* ウェブ検索の有効化
* AI従業員の切り替え
* モデルの選択

AI従業員はページの構造をコンテキストとして自動的に取得できます。例えば、フォームブロック上の Dex はフォームのフィールド構造を自動で取得し、適切なスキルを呼び出してページ操作を行います。

## 快捷タスク 

各AI従業員に対して、現在の場所に応じた「よく使うタスク」をプリセットできます。ワンクリックで業務を開始できるため、非常に迅速で便利です。

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## 組み込み従業員一覧

NocoBaseには、特定のシーンに特化した複数のAI従業員がプリセットされています。

必要な手順は以下の通りです：

1. LLMサービスを設定する。
2. 必要に応じて従業員の有効状態を調整する（デフォルトで有効）。
3. 会話の中でモデルを選択し、共同作業を開始する。

| 従業員名 | ロール（役割） | 主要な能力 |
| :--- | :--- | :--- |
| **Cole** | NocoBaseアシスタント | 製品の使用方法に関するQ&A、ドキュメント検索 |
| **Ellis** | メールエキスパート | メールの作成、要約の生成、返信案の作成 |
| **Dex** | データ整理エキスパート | フィールドの翻訳、フォーマット変換、情報の抽出 |
| **Viz** | インサイトアナリスト | データの洞察、トレンド分析、主要指標の解釈 |
| **Lexi** | 翻訳アシスタント | 多言語翻訳、コミュニケーション補助 |
| **Vera** | リサーチアナリスト | ネット検索、情報の集約、詳細な調査 |
| **Dara** | データ視覚化エキスパート | グラフ設定、視覚化レポートの生成 |
| **Orin** | データモデリングエキスパート | データ構造（コレクション）の設計補助、フィールドの提案 |
| **Nathan** | フロントエンドエンジニア | フロントエンドのコードスニペット作成補助、スタイルの調整 |

**備考**

一部の組み込みAI従業員は、右下のリストには表示されず、専用の作業シーンで利用されます：

- Orin：データモデリングページ。
- Dara：グラフ設定ブロック。
- Nathan：JSブロックなどのコードエディタ。