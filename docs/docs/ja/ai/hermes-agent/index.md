---
title: "Hermes Agent：使うほど賢くなる NocoBase アシスタント"
description: "Hermes Agent を NocoBase に接続し、クロスセッション記憶と自動スキル蓄積により、AI がますますあなたのビジネスシステムを理解するようにします。"
keywords: "Hermes Agent,NocoBase,AI Agent,Nous Research,Skills,自動学習,セルフホスト"
sidebar: false
---

:::warning 注意

本ページの内容はまだ執筆中です。一部のセクションは不完全または変更される可能性があります。

:::

# Hermes Agent：使うほど賢くなる NocoBase アシスタント

[Hermes Agent](https://github.com/nousresearch/hermes-agent) はセルフホスト型のオープンソース AI Agent です。成功した操作を自動的に再利用可能なスキルドキュメントとして蓄積し、使えば使うほどあなたのシステムを理解するようになります。NocoBase に接続すれば、自然言語でシステムの構築・管理ができるだけでなく、あなたのビジネス慣行や好みを段階的に学習させることができます。

<!-- Hermes Agent が NocoBase を操作しているターミナルまたは Lark の対話スクリーンショットが必要 -->

## Hermes Agent とは

Hermes Agent は Nous Research が開発した AI Agent です（GitHub 35.7k Star）。コアコンセプトは「使えば使うほど賢くなる」ことです。他の AI Agent とは異なり、Hermes には完全なクローズドループ学習メカニズムがあります：

- **クロスセッション記憶** -- 全文検索と LLM サマリーにより、数週間前の対話コンテキストまで遡れる
- **自動スキル蓄積** -- 複雑なタスクが成功するたびに、再利用可能なスキルドキュメントを自動作成
- **継続的な自己改善** -- スキルは繰り返し使用される中で最適化され、使うほど精度が向上
- **400 以上のモデルサポート** -- 主要な LLM プロバイダーに対応し、特定のモデルに縛られない

Hermes は Lark、Telegram、Discord、Slack など 8 つのプラットフォームをサポートしており、ターミナルで直接使用することもできます。

:::tip ヒント

Hermes Agent はあなた自身のサーバー上で動作し、すべてのデータと記憶はローカルに保存されます。データセキュリティの要件が高いシーンに適しています。

:::

## Hermes Agent を選ぶ理由

NocoBase を操作する AI Agent を選ぶ際に、Hermes が最適なシーンは以下の通りです：

- **同じシステムを長期メンテナンスする** -- Hermes の記憶メカニズムにより、使うほどあなたのビジネスを理解し、毎回コンテキストを説明し直す必要がない
- **チームにセルフホスト要件がある** -- データは完全にローカルに保存され、サードパーティのクラウドサービスを経由しない
- **操作フローの標準化が必要** -- Hermes が自動蓄積するスキルドキュメントは、チームの操作マニュアルとしても活用可能
- **ターミナル操作を好む** -- Hermes はネイティブで CLI インタラクションをサポートしており、技術チームの日常利用に適している

## 接続の仕組み

Hermes Agent は以下の方法で NocoBase と連携します：

```
あなた（Lark / Telegram / ターミナル / ...）
  │
  └─→ Hermes Agent
        │
        ├── NocoBase Skills（Agent が NocoBase の設定体系を理解するためのナレッジ）
        │
        ├── NocoBase CLI（作成、変更、デプロイなどの操作を実行）
        │
        └── 記憶 & スキルドキュメント（自動蓄積、継続的に再利用）
              │
              └─→ NocoBase サービス（あなたのビジネスシステム）
```

他の Agent と異なり、Hermes は操作のたびに自身の記憶とスキルドキュメントを更新します。これらの情報はローカルに保存され、以降の操作で自動的に再利用されます。

## 前提条件

始める前に、以下の環境を準備してください：

- Hermes Agent を実行するサーバー（Linux / macOS、Python 3.10+）
- Node.js >= 22（NocoBase CLI と Skills の実行に必要）
- 既存の NocoBase インスタンスがある場合、**AI 機能は急速に進化しているため、現時点では beta 最新版のみが完全な体験をサポートしています。最低バージョン要件は >= 2.1.0-beta.20 で、最新版への更新を強くお勧めします。**

Hermes のインストールはコマンド 1 行で完了します：

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

:::warning 注意

Hermes Agent は自分でデプロイ・メンテナンスする必要があります。設定不要ですぐに使いたい場合は、[OpenClaw](../openclaw/index.md)（Lark ワンクリックデプロイ）や [WorkBuddy](../workbuddy/index.md)（Tencent ホスティング）をご検討ください。

:::

## クイックスタート

### ワンクリック AI インストール

以下のプロンプトを Hermes Agent にコピーしてください。NocoBase CLI のインストール、初期化、環境設定を自動的に完了します：

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

<!-- TODO: 5-8 個のよくある質問を整理。例：記憶ファイルの保存場所、新しいサーバーへの移行方法、サポートされるモデル、誤った記憶の消去方法、Hermes と OpenClaw の違いなど -->

## 関連リンク

- [NocoBase CLI](../quick-start.md) -- NocoBase のインストールと管理用コマンドラインツール
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) -- AI Agent にインストール可能なドメインナレッジパッケージ
- [AI 構築クイックスタート](../../ai-builder/index.md) -- AI でゼロから NocoBase アプリケーションを構築
- [Hermes Agent GitHub](https://github.com/nousresearch/hermes-agent) -- Hermes Agent のソースコードとドキュメント
- [OpenClaw + NocoBase](../openclaw/index.md) -- 世界で最も人気のあるオープンソース AI Agent、Lark でワンクリックデプロイ
- [WorkBuddy + NocoBase](../workbuddy/index.md) -- 企業微信、Lark、DingTalk のマルチプラットフォームから NocoBase をリモート操作
