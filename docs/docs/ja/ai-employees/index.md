---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/ai-employees/index)をご参照ください。
:::

# 概要

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

AI 従業員（`AI Employees`）は、NocoBase の業務システムに深く統合されたエージェント機能です。

それは単なる「チャットができる」ロボットではなく、業務画面内でコンテキストを理解し、操作を直接実行できる「デジタル同僚」です：

- **業務コンテキストを理解**：現在のページ、ブロック、データ構造、および選択された内容を認識します。
- **アクションを直接実行可能**：スキルを呼び出して、照会、分析、入力、設定、生成などのタスクを完了できます。
- **ロールベースのコラボレーション**：職務に応じて異なる従業員を設定し、会話の中でモデルを切り替えて連携できます。

## 5 分で始めるステップ

まず [クイックスタート](/ai-employees/quick-start) を確認し、以下の手順で最小限の利用可能な設定を完了させてください：

1. 少なくとも 1 つの [LLM サービス](/ai-employees/features/llm-service) を設定します。
2. 少なくとも 1 人の [AI 従業員](/ai-employees/features/enable-ai-employee) を有効にします。
3. 会話を開き、[AI 従業員とコラボレーション](/ai-employees/features/collaborate) を開始します。
4. 必要に応じて [ウェブ検索](/ai-employees/features/web-search) と [クイックタスク](/ai-employees/features/task) を有効にします。

## 機能マップ

### A. 基本設定（管理者）

- [LLM サービスの設定](/ai-employees/features/llm-service)：プロバイダー（Provider）に接続し、利用可能なモデルを設定・管理します。
- [AI 従業員の有効化](/ai-employees/features/enable-ai-employee)：内蔵従業員の有効化/無効化、および利用範囲を制御します。
- [AI 従業員の新規作成](/ai-employees/features/new-ai-employees)：ロール、キャラクター設定、ウェルカムメッセージ、能力の境界を定義します。
- [スキルの使用](/ai-employees/features/tool)：スキルの権限（`Ask` / `Allow`）を設定し、実行リスクを制御します。

### B. 日常のコラボレーション（業務ユーザー）

- [AI 従業員とコラボレーション](/ai-employees/features/collaborate)：会話内で従業員やモデルを切り替え、継続的に連携します。
- [コンテキストの追加 - ブロック](/ai-employees/features/pick-block)：ページのブロックをコンテキストとして AI に送信します。
- [クイックタスク](/ai-employees/features/task)：ページやブロックに頻繁に使用するタスクをプリセットし、ワンクリックで実行します。
- [ウェブ検索](/ai-employees/features/web-search)：最新の情報が必要な場合に、検索拡張回答を有効にします。

### C. 高度な機能（拡張）

- [内蔵 AI 従業員](/ai-employees/features/built-in-employee)：プリセットされた従業員の役割と適用シーンを理解します。
- [権限管理](/ai-employees/permission)：組織の権限モデルに従って、従業員、スキル、データへのアクセスを制御します。
- [AI ナレッジベース](/ai-employees/knowledge-base/index)：企業知識を導入し、回答の安定性と追跡可能性を向上させます。
- [ワークフロー LLM ノード](/ai-employees/workflow/nodes/llm/chat)：AI 機能を自動化プロセス（ワークフロー）に組み込みます。

## コアコンセプト（事前の統一を推奨）

以下の用語は用語集と一致しており、チーム内での統一した使用を推奨します：

- **AI 従業員（AI Employee）**：キャラクター設定（Role setting）とスキル（Tool / Skill）で構成される実行可能なエージェント。
- **LLM サービス（LLM Service）**：モデルの接続と機能設定の単位。プロバイダー（Provider）とモデルリストを管理します。
- **プロバイダー（Provider）**：LLM サービスの背後にあるモデル提供者。
- **有効なモデル（Enabled Models）**：現在の LLM サービスにおいて、会話内で選択を許可されているモデルの集合。
- **従業員スイッチャー（AI Employee Switcher）**：会話内で現在のコラボレーション従業員を切り替えます。
- **モデルスイッチャー（Model Switcher）**：会話内でモデルを切り替え、従業員ごとに好みを記憶します。
- **スキル（Tool / Skill）**：AI が呼び出し可能な実行機能の単位。
- **スキル権限（Permission: Ask / Allow）**：スキルを呼び出す前に、人間の確認が必要かどうか。
- **コンテキスト（Context）**：ページ、ブロック、データ構造などの業務環境情報。
- **会話（Chat）**：ユーザーと AI 従業員との一連の継続的なやり取り。
- **ウェブ検索（Web Search）**：外部検索に基づき、リアルタイム情報を補完する機能。
- **ナレッジベース（Knowledge Base / RAG）**：検索拡張生成を通じて企業の知識を導入します。
- **ベクトルストレージ（Vector Store）**：ナレッジベースにセマンティック検索機能を提供するベクトル化されたストレージ。

## インストール説明

AI 従業員は NocoBase の内蔵プラグイン（`@nocobase/plugin-ai`）であり、インストール不要ですぐに使用できます。