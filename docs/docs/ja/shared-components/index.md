---
title: "共通コンポーネント"
description: "NocoBase client v2 の共通コンポーネント：フォームコンテナ、フォームフィールド、フィルター、テーブル、アイコン。"
keywords: "client-v2,shared components,React,Antd,NocoBase"
---

# 共通コンポーネント

NocoBase client v2 には共通コンポーネントが組み込まれています。プラグインページ、設定ページ、フォームを作るときに直接利用でき、NocoBase が用意している UI と操作を再利用できます。

このセクションでは、利用シーンごとにコンポーネントを整理しています。各ページでは 1 つのコンポーネントだけを扱い、適した場面、よく使う API、ドキュメント内でプレビューできるかを説明します。

## クイックインデックス

| やりたいこと | 参照先 |
| --- | --- |
| 低レベルの全画面スキャナーを制御する | [CodeScanner](./form/code-scanner) |
| dialog に標準フォームを配置する | [DialogFormLayout](./form/dialog-form-layout) |
| drawer に標準フォームを配置する | [DrawerFormLayout](./form/drawer-form-layout) |
| `$env` 環境変数だけを選択できるようにする | [EnvVariableInput](./form/env-variable-input) |
| ファイルサイズを入力し、バイト数として保存する | [FileSizeInput](./form/file-size-input) |
| JSON / JSON5 設定を編集する | [JsonTextArea](./form/json-text-area) |
| 強度表示付きでパスワードを入力する | [PasswordInput](./form/password-input) |
| API から Select オプションを非同期に読み込む | [RemoteSelect](./form/remote-select) |
| 入力欄にスキャン機能を追加する | [ScanInput](./form/scan-input) |
| フィールドで定数と変数の両方を受け付ける | [TypedVariableInput](./form/typed-variable-input) |
| 単一行フィールドで `{{ $env.X }}` や `{{ $user.name }}` のような変数を使えるようにする | [VariableInput](./form/variable-input) |
| JSON / JSON5 設定に変数を挿入する | [VariableJsonTextArea](./form/variable-json-text-area) |
| 複数行テキストで変数を使えるようにする | [VariableTextArea](./form/variable-text-area) |
| 複数条件で Collection をフィルターする | [CollectionFilter](./filter/) |
| Collection フィルターパネルをページに埋め込む | [CollectionFilterPanel](./filter/collection-filter-panel) |
| antd Table のドラッグ可能な行をカスタマイズする | [SortableRow](./table/sortable-row) |
| Table のドラッグハンドル列をカスタマイズする | [SortHandle](./table/sort-handle) |
| 設定ページで一覧表示、行選択、ドラッグソートを行う | [Table](./table/) |
| Ant Design アイコンを使う、またはカスタムアイコンを登録する | [Icon](./icon) |
| プラグイン拡張項目用の内部レジストリを作成する | [createFormRegistry](./create-form-registry) |

## 使用方法

クライアントプラグインで必要なコンポーネントをインポートし、通常の React コンポーネントと同じように使います：

```tsx
import { RemoteSelect, Table } from '@nocobase/client-v2';

function SettingsPage() {
  return (
    <>
      <RemoteSelect request={loadOptions} />
      <Table rowKey="id" columns={columns} dataSource={records} />
    </>
  );
}
```

## 使い分け

基本は React + Antd で十分です。NocoBase プラグインで次のような場面に出会ったら、まずこれらのコンポーネントを確認してください：

- 設定ページで drawer / dialog フォームを開く
- フォームフィールドで変数の挿入、JSON 編集、ファイルサイズ入力、コードスキャンを行う
- 一覧ページで Collection フィルターやドラッグソートを使う
- NocoBase の統一アイコン入口を使う

通常の入力欄、ボタン、メッセージであれば、Antd コンポーネントを直接使う方が分かりやすいです。

## 関連リンク

- [Component コンポーネント開発](../plugin-development/client/component/index.md)
- [Context → よく使う機能](../plugin-development/client/ctx/common-capabilities.md)
- [FlowEngine](../flow-engine/index.md)
