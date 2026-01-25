:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 概要

ワークフローは通常、複数の操作ステップが連結されて構成されています。各ノードは1つの操作ステップを表し、プロセスにおける基本的な論理単位です。プログラミング言語と同様に、ノードの種類によって異なる命令が割り当てられ、ノードの動作が決定されます。ワークフローが実行されると、システムは各ノードに順番に入り、その命令を実行します。

:::info{title=ヒント}
ワークフローのトリガーはノードではありません。フローチャート上ではエントリーポイントのノードとして表示されますが、ノードとは異なる概念です。詳細については、[トリガー](../triggers/index.md)のコンテンツをご参照ください。
:::

機能的な観点から、現在実装されているノードはいくつかの主要なカテゴリに分類できます（全29種類のノード）。

- 人工知能
  - [大規模言語モデル](../../ai-employees/workflow/nodes/llm/chat.md)（@nocobase/plugin-workflow-llm プラグインが提供）
- フロー制御
  - [条件判断](./condition.md)
  - [複数条件分岐](./multi-conditions.md)
  - [ループ](./loop.md)（@nocobase/plugin-workflow-loop プラグインが提供）
  - [変数](./variable.md)（@nocobase/plugin-workflow-variable プラグインが提供）
  - [並行分岐](./parallel.md)（@nocobase/plugin-workflow-parallel プラグインが提供）
  - [ワークフロー呼び出し](./subflow.md)（@nocobase/plugin-workflow-subflow プラグインが提供）
  - [ワークフロー出力](./output.md)（@nocobase/plugin-workflow-subflow プラグインが提供）
  - [JSON変数マッピング](./json-variable-mapping.md)（@nocobase/plugin-workflow-json-variable-mapping プラグインが提供）
  - [遅延](./delay.md)（@nocobase/plugin-workflow-delay プラグインが提供）
  - [ワークフロー終了](./end.md)
- 計算
  - [計算](./calculation.md)
  - [日付計算](./date-calculation.md)（@nocobase/plugin-workflow-date-calculation プラグインが提供）
  - [JSON計算](./json-query.md)（@nocobase/plugin-workflow-json-query プラグインが提供）
- コレクション操作
  - [データ作成](./create.md)
  - [データ更新](./update.md)
  - [データ削除](./destroy.md)
  - [データ照会](./query.md)
  - [集計クエリ](./aggregate.md)（@nocobase/plugin-workflow-aggregate プラグインが提供）
  - [SQL操作](./sql.md)（@nocobase/plugin-workflow-sql プラグインが提供）
- 手動処理
  - [手動処理](./manual.md)（@nocobase/plugin-workflow-manual プラグインが提供）
  - [承認](./approval.md)（@nocobase/plugin-workflow-approval プラグインが提供）
  - [CC](./cc.md)（@nocobase/plugin-workflow-cc プラグインが提供）
- その他の拡張
  - [HTTPリクエスト](./request.md)（@nocobase/plugin-workflow-request プラグインが提供）
  - [JavaScript](./javascript.md)（@nocobase/plugin-workflow-javascript プラグインが提供）
  - [メール送信](./mailer.md)（@nocobase/plugin-workflow-mailer プラグインが提供）
  - [通知](../../notification-manager/index.md#ワークフロー通知ノード)（@nocobase/plugin-workflow-notification プラグインが提供）
  - [応答](./response.md)（@nocobase/plugin-workflow-webhook プラグインが提供）
  - [応答メッセージ](./response-message.md)（@nocobase/plugin-workflow-response-message プラグインが提供）