---
title: "Component vs FlowModel"
description: "NocoBase 開発選択ガイド：普通の React コンポーネントを使うべきか、FlowModel を使うべきか。機能の違い、ライフサイクルの比較、シーンごとの選択方法。"
keywords: "Component,FlowModel,選択ガイド,React コンポーネント,ビジュアル設定,モデルツリー,NocoBase"
---

# Component vs FlowModel

NocoBase のプラグイン開発では、フロントエンド UI を書く方法が2つあります：**普通の React コンポーネント**と **[FlowModel](../../flow-engine/index.md)** です。両者は互いに置き換えるものではなく、FlowModel は React コンポーネントの上に位置する抽象レイヤーで、コンポーネントにビジュアル設定の機能を付加します。

通常、長く迷う必要はありません。自分にこう問いかけてみてください：

> **このコンポーネントは NocoBase の「ブロックの追加 / フィールド / 操作」メニューに表示して、ユーザーが画面上でビジュアル設定できるようにする必要がありますか？**

- **いいえ** → 普通の React コンポーネントを使ってください。標準的な React 開発です
- **はい** → FlowModel でラップしてください

## デフォルトの選択：React コンポーネント

ほとんどのプラグインシーンでは、普通の React コンポーネントで十分です。例えば：

- 独立したページの登録（プラグイン設定ページ、カスタムルートページ）
- ダイアログ、フォーム、リストなどの内部コンポーネント
- ユーティリティ的な UI コンポーネントのカプセル化

これらのシーンでは、React + Antd でコンポーネントを書き、`useFlowContext()` で NocoBase のコンテキスト機能（リクエスト送信、国際化など）を取得します。普通のフロントエンド開発と変わりません。

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MySettingsPage() {
  const ctx = useFlowContext();

  return (
    <div>
      <h2>{ctx.t('Plugin settings')}</h2>
      {/* 普通の React コンポーネント。FlowModel は不要 */}
    </div>
  );
}
```

詳しい使い方は [Component コンポーネント開発](./component/index.md)をご覧ください。

## いつ FlowModel を使うか

コンポーネントが以下の条件を満たす必要がある場合、FlowModel を使います：

1. **メニューに表示する**：ユーザーが「ブロックの追加」「フィールドの追加」「操作の追加」メニューから追加できるようにする
2. **ビジュアル設定をサポートする**：ユーザーが画面上の設定項目をクリックしてコンポーネントのプロパティを変更できる（タイトルの変更、表示モードの切り替えなど）
3. **設定の永続化が必要**：ユーザーの設定を保存し、次回ページを開いた時にも反映される

簡単に言えば、FlowModel は「コンポーネントを設定可能にし、永続化する」という課題を解決します。これらの機能が不要なら、FlowModel を使う必要はありません。

## 両者の関係

FlowModel は React コンポーネントを「置き換える」ためのものではありません。React コンポーネントの上に位置する抽象レイヤーです：

```
React コンポーネント：UI のレンダリングを担当
    ↓ ラッピング
FlowModel：props のソース管理、設定パネル、設定の永続化
```

FlowModel の `render()` メソッドの中身は、普通の React コードです。違いは、普通のコンポーネントの props はハードコードされるか親コンポーネントから渡されるのに対し、FlowModel の props は Flow（設定フロー）によって動的に生成される点です。

実際のところ、基本的な構造はよく似ています：

```tsx pure
// React コンポーネント
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}

// FlowModel
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

ただし管理方法は全く異なります。React コンポーネントは JSX のネストにより**コンポーネントツリー**を形成します — これはランタイムの UI レンダリングツリーです。一方、FlowModel は [FlowEngine](../../flow-engine/index.md) によって管理され、**モデルツリー**を形成します — 永続化可能で動的に登録できる論理構造のツリーです。`setSubModel` / `addSubModel` で親子関係を明示的に制御し、ページブロック、操作フロー、データモデルなど設定管理が必要な構造の構築に適しています。

## 機能比較

より技術的な観点から両者の違いを見てみます：

| 機能 | React コンポーネント | FlowModel |
| --- | --- | --- |
| UI レンダリング | `render()` | `render()` |
| 状態管理 | 組み込み `state` / `setState` | `props` とモデルツリー構造で管理 |
| ライフサイクル | `constructor`、`componentDidMount`、`componentWillUnmount` | `onInit`、`onMount`、`onUnmount` |
| 入力変更への応答 | `componentDidUpdate` | `onBeforeAutoFlows`、`onAfterAutoFlows` |
| エラー処理 | `componentDidCatch` | `onAutoFlowsError` |
| 子コンポーネント | JSX ネスト | `setSubModel` / `addSubModel` で明示的に子モデルを設定 |
| 動的な振る舞い | イベントバインディング、状態更新 | Flow の登録とディスパッチ |
| 永続化 | 組み込み機構なし | `model.save()` など、バックエンドと連携 |
| 複数インスタンスの再利用 | 手動で処理が必要 | `createFork` — テーブルの各行など |
| エンジン管理 | なし | FlowEngine が統一的に登録・読み込み・管理 |

React のライフサイクルに慣れていれば、FlowModel のライフサイクルは簡単にマッピングできます — `onInit` は `constructor` に、`onMount` は `componentDidMount` に、`onUnmount` は `componentWillUnmount` に対応します。

また、FlowModel は React コンポーネントにはない以下の機能も提供します：

- **`registerFlow`** — Flow を登録し、設定フローを定義
- **`applyFlow` / `dispatchEvent`** — Flow の実行またはトリガー
- **`openFlowSettings`** — Flow ステップの設定パネルを開く
- **`save` / `saveStepParams()`** — モデル設定の永続化
- **`createFork`** — 1つのモデルロジックを複数回レンダリング（テーブルの各行など）

これらの機能は「ビジュアル設定」体験を支える基盤です。ビジュアル設定を伴わないシーンでは、これらを気にする必要はありません。詳しい使い方は [FlowEngine 完全ドキュメント](../../flow-engine/index.md)をご覧ください。

## シーン別ガイド

| シーン | 方法 | 理由 |
| --- | --- | --- |
| プラグイン設定ページ | React コンポーネント | 独立したページで、設定メニューに表示する必要がない |
| ユーティリティダイアログ | React コンポーネント | 内部コンポーネントで、ビジュアル設定が不要 |
| カスタムデータテーブルブロック | FlowModel | 「ブロックの追加」メニューに表示し、ユーザーがデータソースを設定できるようにする |
| カスタムフィールド表示コンポーネント | FlowModel | フィールド設定に表示し、ユーザーが表示方法を選択できるようにする |
| カスタム操作ボタン | FlowModel | 「操作の追加」メニューに表示する |
| ブロック用のチャートコンポーネントをカプセル化 | React コンポーネント | チャート自体は内部コンポーネントで、FlowModel のブロックから呼び出される |

## 段階的な導入

迷ったときは、まず React コンポーネントで機能を実装してください。ビジュアル設定の機能が必要だと確認できたら、FlowModel でラップします — これが推奨される段階的なアプローチです。大きな部分は FlowModel で管理し、内部の詳細は React コンポーネントで実装する。両者を組み合わせて使います。

## 関連リンク

- [Component コンポーネント開発](./component/index.md) — React コンポーネントの書き方と useFlowContext の使い方
- [FlowEngine 概要](./flow-engine/index.md) — FlowModel の基本的な使い方と registerFlow
- [FlowEngine 完全ドキュメント](../../flow-engine/index.md) — FlowModel、Flow、Context の完全リファレンス
