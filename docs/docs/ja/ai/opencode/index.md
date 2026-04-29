---
title: "OpenCode + NocoBase：オープンソースで自由な、ベンダーロックインのない NocoBase 構築方法"
description: "オープンソース AI コーディングアシスタント OpenCode を NocoBase に接続し、自由にモデルを選択して自然言語でビジネスシステムを操作できます。"
keywords: "OpenCode,NocoBase,AI Agent,オープンソース,マルチモデル,Skills,CLI,自然言語"
sidebar: false
---

:::warning 作成中

このページの内容はまだ作成中です。一部のセクションが不完全であったり、変更される可能性があります。

:::

# OpenCode + NocoBase：オープンソースで自由な、ベンダーロックインのない NocoBase 構築方法

[OpenCode](https://github.com/opencode-ai/opencode) はオープンソースのターミナル AI Agent です。75 以上のモデル（Claude、GPT、Gemini、DeepSeek など）に対応し、特定のベンダーに縛られることなく、最適なモデルを自由に選べます。NocoBase に接続すれば、自然言語でデータテーブルの作成、ページの構築、ワークフローの設定が行え、モデル選択とコストを完全にコントロールできます。

<!-- OpenCode がターミナルで NocoBase を操作しているスクリーンショットが必要 -->

## OpenCode とは

OpenCode は Anomaly Innovations が開発した（GitHub 140k+ Star）「ベンダーロックインのないターミナル AI Agent」です。Go 言語で書かれており、美しい TUI インターフェースを備えています。主な特徴：

- **75 以上のモデルに対応**——Claude、GPT、Gemini、DeepSeek、ローカルモデルなど、自由に切り替え可能
- **ベンダーロックインなし**——自分の API Key を使い、実際の使用量に応じた課金のみ。追加のサブスクリプションは不要
- **マルチ Agent アーキテクチャ**——Build、Plan、Review、Debug、Docs の 5 種類の Agent ロールを内蔵
- **プライバシー優先**——コードやコンテキストを保存せず、すべてのデータはローカルに保持

OpenCode は VS Code、JetBrains、Zed、Neovim などのエディタ統合にも対応しており、スタンドアロンのデスクトップアプリも提供しています。

## なぜ OpenCode を選ぶのか

NocoBase を操作する AI Agent を選ぶ際、OpenCode が最も適しているシーン：

- **特定のモデルに縛られたくない**——今日は Claude、明日は GPT、明後日は DeepSeek と、一つのツールですべて対応
- **コストを重視する**——自分の API Key で従量課金、既存の ChatGPT Plus サブスクリプションも利用可能
- **プライバシーを重視する**——コードやコンテキストがサードパーティを経由せず、ローカルモデルにも対応
- **高いカスタマイズ性を求める**——YAML 設定で Agent の動作をカスタマイズし、チーム固有のニーズに対応

## 接続の仕組み

OpenCode は以下の方法で NocoBase と連携します：

```
あなた（ターミナル / VS Code / JetBrains / ...）
  │
  └─→ OpenCode
        │
        ├── NocoBase Skills（Agent に NocoBase の設定体系を理解させる）
        │
        └── NocoBase CLI（作成・変更・デプロイなどの操作を実行）
              │
              └─→ NocoBase サービス（あなたのビジネスシステム）
```

- **NocoBase Skills**——ドメイン知識パッケージ。OpenCode に NocoBase の操作方法を教える
- **NocoBase CLI**——コマンドラインツール。データモデリングやページ構築などの操作を実際に実行する
- **NocoBase サービス**——稼働中の NocoBase インスタンス

## 前提条件

始める前に、以下の環境を準備してください：

- OpenCode がインストール済みであること（[インストールガイド](https://opencode.ai/docs/)）
- Node.js >= 22（NocoBase CLI と Skills の実行に必要）
- 既存の NocoBase インスタンスがある場合、**AI 機能は急速に進化しているため、現時点では beta 最新版のみ完全な体験をサポートしています。最低バージョン要件は >= 2.1.0-beta.20 で、最新版への更新を強く推奨します。**

## クイックスタート

### ワンクリック AI インストール

以下のプロンプトを OpenCode にコピーすると、NocoBase CLI のインストール、初期化、環境設定を自動的に完了します：

```
NocoBase CLI をインストールして初期化を完了してください：https://docs.nocobase.com/cn/ai/ai-quick-start.md （リンク先の内容を直接参照してください）
```

### 手動インストール

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

ブラウザが自動的にビジュアル設定ページを開き、NocoBase Skills のインストール、データベースの設定、アプリケーションの起動をガイドします。詳しい手順は[クイックスタート](../quick-start.md)を参照してください。

インストール完了後、`nb env list` を実行して環境の稼働状態を確認します：

```bash
nb env list
```

出力に設定済みの環境と稼働状態が表示されることを確認してください。

## よくある質問

<!-- TODO: 5-8 個のよくある質問を整理。例：異なるモデルの API Key の設定方法、モデルの切り替え方法、ローカルモデルの使い方、Skills のインストールに失敗した場合の対処法など -->

## 関連リンク

- [NocoBase CLI](../quick-start.md) — NocoBase をインストール・管理するコマンドラインツール
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — AI Agent にインストールできるドメイン知識パッケージ
- [AI ビルド クイックスタート](../../ai-builder/index.md) — AI でゼロから NocoBase アプリを構築
- [OpenCode 公式ドキュメント](https://opencode.ai/docs/) — OpenCode の完全な使用ガイド
- [Claude Code + NocoBase](../claude-code/index.md) — Anthropic 公式 AI コーディングアシスタント
- [Codex + NocoBase](../codex/index.md) — OpenAI 公式 AI コーディングアシスタント
