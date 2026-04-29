---
title: "手放しで WorkBuddy が NocoBase を駆動"
description: "テンセント WorkBuddy を通じて NocoBase をリモート操作。企業微信、飛書、釘釘など複数のプラットフォームに対応。"
keywords: "WorkBuddy,NocoBase,AI Agent,テンセント,企業微信,飛書,釘釘,リモート操作"
sidebar: false
---

:::warning 作成中

このページの内容はまだ作成中です。一部のセクションが不完全であったり、変更される可能性があります。

:::

# 手放しで WorkBuddy が NocoBase を駆動

[WorkBuddy](https://www.codebuddy.cn) はテンセントが提供するオールシーン職場 AI エージェントです。一言で要件を伝えるだけで、自律的にステップを計画し実行します。NocoBase に接続すれば、企業微信、飛書、釘釘などのプラットフォームからビジネスシステムをリモート操作でき、ブラウザを開かなくても日常の管理操作を完了できます。

<!-- WorkBuddy が企業微信で NocoBase を操作している会話のスクリーンショットが必要 -->

## WorkBuddy とは

WorkBuddy はテンセントが提供する「オールシーン職場 AI エージェントデスクトップワークステーション」です。通常の AI チャットツールとは異なり、WorkBuddy はタスクを受け取ると自動的に分解・計画・実行し、最終的に検収可能な結果を納品します——一つ一つ指示する必要はありません。

主な特徴：

- **自律的な計画と実行**——タスクを受け取ると自動的にステップを分解し、順番に実行して完全な結果を納品
- **マルチプラットフォーム対応**——企業微信、飛書、釘釘、QQ など中国の主要なオフィスプラットフォームに対応
- **20 以上の組み込みスキル**——ドキュメント生成、データ分析、PPT 作成、メール編集などがすぐに使える
- **ローカルファイル操作**——承認されたローカルファイルの読み取りと処理が可能

簡単に言えば、従来の AI ツールはアドバイスを提供してあなたが手を動かす必要がありましたが、WorkBuddy はあなたの代わりに作業を完了します。

| 従来の AI チャット     | WorkBuddy              |
| -------------------- | ---------------------- |
| 会話のみ、アドバイスを提供 | 実際にタスクを実行できる    |
| ファイル操作は手動       | ローカルファイルを自動操作   |
| 単一ステップの単純なタスク | 複数ステップの複雑なタスクを自動分解 |
| テキスト回答を出力       | 検収可能な結果を納品        |

## なぜ WorkBuddy を選ぶのか

NocoBase を操作する AI Agent を選ぶ際、WorkBuddy が最も適しているシーン：

- **チームが企業微信 / 飛書 / 釘釘を使用している**——WorkBuddy は中国の最も幅広いオフィスプラットフォームに対応し、カバー範囲が最大
- **モバイルから NocoBase を操作したい**——外出先からいつでもシステムを管理でき、デバイスの制約なし
- **すぐに使い始めたい**——テンセント製品で 20 以上のスキルが組み込まれており、設定のハードルが低い
- **タスク自動化を重視する**——WorkBuddy は複数ステップのタスクを自動的に分解・実行するのが得意で、日常の運用管理に最適

## 接続の仕組み

WorkBuddy は以下の方法で NocoBase と連携します：

```
あなた（企業微信 / 飛書 / 釘釘 / ...）
  │
  └─→ WorkBuddy
        │
        ├── NocoBase Skills（Agent に NocoBase の設定体系を理解させる）
        │
        └── NocoBase CLI（作成・変更・デプロイなどの操作を実行）
              │
              └─→ NocoBase サービス（あなたのビジネスシステム）
```

対応プラットフォーム上で指示を送ると、WorkBuddy がバックエンドで Skills と CLI を通じて NocoBase を操作し、結果をリアルタイムであなたのチャットウィンドウにプッシュします。

## 前提条件

始める前に、以下の環境を準備してください：

- WorkBuddy アカウント（[登録ページ](https://www.codebuddy.cn)）
- Node.js >= 22（NocoBase CLI と Skills の実行に必要）
- 既存の NocoBase インスタンスがある場合、**AI 機能は急速に進化しているため、現時点では beta 最新版のみ完全な体験をサポートしています。最低バージョン要件は >= 2.1.0-beta.20 で、最新版への更新を強く推奨します。**

:::warning 注意

WorkBuddy は現在急速にイテレーション中で、一部の機能が変更される可能性があります。最新情報は [WorkBuddy 公式ドキュメント](https://www.codebuddy.cn/docs/workbuddy/Overview) を確認してください。

:::

## クイックスタート

### ワンクリック AI インストール

以下のプロンプトを WorkBuddy にコピーすると、NocoBase CLI のインストール、初期化、環境設定を自動的に完了します：

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

<!-- TODO: 5-8 個のよくある質問を整理。例：WorkBuddy が対応しているプラットフォーム、無料枠の量、操作失敗時の対処法、複数人が同じ WorkBuddy で同一の NocoBase を操作できるかなど -->

## 関連リンク

- [NocoBase CLI](../quick-start.md) — NocoBase をインストール・管理するコマンドラインツール
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — AI Agent にインストールできるドメイン知識パッケージ
- [AI ビルド クイックスタート](../../ai-builder/index.md) — AI でゼロから NocoBase アプリを構築
- [WorkBuddy 公式ドキュメント](https://www.codebuddy.cn/docs/workbuddy/Overview) — WorkBuddy の完全な使用ガイド
- [OpenClaw + NocoBase](../openclaw/index.md) — 世界で最も人気のあるオープンソース AI Agent、飛書でワンクリックデプロイ
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — スキルを自動蓄積し、使うほどビジネスシステムを理解する
