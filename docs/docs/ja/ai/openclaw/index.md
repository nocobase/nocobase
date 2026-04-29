---
title: "OpenClaw + NocoBase：最も人気の AI Agent があなたのために働く"
description: "世界で最も人気のあるオープンソース AI Agent OpenClaw を NocoBase に接続し、Skills と CLI で自然言語からビジネスシステムを操作します。"
keywords: "OpenClaw,NocoBase,AI Agent,Skills,CLI,Lark,自然言語"
sidebar: false
---

:::warning 注意

本ページの内容はまだ執筆中です。一部のセクションは不完全または変更される可能性があります。

:::

# OpenClaw + NocoBase：最も人気の AI Agent があなたのために働く

[OpenClaw](https://github.com/openclaw/openclaw) は世界で最も人気のあるオープンソース AI Agent フレームワークです。チャットだけでなく、実際にタスクを実行できます。NocoBase に接続すれば、自然言語でデータテーブルの作成、ページの構築、ワークフローの設定が可能になり、さらに 24 時間 365 日自律的に稼働して、ビジネスシステムを継続的にメンテナンスできます。

<!-- OpenClaw が Lark で NocoBase を操作している対話スクリーンショットが必要 -->

## OpenClaw とは

OpenClaw は開発者 Peter Steinberger が作成したオープンソース AI Agent フレームワークで、現在世界で最も注目されている AI Agent プロジェクトの一つです（GitHub 300k+ Star）。そのコンセプトは「実際に作業できる AI アシスタント」です。ChatGPT や Claude のような対話ツールとは異なり、OpenClaw には 4 つの特徴があります：

- **実行能力** -- 自然言語の指示を受けてタスクを自動完了し、提案するだけではない
- **クロスセッション記憶** -- あなたの好みや使用習慣を記憶し、使えば使うほどスムーズに
- **Skills エコシステム** -- Skills のインストールで能力を拡張でき、アシスタントに「新しいスキルを教える」ような感覚
- **24 時間 365 日稼働** -- 定期タスクや自発的なレポートに対応し、ずっと見張っている必要がない

OpenClaw は Lark、Telegram、Discord など 26 以上のプラットフォームをサポートしており、普段使っているオフィスツールから直接対話できます。Lark ユーザーはワンクリックでデプロイでき、技術的な知識は不要です。

## OpenClaw を選ぶ理由

NocoBase を操作する AI Agent を選ぶ際に、OpenClaw が最適なシーンは以下の通りです：

- **導入のハードルがゼロ** -- Lark ユーザーはワンクリックでデプロイでき、サーバーの構築が不要
- **チームが Lark を使っている** -- OpenClaw は Lark と深く統合されており、メッセージのストリーミング生成やグループチャットでの @bot などの体験がスムーズ
- **24 時間 365 日オンラインが必要** -- OpenClaw はクラウドにデプロイされ、ローカル PC の状態に影響されない
- **コミュニティエコシステムを重視** -- OpenClaw は最大の Skills コミュニティを持ち、NocoBase 以外にも多数のスキルが利用可能

## 接続の仕組み

OpenClaw は以下の方法で NocoBase と連携します：

```
あなた（Lark / Telegram / ...）
  │
  └─→ OpenClaw Agent
        │
        ├── NocoBase Skills（Agent が NocoBase の設定体系を理解するためのナレッジ）
        │
        └── NocoBase CLI（作成、変更、デプロイなどの操作を実行）
              │
              └─→ NocoBase サービス（あなたのビジネスシステム）
```

- **NocoBase Skills** -- ドメインナレッジパッケージ。OpenClaw が NocoBase の操作方法を理解できるようにする
- **NocoBase CLI** -- コマンドラインツール。データモデリング、ページ構築などの操作を実際に実行
- **NocoBase サービス** -- 稼働中の NocoBase インスタンス

## 前提条件

始める前に、以下の環境を準備してください：

- デプロイ済みの OpenClaw Agent（[Lark ワンクリックデプロイ](https://openclaw.feishu.cn) またはローカルデプロイ）
- Node.js >= 22（NocoBase CLI と Skills の実行に必要）
- 既存の NocoBase インスタンスがある場合、**AI 機能は急速に進化しているため、現時点では beta 最新版のみが完全な体験をサポートしています。最低バージョン要件は >= 2.1.0-beta.20 で、最新版への更新を強くお勧めします。**

:::warning 注意

サードパーティの Skills をインストールする際はセキュリティに注意してください。公式または信頼できるソースの Skills を優先的に使用し、未審査のコミュニティスキルのインストールは避けてください。

:::

## クイックスタート

### ワンクリック AI インストール

以下のプロンプトを OpenClaw にコピーしてください。NocoBase CLI のインストール、初期化、環境設定を自動的に完了します：

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

<!-- TODO: 5-8 個のよくある質問を整理。例：Skills のインストールに失敗した場合の対処法、Skills のバージョン更新方法、OpenClaw がサポートするモデル、操作エラー時のロールバック方法など -->

## 関連リンク

- [NocoBase CLI](../quick-start.md) -- NocoBase のインストールと管理用コマンドラインツール
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) -- AI Agent にインストール可能なドメインナレッジパッケージ
- [AI 構築クイックスタート](../../ai-builder/index.md) -- AI でゼロから NocoBase アプリケーションを構築
- [OpenClaw Lark デプロイガイド](https://openclaw.feishu.cn) -- OpenClaw を Lark にワンクリックデプロイ
- [Hermes Agent + NocoBase](../hermes-agent/index.md) -- スキルを自動蓄積し、使うほどあなたのビジネスシステムを理解
- [WorkBuddy + NocoBase](../workbuddy/index.md) -- 企業微信、Lark、DingTalk のマルチプラットフォームから NocoBase をリモート操作
