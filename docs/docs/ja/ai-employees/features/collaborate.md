---
pkg: '@nocobase/plugin-ai'
title: 'AI 従業員と協働する'
description: 'AI 従業員との協働: 右下のメイン入口、ブロック Action 入口、チャット操作、会話内での従業員とモデルの切り替え。'
keywords: 'AI 従業員 協働,チャットパネル,従業員切り替え,モデル切り替え,NocoBase'
---

# AI 従業員と協働する

AI 従業員を作成して有効化すると、ページ上で協働できます。

## 入口

1. **右下のメイン入口**: 業務ページ右下から AI チャットパネルを開きます。一般的な質問やブロックをまたぐ協働に適しています。
2. **ブロック Action 入口**: `Actions` をサポートするブロックでは、`Actions -> AI employees` から AI 従業員を追加できます。フォームブロックの入力など、現在のブロックに対するタスクに適しています。
3. **特定入口**: Nathan、Lina、Dara などの開発系従業員は、JS ブロック、チャートブロック、Localization Management など特定の場面で専用入口を提供します。

### 右下のメイン入口

![20260331165456](https://static-docs.nocobase.com/20260331165456.png)

### ブロック Action 入口

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

### 特定入口

![](https://static-docs.nocobase.com/202605121057862.png)

## チャットの基本操作

チャットパネルでは、メッセージ送信、添付ファイルのアップロード、履歴の表示、新規チャット作成、システムプロンプト編集などの一般的な操作ができます。

## 会話内での切り替え

多くの場合は Atlas と直接会話すれば、Atlas が適切な AI 従業員を調整してタスクを処理します。

特定の AI 従業員を使う場合は、送信欄の AI 従業員ドロップダウンをクリックして選択します。

![20260331174320](https://static-docs.nocobase.com/20260331174320.png)

モデルの設定は従業員ごとに保存され、次回優先的に復元されます。

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)
