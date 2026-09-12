# カスタムリクエスト

## 紹介

フローで外部インターフェースやサードパーティサービスを呼び出す必要がある場合、Custom request を使用してカスタム HTTP リクエストを発行できます。主な使用シーンは以下の通りです：

* 外部システム API の呼び出し（CRM、AI サービスなど）
* リモートデータを取得し、後続のフローステップで処理
* サードパーティシステムへのデータ送信（Webhook、メッセージ通知など）
* 内部または外部サービスの自動化フローのトリガー

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_07_PM.png)


## 操作設定

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_09_PM.png)

「ボタン設定 -> カスタムリクエスト」で、以下の内容を設定できます：

* HTTP method：HTTP リクエストメソッド。例：GET、POST、PUT、DELETE など。
* URL：リクエストの送信先アドレス。完全なインターフェース URL を入力するか、変数で動的に組み立てることができます。
* Headers：リクエストヘッダー情報。認証情報やインターフェース設定の送信に使用します。例：Authorization、Content-Type など。
* Parameters：URL クエリパラメータ（Query Parameters）。通常 GET リクエストで使用します。
* Body：リクエストボディ。通常 POST、PUT などのリクエストで使用し、JSON やフォームデータなどを記述できます。
* Timeout config：リクエストタイムアウト時間の設定。リクエストの最大待ち時間を制限し、フローが長時間ブロックされることを防ぎます。
* Response type：リクエストレスポンスのデータタイプ。
* JSON：インターフェースが JSON データを返します。返却結果はフローコンテキストに注入され、後続のステップで ctx.steps を通じて取得できます。
* Stream：インターフェースがデータストリーム（Stream）を返します。リクエスト成功後、ファイルのダウンロードが自動的にトリガーされます。
* Access control：アクセス制御。どのロールがこのリクエストステップをトリガーできるかを制限し、インターフェース呼び出しのセキュリティを確保します。

## その他の操作設定項目

リクエスト設定以外に、カスタムリクエストボタンは以下の一般的な設定もサポートしています：

- [ボタンの編集](/interface-builder/actions/action-settings/edit-button)：ボタンのタイトル、スタイル、アイコンなどを設定します。
- [操作連動ルール](/interface-builder/actions/action-settings/linkage-rule)：条件に基づいてボタンの表示/非表示、無効化などの状態を動的に制御します。
- [二次確認](/interface-builder/actions/action-settings/double-check)：クリック後にまず確認ダイアログを表示し、確認後にリクエストを送信します。
