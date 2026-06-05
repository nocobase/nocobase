---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# 認証：WeCom

## はじめに

**WeCom**プラグインを使うと、WeComアカウントでNocoBaseにログインできるようになります。

## プラグインを有効にする

![](https://static-docs.nocobase.com/202406272056962.png)

## WeComのカスタムアプリケーションを作成・設定する

WeCom管理コンソールにアクセスし、カスタムアプリケーションを作成します。

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

アプリケーションをクリックして詳細ページを開き、ページを下にスクロールして「企業微信授权登录 (WeCom Authorized Login)」をクリックします。

![](https://static-docs.nocobase.com/202406272104655.png)

認証コールバックドメインをNocoBaseアプリケーションのドメインに設定します。

![](https://static-docs.nocobase.com/202406272105662.png)

アプリケーション詳細ページに戻り、「网页授权及 JS-SDK (Web Authorization and JS-SDK)」をクリックします。

![](https://static-docs.nocobase.com/202406272107063.png)

アプリケーションのOAuth2.0ウェブ認証機能のコールバックドメインを設定し、検証します。

![](https://static-docs.nocobase.com/202406272107899.png)

アプリケーション詳細ページで、「企业可信 IP (Corporate Trusted IP)」をクリックします。

![](https://static-docs.nocobase.com/202406272108834.png)

NocoBaseアプリケーションのIPアドレスを設定します。

![](https://static-docs.nocobase.com/202406272109805.png)

## WeCom管理コンソールから認証情報を取得する

WeCom管理コンソールの「私の企業 (My Company)」で、「企業 ID (Company ID)」をコピーします。

![](https://static-docs.nocobase.com/202406272111637.png)

WeCom管理コンソールの「アプリケーション管理 (App Management)」で、前のステップで作成したアプリケーションの詳細ページを開き、AgentIdとSecretをコピーします。

![](https://static-docs.nocobase.com/202406272122322.png)

## NocoBaseにWeCom認証を追加する

ユーザー認証プラグイン管理ページに移動します。

![](https://static-docs.nocobase.com/202406272115044.png)

追加 - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### 設定

![](https://static-docs.nocobase.com/202412041459250.png)

| 設定項目                                                                                              | 説明                                                                                                 | バージョン要件 |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| When a phone number does not match an existing user, <br />should a new user be created automatically | 携帯電話番号が既存のユーザーと一致しない場合、新しいユーザーを自動的に作成しますか。                 | -        |
| Company ID                                                                                            | 企業ID。WeCom管理コンソールから取得します。                                                          | -        |
| AgentId                                                                                               | WeCom管理コンソールのカスタムアプリケーション設定から取得します。                                    | -        |
| Secret                                                                                                | WeCom管理コンソールのカスタムアプリケーション設定から取得します。                                    | -        |
| Origin                                                                                                | 現在のアプリケーションドメイン。                                                                     | -        |
| Workbench application redirect link                                                                   | ログイン成功後にリダイレクトされるアプリケーションパス。                                             | `v1.4.0` |
| Automatic login                                                                                       | WeComブラウザでアプリケーションリンクを開いたときに、自動的にログインします。複数のWeCom認証が設定されている場合、このオプションを有効にできるのは1つだけです。 | `v1.4.0` |
| Workbench application homepage link                                                                   | ワークベンチアプリケーションのホームページリンク。                                                   | -        |

## WeComアプリケーションのホームページを設定する

:::info
`v1.4.0`以降のバージョンでは、「自動ログイン」オプションが有効になっている場合、アプリケーションのホームページリンクは `https://<url>/<path>` のように簡略化できます。例: `https://example.nocobase.com/admin`。

モバイル版とデスクトップ版で個別に設定することも可能です。例: `https://example.nocobase.com/m` と `https://example.nocobase.com/admin`。
:::

WeCom管理コンソールにアクセスし、コピーしたワークベンチアプリケーションのホームページリンクを、該当するアプリケーションのホームページアドレス欄に貼り付けます。

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## ログイン

ログインページにアクセスし、ログインフォームの下にあるボタンをクリックしてサードパーティログインを開始します。

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
WeComは携帯電話番号などの機密情報に対する権限が制限されているため、認証はWeComクライアント内でのみ完了できます。初めてWeComでログインする際は、以下の手順に従ってWeComクライアント内で初回ログイン認証を完了してください。
:::

## 初回ログイン

WeComクライアントからワークベンチに移動し、一番下までスクロールしてアプリケーションをクリックし、以前設定したアプリケーションのホームページを開きます。これにより、初回認証ログインが完了し、その後はNocoBaseアプリケーション内でWeComを使用してログインできるようになります。

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />