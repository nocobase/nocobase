---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# メール送信

## 概要

メールを送信するための機能です。テキスト形式とHTML形式の両方のメールコンテンツに対応しています。

## ノードの作成

ワークフローの構成画面で、フロー内のプラス（「+」）ボタンをクリックし、「メール送信」ノードを追加します。

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## ノードの設定

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

各オプションでは、ワークフローのコンテキストにある変数を使用できます。機密情報については、グローバル変数やシークレットも利用可能です。

## よくある質問

### Gmailの送信頻度制限

一部のメール送信時に、以下のエラーが発生する場合があります。

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

これは、Gmailが送信ドメインが指定されていないリクエストに対して頻度制限を設けているためです。アプリケーションをデプロイする際に、サーバーのホスト名をGmailに紐付けられた送信ドメインとして設定する必要があります。例えば、Dockerでデプロイする場合：

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # 設定済みの送信ドメインを指定
```

参考：[Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)