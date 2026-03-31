:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# FlowModel 対 React.Component

## 基本的な役割の比較

| 機能・能力         | `React.Component`       | `FlowModel`                            |
| ------------- | ----------------------- | -------------------------------------- |
| レンダリング機能          | はい、`render()` メソッドでUIを生成します。    | はい、`render()` メソッドでUIを生成します。                   |
| 状態管理          | 組み込みの `state` と `setState` を使用します。 | `props` を使用しますが、状態管理はモデルツリー構造に強く依存します。               |
| ライフサイクル          | はい、`componentDidMount` などがあります。 | はい、`onInit`、`onMount`、`onUnmount` などがあります。     |
| 用途            | UIコンポーネントの構築                | データ駆動型で、フローベースの構造化された「モデルツリー」の構築                   |
| データ構造          | コンポーネントツリー                     | モデルツリー（親子モデル、複数インスタンスのForkをサポート）                   |
| 子コンポーネント           | JSXを使用してコンポーネントをネストします。             | `setSubModel`/`addSubModel` を使用して子モデルを明示的に設定します。 |
| 動的な振る舞い          | イベントバインディング、状態更新によるUI駆動          | フローの登録/ディスパッチ、自動フローの処理                      |
| 永続化           | 組み込みのメカニズムはありません。                   | 永続化をサポートします（例：`model.save()`）。                |
| Fork（複数回レンダリング）のサポート | いいえ（手動での再利用が必要です）                | はい（`createFork` による複数インスタンス化）                   |
| エンジン制御          | なし                       | はい、`FlowEngine` によって管理、登録、ロードされます。              |

## ライフサイクルの比較

| ライフサイクルフック | `React.Component`                 | `FlowModel`                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| 初期化    | `constructor`、`componentDidMount` | `onInit`、`onMount`                           |
| アンマウント     | `componentWillUnmount`            | `onUnmount`                                  |
| 入力への応答   | `componentDidUpdate`              | `onBeforeAutoFlows`、`onAfterAutoFlows` |
| エラー処理   | `componentDidCatch`               | `onAutoFlowsError`                      |

## 構築構造の比較

**React：**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel：**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## コンポーネントツリー 対 モデルツリー

*   **Reactコンポーネントツリー**：実行時にJSXのネストによって形成されるUIレンダリングツリーです。
*   **FlowModelモデルツリー**：`FlowEngine`によって管理される論理構造ツリーで、永続化が可能であり、子モデルの動的な登録と制御ができます。ページブロック、操作フロー、データモデルなどの構築に適しています。

## 特殊機能（FlowModel固有）

| 機能                               | 説明                     |
| -------------------------------- | ---------------------- |
| `registerFlow`                 | フローの登録             |
| `applyFlow` / `dispatchEvent` | フローの実行/トリガー             |
| `setSubModel` / `addSubModel`         | 子モデルの作成とバインディングを明示的に制御します。          |
| `createFork`                          | 1つのモデルロジックを複数回レンダリングして再利用することをサポートします（例：テーブルの各行）。 |
| `openFlowSettings`                    | フローのステップ設定 |
| `save` / `saveStepParams()`           | モデルを永続化し、バックエンドと連携できます。           |

## まとめ

| 項目   | React.Component | FlowModel              |
| ---- | --------------- | ---------------------- |
| 適したシナリオ | UI層のコンポーネント構成        | データ駆動型のフローとブロック管理           |
| コア思想 | 宣言的UI          | モデル駆動型の構造化フロー             |
| 管理方法 | Reactがライフサイクルを制御    | FlowModelがモデルのライフサイクルと構造を制御 |
| 利点   | 豊富なエコシステムとツールチェーン        | 強力な構造化、フローの永続化、子モデルの制御が可能      |

> FlowModelはReactと補完的に使用できます。FlowModel内でReactを使用してレンダリングを行い、そのライフサイクルと構造は`FlowEngine`によって管理されます。