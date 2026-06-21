---
title: "アプリケーションが自動的に起動します"
description: "nb app autostart を使用して、CLI でホストされる NocoBase 環境の統合アプリケーション自動開始エントリを設定します。"
keywords: "NocoBase、アプリケーション自動起動、NB アプリ自動起動、systemd、Docker、PM2"
---


# アプリケーションが自動的に起動します

NocoBase CLI では、`nb app autostart` を使用して、「どの環境の自動起動を許可するか」と「システム起動後にこれらの環境を均一に取得する方法」を管理します。

CLI でホストされるアプリケーションをサーバー上で正式に実行する場合、これは通常、運用環境におけるデフォルトの手順です。

## `nb app autostart` が依然として必要なのはなぜですか?

この問題は非常に一般的です。

これを初めて見た人は、最下層にはすでに Docker や PM2、あるいはシステム自体にすでに `systemd` があるのに、なぜさらに `nb app autostart` の層が必要なのかと考えるでしょう。

その理由は、これらのレイヤーが実際には同じ問題を解決しないためです。

- Docker、PM2、Supervisor などの機能は、「アプリケーションが通常どのように実行され、アプリケーションのプロセスをどのように管理するか」という問題を解決します。
- `systemd`、`launchd`、ホスト起動スクリプトなどの機能により、「システム起動時にどのコマンドを実行するか?」という問題を解決します。
- `nb app autostart` は、「NocoBase CLI レベルで、どの環境の自動起動を許可するかを統一的に管理する方法と、システム起動後にそれらをプルアップする方法」の問題を解決します。

つまり、CLI によって Docker、PM2、または Supervisor の必要性がなくなるわけではありません。代わりに、さまざまなプロセス管理方法を統一的な方法で適応させ、それらを安定した自己起動型管理ポータルのセットに統合して、ユーザーの精神疾患を軽減します。

システムがこの層を開始すると、引き続き `systemd`、`launchd`、またはホスト起動スクリプトに引き渡されます。これらは、マシンの起動時に以下を実行する責任があります。

```bash
nb app autostart run
```

このコマンドは、自動起動が有効になっているすべてのアプリケーションを起動します。

この層がないと、基盤となる操作方法が異なると、Docker、PM2、またはその他の方法のそれぞれの自動開始構成と回復プロセスを覚えておく必要があります。 `nb app autostart` を追加した後は、同じ NocoBase CLI の使用習慣を覚え続けるだけで済みます。

まず、この設計がこのように分解される理由を知りたい場合は、[nb アプリの設計意図](../cli-design/nb-app-design-intent.md#Why is-nb-app-autostart それでも必要な理由) を読み続けてください。

## このコマンド グループの役割は何ですか?

最も一般的に使用されるものは次のとおりです。

- `nb app autostart enable`
- `nb app autostart disable`
- `nb app autostart list`
- `nb app autostart run`

最も一般的な 2 つの責任レベルに注目すると、次のように理解できます。

- `enable` / `disable` は、特定の環境で自動起動が許可されているかどうかを管理します。
- `run` は、システム起動フェーズ中に自動起動が有効になっているすべての環境をプルアップする役割を果たします。

まず、現在の環境の自動開始フラグを有効にします。

```bash
nb app autostart enable
```

現在の環境以外のものを操作したい場合は、それを明示的に指定できます。

```bash
nb app autostart enable --env app1 --yes
```

これを有効にすると、どの環境が自己起動としてマークされているかを確認できます。

```bash
nb app autostart list
```

システムの起動後、次のコマンドを実行して、自動起動が有効になっているすべての環境をプルアップする必要があります。

```bash
nb app autostart run
```

トラブルシューティング時に基礎となる起動出力を確認したい場合は、以下を追加できます。

```bash
nb app autostart run --verbose
```

システムで env を開始したくない場合は、このマークをキャンセルすることもできます。

```bash
nb app autostart disable --env app1 --yes
```

## Docker、PM2、systemd との関係は何ですか?

ここには混同されやすい境界線があります。

`nb app` この層は「アプリケーションがどのように実行されるか」という問題を解決します。最下層は、Docker や PM2 などのさまざまな実行方法に適応でき、将来的に拡張し続けることができます。

`nb app autostart` このレイヤーは「マシン起動後に自動起動するための環境をどうやって引き上げるか」という問題を解決します。これは、特定のプロセス管理ツールを置き換えるというよりは、ホスト起動メカニズムに安定したエントリ ポイントを提供することに似ています。

言い換えると：

- Docker、PM2、Supervisor などの機能がアプリケーションの実行方法に近い
- `systemd`、`launchd`、ホスト起動スクリプト、システム起動層に近い

このため、正式な環境では通常、`nb app autostart run` を独自のシステム起動プロセス (`systemd`、`launchd`、コンテナー プラットフォーム起動スクリプト、またはすでに使用しているその他のホスト自動起動メカニズムなど) に接続する必要があります。

## 適用範囲

`nb app autostart` は、CLI 管理ランタイムを使用する環境、つまり次の環境にのみ適用されます。

- `local`
- `docker`

この環境がリモート API 接続のみである場合、または現在のマシンの CLI 管理下で実行されているアプリケーションではない場合、このコマンド セットは自己起動には適していません。

##デフォルトのプラクティス

ほとんどのシナリオでは、次の順序で十分です。

1. まず、現在のマシンでアプリケーションが正常に起動できることを確認します。
2. `nb app autostart enable --env <name> --yes` を実行します。
3. `nb app autostart run` をシステムに接続してプロセスを開始します
4. マシンを再起動するか、`run` を手動で実行して、正常に回復するかどうかを確認します。

次に実稼働エントリ層を構成する必要がある場合は、引き続き [リバース プロキシ](./reverse-proxy/index.md) を確認してください。

## 関連コマンド

```bash
nb app autostart enable --env app1 --yes
nb app autostart disable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## 関連リンク

- [本番環境展開の概要](./index.md)
- [リバースプロキシ](./reverse-proxy/index.md)
- [nb アプリの設計意図](../cli-design/nb-app-design-intent.md)
- [アプリケーションの管理](../operations/manage-app.md)
