---
title: "Claude Code + NocoBase：最強の AI ブレイン、あなたの NocoBase チーフアーキテクト"
description: "Anthropic 公式の AI プログラミングアシスタント Claude Code を NocoBase に接続し、Skills と CLI で自然言語からビジネスシステムを操作します。"
keywords: "Claude Code,NocoBase,AI Agent,Anthropic,Skills,CLI,自然言語"
sidebar: false
---

:::warning 注意

本ページの内容はまだ執筆中です。一部のセクションは不完全または変更される可能性があります。

:::

# Claude Code + NocoBase：最強の AI ブレイン、あなたの NocoBase チーフアーキテクト

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) は Anthropic がリリースした公式 AI プログラミングアシスタントです。ターミナルで直接実行でき、コードベース全体を理解して、コーディングからシステム構築までさまざまなタスクを支援します。NocoBase に接続すれば、自然言語でデータテーブルの作成、ページの構築、ワークフローの設定が可能になり、最も強力な AI モデルによる構築体験を享受できます。

<!-- Claude Code がターミナルで NocoBase を操作しているスクリーンショットが必要 -->

## Claude Code とは

Claude Code は Anthropic がリリースした CLI 形態の AI Agent で、Claude シリーズのモデルが搭載されています。ターミナルで直接実行され、プロジェクトのコンテキストを理解して操作を実行できます。主な特徴：

- **トップクラスのモデル能力** -- Claude Opus / Sonnet をベースに、コード理解と生成においてトップレベルの性能を発揮
- **ターミナルネイティブ** -- ターミナルで直接実行でき、開発者のワークフローとシームレスに連携
- **プロジェクト認識** -- プロジェクト構造、依存関係、コーディング規約を自動的に理解
- **マルチツール連携** -- ファイルの読み書き、コマンドの実行、コード検索などの操作をサポート

Claude Code は VS Code、JetBrains などの IDE 統合もサポートしており、スタンドアロンのデスクトップアプリケーションや Web アプリケーションとしても使用できます。

## Claude Code を選ぶ理由

NocoBase を操作する AI Agent を選ぶ際に、Claude Code が最適なシーンは以下の通りです：

- **最強のモデル能力を求める** -- Claude シリーズのモデルは複雑な推論とコード生成に優れている
- **開発者の日常ワークフロー** -- ターミナルネイティブで、IDE、Git、npm などのツールとシームレスに連携
- **プロジェクトの深い理解が必要** -- Claude Code はプロジェクト構造を自動分析し、コンテキストに沿った提案を提供
- **構築と開発を同時に行う** -- NocoBase アプリケーションの構築も、カスタムプラグインの開発も支援

## 接続の仕組み

Claude Code は以下の方法で NocoBase と連携します：

```
あなた（ターミナル / VS Code / JetBrains / ...）
  │
  └─→ Claude Code
        │
        ├── NocoBase Skills（Agent が NocoBase の設定体系を理解するためのナレッジ）
        │
        └── NocoBase CLI（作成、変更、デプロイなどの操作を実行）
              │
              └─→ NocoBase サービス（あなたのビジネスシステム）
```

- **NocoBase Skills** -- ドメインナレッジパッケージ。Claude Code が NocoBase の操作方法を理解できるようにする
- **NocoBase CLI** -- コマンドラインツール。データモデリング、ページ構築などの操作を実際に実行
- **NocoBase サービス** -- 稼働中の NocoBase インスタンス

## 前提条件

始める前に、以下の環境を準備してください：

- Claude Code がインストール済み（`npm install -g @anthropic-ai/claude-code`）
- Node.js >= 22（NocoBase CLI と Skills の実行に必要）
- 既存の NocoBase インスタンスがある場合、**AI 機能は急速に進化しているため、現時点では beta 最新版のみが完全な体験をサポートしています。最低バージョン要件は >= 2.1.0-beta.20 で、最新版への更新を強くお勧めします。**

## クイックスタート

### ワンクリック AI インストール

以下のプロンプトを Claude Code にコピーしてください。NocoBase CLI のインストール、初期化、環境設定を自動的に完了します：

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

<!-- TODO: 5-8 個のよくある質問を整理。例：API Key の設定方法、Claude Code がサポートするモデル、VS Code での使用方法、Skills のインストールに失敗した場合の対処法など -->

## 関連リンク

- [NocoBase CLI](../quick-start.md) -- NocoBase のインストールと管理用コマンドラインツール
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) -- AI Agent にインストール可能なドメインナレッジパッケージ
- [AI 構築クイックスタート](../../ai-builder/index.md) -- AI でゼロから NocoBase アプリケーションを構築
- [Claude Code 公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code) -- Claude Code の完全な使用ガイド
- [OpenClaw + NocoBase](../openclaw/index.md) -- 世界で最も人気のあるオープンソース AI Agent、Lark でワンクリックデプロイ
- [Codex + NocoBase](../codex/index.md) -- OpenAI 公式の AI プログラミングアシスタント
- [OpenCode + NocoBase](../opencode/index.md) -- オープンソース、75 以上のモデルをサポートするターミナル AI Agent
