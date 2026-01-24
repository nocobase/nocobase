---
pkg: '@nocobase/plugin-verification'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# 認証：SMS

## はじめに

SMS認証コードは、ワンタイムパスワード (OTP) を生成し、SMSでユーザーに送信するための組み込みの認証タイプです。

## SMS認証器を追加する

認証管理ページに移動します。

![](https://static-docs.nocobase.com/202502271726791.png)

追加 - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## 管理者設定

![](https://static-docs.nocobase.com/202502271727711.png)

現在サポートされているSMSサービスプロバイダーは以下の通りです。

- <a href="https://www.aliyun.com/product/sms" target="_blank">アリババクラウドSMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">テンセントクラウドSMS</a>

サービスプロバイダーの管理画面でSMSテンプレートを設定する際は、SMS認証コード用にパラメーターを予約する必要があります。

- アリババクラウドの設定例：`あなたの認証コードは：${code}`

- テンセントクラウドの設定例：`あなたの認証コードは：{1}`

開発者は、プラグインとして他のSMSサービスプロバイダーを拡張することもできます。参照：[SMSサービスプロバイダーの拡張](./dev/sms-type)

## ユーザーの紐付け

認証器を追加した後、ユーザーは個人の認証管理で認証用の携帯電話番号を紐付けることができます。

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

紐付けが成功すると、この認証器が紐付けられた認証シナリオで認証を行うことができます。

![](https://static-docs.nocobase.com/202502271739607.png)

## ユーザーの紐付け解除

携帯電話番号の紐付けを解除するには、既に紐付けられている認証方法を通じて認証を行う必要があります。

![](https://static-docs.nocobase.com/202502282103205.png)