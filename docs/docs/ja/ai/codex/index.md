---
title: "Codex で NocoBase を操作、構築と開発を両立"
description: "OpenAI 公式の AI プログラミングアシスタント Codex を NocoBase に接続し、Skills と CLI で自然言語からビジネスシステムを操作します。"
keywords: "Codex,OpenAI,NocoBase,AI Agent,Skills,CLI,自然言語"
sidebar: false
---

:::warning 注意

本ページの内容はまだ執筆中です。一部のセクションは不完全または変更される可能性があります。

:::

# Codex で NocoBase を操作、構築と開発を両立

[Codex](https://github.com/openai/codex) は OpenAI がリリースした公式 AI プログラミングアシスタントです。ターミナルで実行でき、コードの読み書きやコマンドの実行を通じて、コーディングからシステム構築までさまざまなタスクを支援します。NocoBase に接続すれば、自然言語でデータテーブルの作成、ページの構築、ワークフローの設定が可能になり、GPT シリーズモデルのパワーで素早くビジネスシステムを構築できます。

<!-- Codex がターミナルで NocoBase を操作しているスクリーンショットが必要 -->

## Codex とは

Codex は OpenAI がリリースした CLI 形態の AI Agent で、GPT シリーズのモデル（o3、o4-mini など）が搭載されています。ローカルのサンドボックス環境で実行され、コードとコマンドを安全に実行できます。主な特徴：

- **GPT シリーズのパワー** -- OpenAI 最新モデルをベースに、コード生成とタスク計画に優れている
- **サンドボックス実行** -- 隔離されたサンドボックス内でコマンドを実行し、安全かつコントロール可能
- **マルチモーダル理解** -- テキスト、画像などの複数の入力に対応し、スクリーンショットの UI レイアウトも理解可能
- **柔軟な自律レベル** -- 提案モードからフルオートモードまで、AI の自律度をあなたが決定

## Codex を選ぶ理由

NocoBase を操作する AI Agent を選ぶ際に、Codex が最適なシーンは以下の通りです：

- **すでに OpenAI エコシステムを利用している** -- ChatGPT Plus/Pro サブスクリプションや OpenAI API Key を持っているなら、Codex が最も自然な選択
- **セキュリティを重視する** -- サンドボックス実行メカニズムにより、AI の操作がシステムに意図しない影響を与えることを防止
- **柔軟なコントロールが必要** -- タスクの複雑さに応じて自律レベルを切り替え可能。簡単なタスクはフルオート、機密操作は確認を求める
- **OpenAI モデルのスタイルが好み** -- GPT シリーズはタスク計画とステップ実行に独自の強みがある

## 接続の仕組み

Codex は以下の方法で NocoBase と連携します：

```
あなた（ターミナル / ...）
  │
  └─→ Codex
        │
        ├── NocoBase Skills（Agent が NocoBase の設定体系を理解するためのナレッジ）
        │
        └── NocoBase CLI（作成、変更、デプロイなどの操作を実行）
              │
              └─→ NocoBase サービス（あなたのビジネスシステム）
```

- **NocoBase Skills** -- ドメインナレッジパッケージ。Codex が NocoBase の操作方法を理解できるようにする
- **NocoBase CLI** -- コマンドラインツール。データモデリング、ページ構築などの操作を実際に実行
- **NocoBase サービス** -- 稼働中の NocoBase インスタンス

## 前提条件

始める前に、以下の環境を準備してください：

- Codex がインストール済み（`npm install -g @openai/codex`）
- Node.js >= 22（NocoBase CLI と Skills の実行に必要）
- 既存の NocoBase インスタンスがある場合、**AI 機能は急速に進化しているため、現時点では beta 最新版のみが完全な体験をサポートしています。最低バージョン要件は >= 2.1.0-beta.20 で、最新版への更新を強くお勧めします。**

## クイックスタート

### ワンクリック AI インストール

以下のプロンプトを Codex にコピーしてください。NocoBase CLI のインストール、初期化、環境設定を自動的に完了します：

```
NocoBase CLI をインストールして初期化を完了してください：https://docs.nocobase.com/ja/ai/ai-quick-start.md（リンクの内容を直接参照してください）
```

### 手動インストール

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

ブラウザが自動的にビジュアル設定ページを開き、NocoBase Skills のインストール、データベースの設定、アプリケーションの起動を案内します。詳細な手順は [クイックスタート](../quick-start.md) を参照してください。

インストール完了後、`nb env list` を実行して環境の実行状態を確認します：

```bash
nb env list
```

出力に設定済みの環境と実行状態が表示されていることを確認します。

## よくある質問

<!-- TODO: 5-8 個のよくある質問を整理。例：OpenAI API Key の設定方法、Codex がサポートするモデル、自律レベルの選び方、Skills のインストールに失敗した場合の対処法など -->

## 関連リンク

- [NocoBase CLI](../quick-start.md) -- NocoBase のインストールと管理用コマンドラインツール
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) -- AI Agent にインストール可能なドメインナレッジパッケージ
- [AI 構築クイックスタート](../../ai-builder/index.md) -- AI でゼロから NocoBase アプリケーションを構築
- [Codex GitHub](https://github.com/openai/codex) -- Codex のソースコードとドキュメント
- [Claude Code + NocoBase](../claude-code/index.md) -- Anthropic 公式の AI プログラミングアシスタント
- [OpenCode + NocoBase](../opencode/index.md) -- オープンソース、75 以上のモデルをサポートするターミナル AI Agent
