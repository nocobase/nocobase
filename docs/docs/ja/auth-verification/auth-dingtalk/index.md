---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# 認証：DingTalk

## はじめに

「認証：DingTalk」**プラグイン**を利用すると、ユーザーはDingTalkアカウントを使ってNocoBaseにログインできます。

## プラグインを有効にする

![](https://static-docs.nocobase.com/202406120929356.png)

## DingTalk開発者コンソールでAPI権限を申請する

<a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalkオープン**プラットフォーム** - サードパーティWebサイトへのログインを実装する</a> を参考に、アプリケーションを作成してください。

アプリケーション管理コンソールに入り、「個人携帯電話番号情報」と「アドレス帳個人情報読み取り権限」を有効にしてください。

![](https://static-docs.nocobase.com/202406120006620.png)

## DingTalk開発者コンソールから認証情報を取得する

Client ID と Client Secret をコピーします。

![](https://static-docs.nocobase.com/202406120000595.png)

## NocoBaseにDingTalk認証を追加する

ユーザー認証**プラグイン**管理ページに移動します。

![](https://static-docs.nocobase.com/202406112348051.png)

「追加」-「DingTalk」

![](https://static-docs.nocobase.com/202406112349664.png)

### 設定

![](https://static-docs.nocobase.com/202406120016896.png)

- ユーザーが存在しない場合に自動でサインアップする - 携帯電話番号で既存のユーザーが見つからない場合、新しいユーザーを自動的に作成するかどうか。
- Client ID と Client Secret - 前のステップでコピーした情報を入力します。
- Redirect URL - コールバックURLです。コピーして次のステップに進んでください。

## DingTalk開発者コンソールでコールバックURLを設定する

コピーしたコールバックURLをDingTalk開発者コンソールに貼り付けます。

![](https://static-docs.nocobase.com/202406120012221.png)

## ログイン

ログインページにアクセスし、ログインフォームの下にあるボタンをクリックして、サードパーティログインを開始します。

![](https://static-docs.nocobase.com/202406120014539.png)