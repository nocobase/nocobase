# 第 1 章：NocoBase をはじめよう

<iframe width="800" height="450" src="https://player.bilibili.com/player.html?isOutside=true&aid=113592322098790&bvid=BV18qzRYyErc&cid=27170310323&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

## 1.1 クイック体験

まずは、NocoBase を素早く体験して、その強力な機能を確認してみましょう。[オンラインデモ](https://demo-cn.nocobase.com/new)でメールアドレスと必要な情報を入力し、「開通」をクリックすると、すべての商用プラグインを含む 2 日間の体験システムが届きます。

![](https://static-docs.nocobase.com/Solution/202411052322391730820159.png)

![](https://static-docs.nocobase.com/Solution/202411052328231730820503.png)

NocoBase 公式からメールが届いたら、まずは自由に探索して、NocoBase の柔軟さと強力さを体感してください。体験システムでは何でも自由に操作できますので、心配は不要です。

## 1.2 NocoBase の基本インターフェース

NocoBase へようこそ！初めて使うときは、インターフェースが少し見慣れないかもしれません。どこから始めればいいかわからなくても大丈夫です。主要な機能エリアを一つずつ確認して、素早く使いこなせるようにしましょう。

### 1.2.1 **インターフェース設定**

NocoBase に初めてアクセスすると、シンプルで直感的なメインインターフェースが表示されます。右上にある[**「インターフェース設定」**](https://docs-cn.nocobase.com/handbook/ui/ui-editor)ボタンをクリックすると、インターフェース設定モードに切り替わります。ここがシステムページを構築するための主な作業エリアです。

![インターフェース設定モード](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152031029.png)

**操作手順：**

1. **設定モードに入る**：右上の「インターフェース設定」ボタンをクリックして、設定モードに入ります。
2. **[メニュー](https://docs-cn.nocobase.com/handbook/ui/menus)ページを追加する**：
   - 「メニュー項目を追加」をクリックします。
   - メニュー名（例：「テストページ」）を入力し、確認をクリックします。
   - システムが自動的に新しいテストページを作成し、そのページに遷移します。

![demov4-001.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032346.gif)

3. **[ブロック](https://docs-cn.nocobase.com/handbook/ui/blocks)を作成する**：
   - テストページで「ブロックを作成」ボタンをクリックします。
   - ブロックタイプからデータブロック（例：「テーブルブロック」）を選択します。
   - データテーブル（例：システム内蔵の「ユーザー」テーブル）を接続します。
   - 表示したいフィールドを選択して確認します。
4. これで、ユーザー一覧を表示するテーブルブロックが完成です！

![ブロック作成](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032964.gif)

とても簡単ですよね？NocoBase のブロック設計は Notion からインスピレーションを得ていますが、機能はさらに強力で、より複雑なシステムの構築にも対応できます。今後のチュートリアルでは、さまざまなブロック機能を深く探索していきますので、お楽しみに！

### 1.2.2 **プラグインマネージャー**

プラグインは NocoBase の機能を拡張するための重要なツールです。[**プラグインマネージャー**](https://docs-cn.nocobase.com/handbook/plugin-manager)では、さまざまなプラグインの閲覧、インストール、有効化、無効化ができ、異なるビジネスニーズに対応します。

プラグイン拡張を活用することで、便利な機能や予想外の機能統合を実現でき、制作と開発がさらに快適になります。

![プラグインマネージャー](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152034703.png)

**操作手順：**

1. **インストール済みプラグインを確認する**：「プラグインマネージャー」をクリックすると、現在インストールされているすべてのプラグインの一覧が表示されます。
2. **プラグインを有効化する**：
   - 必要なプラグイン（例：「テーマエディター」プラグイン）を見つけます。
   - 「有効化」ボタンをクリックして、プラグインを有効化します。
3. **プラグイン機能をテストする**：
   - 「テーマエディター」を有効化すると、右上の個人センターからシステムテーマをすばやく変更できるようになります。
     ![システムテーマの変更](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035380.gif)
   - 設定センターにテーマエディターの画面が表示され、色やフォントなど、システムテーマをカスタマイズできます。
     ![テーマエディター画面](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035889.png)

### 1.2.3 **設定ページ**

**設定ページ**には、システムおよび一部のプラグインに関するさまざまな設定項目が統合されており、NocoBase のあらゆる側面を総合的に管理できます。

![設定ページ](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036847.png)

**よく使うプラグインの設定項目：**

- [**データソース管理**](https://docs-cn.nocobase.com/handbook/data-source-manager)：すべてのデータテーブルを管理し、メインデータベースや外部データベースを設定します。
- [**システム設定**](https://docs-cn.nocobase.com/handbook/system-settings)：システム名、ロゴ、言語などの基本情報を変更します。
- [**ユーザーと権限**](https://docs-cn.nocobase.com/handbook/users)：ユーザーアカウントを管理し、異なるロールの権限を設定します。
- [**プラグイン設定**](https://docs-cn.nocobase.com/handbook/plugin-manager)：インストール済みプラグインの詳細設定と管理を行います。

### 1.2.4 **バージョン情報とサポート**

インターフェースの右上には **NocoBase のバージョン情報**が表示されます。使用中に疑問があれば、**ホームページ**や**ユーザーマニュアル**を参照してください。

![バージョン情報](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036065.png)

### 1.2.5 **個人センターメニュー**

個人センターメニューはインターフェースの右上にあり、**個人情報の変更**や**ロールの切り替え**、その他の重要なシステム操作を行えます。
もちろん、一部のプラグインはここの機能も拡張します。

![個人センターメニュー](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036889.png)

## 1.3 NocoBase のインストール

NocoBase を本格的に使うことを決めたら、お使いのコンピューターやサーバーにインストールしましょう。NocoBase にはさまざまなインストール方法が用意されています。自分に合った方法を選んで、ノーコード開発の旅を始めましょう。

### 1.3.1 **インストール方法**

1. **Docker インストール（推奨）**

   - **メリット**：高速で簡単、Docker に慣れているユーザーに最適です。
   - **バージョンの選択**：
     - **main & latest バージョン**：現時点で最も安定したバージョンで、ほとんどのユーザーにおすすめです。
     - **next バージョン**：ベータ版で、新機能を先行体験したいユーザー向けです。完全には安定していない場合がありますので、重要なデータはバックアップしてからご利用ください。
   - **操作手順**：
     - [公式インストールガイド](https://docs-cn.nocobase.com/welcome/getting-started/installation/docker-compose)を参照し、手順に沿って Docker Compose で NocoBase をデプロイします。
2. **Create-NocoBase-App インストール**

   - **対象ユーザー**：フロントエンド開発者や npm に慣れているユーザー。
   - **操作手順**：
     - [インストールガイド](https://docs-cn.nocobase.com/welcome/getting-started/installation/create-nocobase-app)を参照し、npm パッケージでインストールします。
3. **ソースコードインストール**

   - **対象ユーザー**：NocoBase を深くカスタマイズしたい開発者。
   - **操作手順**：
     - [インストールガイド](https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone)を参照し、GitHub からソースコードをクローンして、カスタム要件に合わせてインストールします。

### 1.3.2 **詳細インストールガイド（Docker の例）**

どのインストール方法を選んでも、**NocoBase インストールドキュメント**で詳細な手順と説明を確認できます。以下は Docker インストールの簡易手順です。

1. **Docker をインストール**：システムに Docker がインストールされていることを確認します。まだインストールしていない場合は、[Docker 公式サイト](https://www.docker.com/)からダウンロードしてインストールしてください。
2. **Docker Compose ファイルを取得する**：

   - ターミナルまたはコマンドラインツールを開きます。
   - nocobase ディレクトリを作成し、Docker Compose 設定を作成します。

```bash
mkdir nocobase
cd nocobase
vim docker-compose.yml
```

3. `docker-compose.yml` を開いたら、以下の設定を貼り付けて、必要に応じて調整し、ファイルを保存します。

```bash
version: "3"

networks:
  nocobase:
        driver: bridge

services:
  app:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
        networks:
          - nocobase
        depends_on:
          - postgres
        environment:
          # アプリケーションの秘密鍵。ユーザートークンの生成などに使用されます
          # APP_KEY を変更すると、古いトークンは無効になります
          # 任意のランダムな文字列を使用し、外部に漏れないようにしてください
          - APP_KEY=your-secret-key
          # データベースの種類。postgres, mysql, mariadb, sqlite に対応
          - DB_DIALECT=postgres
          # データベースホスト。既存のデータベースサーバー IP に置き換え可能
          - DB_HOST=postgres
          # データベース名
          - DB_DATABASE=nocobase
          # データベースユーザー
          - DB_USER=nocobase
          # データベースパスワード
          - DB_PASSWORD=nocobase
          # タイムゾーン
          - TZ=Asia/Shanghai
        volumes:
          - ./storage:/app/nocobase/storage
        ports:
          - "13000:80"
        # init: true

  # 既存のデータベースサービスを使用する場合は、postgres を起動する必要はありません
  postgres:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
        restart: always
        command: postgres -c wal_level=logical
        environment:
          POSTGRES_USER: nocobase
          POSTGRES_DB: nocobase
          POSTGRES_PASSWORD: nocobase
        volumes:
          - ./storage/db/postgres:/var/lib/postgresql/data
        networks:
          - nocobase
```

4. **NocoBase を起動する**：
   - nocobase ディレクトリで以下のコマンドを実行してサービスを起動します。

```bash
docker-compose up -d
```

- これにより必要なイメージがダウンロードされ、NocoBase サービスが起動します。

5. **NocoBase にアクセスする**：
   - ブラウザを開き、`http://localhost:13000`（設定によって異なる場合があります）にアクセスすると、NocoBase のログイン画面が表示されます。

以上の手順で、NocoBase のインストールと起動が完了です！続いて、チュートリアルのガイドに沿って、独自のアプリケーションシステムの構築を始めましょう。

---

以上の手順のガイドによって、NocoBase の基本インターフェースとインストールプロセスに慣れていただけたかと思います。[次の章（第 2 章：タスク管理システムの設計）](./02-designing-system)では、NocoBase の強力な機能をさらに探索し、機能豊富なアプリケーションを構築していきます。一緒に次のステップに進んで、ノーコード開発の新しい旅を始めましょう！
