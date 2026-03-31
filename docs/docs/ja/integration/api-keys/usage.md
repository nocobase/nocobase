:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# NocoBaseでAPIキーを使う

このガイドでは、実際の「ToDoリスト」の例を通して、NocoBaseでAPIキーを使ってデータを取得する方法を説明します。以下の手順に沿って、一連のワークフローを理解していきましょう。

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 APIキーについて理解する

APIキーは、認証されたユーザーからのAPIリクエストを検証するためのセキュリティトークンです。Webアプリケーション、モバイルアプリ、またはバックエンドスクリプトを介してNocoBaseシステムにアクセスする際に、リクエスト元の身元を検証する認証情報として機能します。

HTTPリクエストヘッダーでの形式は以下の通りです。

```txt
Authorization: Bearer {APIキー}
```

「Bearer」というプレフィックスは、その後に続く文字列が、リクエスト元の権限を検証するために使用される認証済みAPIキーであることを示します。

### よくある使用シナリオ

APIキーは通常、以下のシナリオで利用されます。

1.  **クライアントアプリケーションからのアクセス**：WebブラウザやモバイルアプリはAPIキーを使ってユーザーの身元を認証し、許可されたユーザーのみがデータにアクセスできるようにします。
2.  **自動化されたタスクの実行**：バックグラウンドプロセスや定期実行タスクはAPIキーを使って、更新、データ同期、ログ記録などの操作を安全に実行します。
3.  **開発とテスト**：開発者はデバッグやテスト中にAPIキーを使って、認証済みリクエストをシミュレートし、APIレスポンスを検証します。

APIキーは、身元認証、利用状況の監視、リクエストレート制限、脅威防止といった複数のセキュリティ上の利点を提供し、NocoBaseの安定した安全な運用を保証します。

## 2 NocoBaseでAPIキーを作成する

### 2.1 認証：APIキープラグインを有効にする

組み込みの[認証：APIキー](/plugins/@nocobase/plugin-api-keys/)プラグインが有効になっていることを確認してください。有効にすると、システム設定に新しいAPIキー設定ページが表示されます。

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 テスト用のコレクションを作成する

デモンストレーションのために、`todos`という名前の**コレクション**を以下のフィールドで作成します。

-   `id`
-   `タイトル（title）`
-   `完了済み（completed）`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

**コレクション**にいくつかのサンプルレコードを追加します。

-   食べる
-   寝る
-   ゲームをする

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 ロールを作成して割り当てる

APIキーはユーザーロールに紐付けられ、システムは割り当てられたロールに基づいてリクエストの権限を決定します。APIキーを作成する前に、ロールを作成し、適切な権限を設定する必要があります。「ToDo APIロール」という名前のロールを作成し、`todos`**コレクション**への完全なアクセス権を付与します。

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

APIキー作成時に「ToDo APIロール」が選択肢に表示されない場合は、現在のユーザーにこのロールが割り当てられていることを確認してください。

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

ロールを割り当てたら、ページを更新してAPIキー管理ページに移動します。「APIキーを追加」をクリックして、「ToDo APIロール」がロール選択に表示されることを確認します。

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

より良いアクセス制御のために、APIキーの管理とテスト専用のユーザーアカウント（例：「ToDo APIユーザー」）を作成することを検討してください。このユーザーに「ToDo APIロール」を割り当てます。
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 APIキーを生成して保存する

フォームを送信すると、システムは確認メッセージと新しく生成されたAPIキーを表示します。**重要**：セキュリティ上の理由から、このキーは二度と表示されないため、すぐにコピーして安全な場所に保管してください。

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

APIキーの例：

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 重要な注意事項

-   APIキーの有効期間は、作成時に設定された有効期限によって決まります。
-   APIキーの生成と検証は、`APP_KEY`環境変数に依存しています。**この変数を変更しないでください**。変更すると、システム内の既存のすべてのAPIキーが無効になります。

## 3 APIキー認証をテストする

### 3.1 APIドキュメントプラグインを使う

[APIドキュメント](/plugins/@nocobase/plugin-api-doc/)プラグインを開き、各APIエンドポイントのリクエストメソッド、URL、パラメーター、およびリクエストヘッダーを確認します。

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 基本的なCRUD操作を理解する

NocoBaseは、データ操作のために標準的なCRUD（作成、読み取り、更新、削除）APIを提供しています。

-   **リストクエリ（list API）：**

    ```txt
    GET {baseURL}/{collectionName}:list
    リクエストヘッダー：
    - Authorization: Bearer <APIキー>

    ```
-   **レコードの作成（create API）：**

    ```txt
    POST {baseURL}/{collectionName}:create

    リクエストヘッダー：
    - Authorization: Bearer <APIキー>

    リクエストボディ（JSON形式）、例：
        {
            "title": "123"
        }
    ```
-   **レコードの更新（update API）：**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    リクエストヘッダー：
    - Authorization: Bearer <APIキー>

    リクエストボディ（JSON形式）、例：
        {
            "title": "123",
            "completed": true
        }
    ```
-   **レコードの削除（delete API）：**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    リクエストヘッダー：
    - Authorization: Bearer <APIキー>
    ```

ここで：
-   `{baseURL}`：NocoBaseシステムのURL
-   `{collectionName}`：**コレクション**名

例：ローカルインスタンス `localhost:13000`、**コレクション**名 `todos` の場合：

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Postmanを使ってテストする

PostmanでGETリクエストを作成し、以下のように設定します。
-   **URL**：リクエストエンドポイント（例：`http://localhost:13000/api/todos:list`）
-   **Headers**：`Authorization`リクエストヘッダーを追加し、値を以下のように設定します。

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**成功時のレスポンス：**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**エラー時のレスポンス（無効なAPIキーまたは期限切れのAPIキー）：**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**トラブルシューティング**：認証に失敗した場合は、ロールの権限、APIキーの紐付け、およびトークンの形式を確認してください。

### 3.4 リクエストコードをエクスポートする

Postmanでは、さまざまな形式でリクエストをエクスポートできます。cURLコマンドの例：

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 JSブロックでAPIキーを使う

NocoBase 2.0では、JSブロックを使ってページ内で直接ネイティブJavaScriptコードを記述できます。この例では、APIキーを使って外部APIデータを取得する方法を説明します。

### JSブロックを作成する

NocoBaseページにJSブロックを追加し、以下のコードを使ってToDoリストデータを取得します。

```javascript
// APIキーを使ってToDoリストデータを取得
async function fetchTodos() {
  try {
    // ロード中のメッセージを表示
    ctx.message.loading('データを取得中...');

    // HTTPリクエスト用のaxiosライブラリをロード
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('HTTPライブラリのロードに失敗しました');
      return;
    }

    // APIキー（実際のAPIキーに置き換えてください）
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // APIリクエストを実行
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // 結果を表示
    console.log('ToDoリスト:', response.data);
    ctx.message.success(`${response.data.data.length}件のデータを正常に取得しました`);

    // ここでデータを処理できます
    // 例：テーブルに表示する、フォームフィールドを更新するなど

  } catch (error) {
    console.error('データの取得中にエラーが発生しました:', error);
    ctx.message.error('データの取得に失敗しました: ' + error.message);
  }
}

// 関数を実行
fetchTodos();
```

### 重要なポイント

-   **ctx.requireAsync()**：HTTPリクエストのために外部ライブラリ（axiosなど）を動的にロードします。
-   **ctx.message**：ユーザー通知（ロード中、成功、エラーメッセージ）を表示します。
-   **APIキー認証**：`Authorization`リクエストヘッダーでAPIキーを`Bearer`プレフィックス付きで渡します。
-   **レスポンス処理**：必要に応じて返されたデータ（表示、変換など）を処理します。

## 5 まとめ

このガイドでは、NocoBaseでAPIキーを使うための一連のワークフローを網羅しました。

1.  **セットアップ**：APIキープラグインを有効にし、テスト用の**コレクション**を作成しました。
2.  **設定**：適切な権限を持つロールを作成し、APIキーを生成しました。
3.  **テスト**：PostmanとAPIドキュメントプラグインを使ってAPIキー認証を検証しました。
4.  **統合**：JSブロックでAPIキーを使いました。

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**その他のリソース：**
-   [APIキープラグインのドキュメント](/plugins/@nocobase/plugin-api-keys/)
-   [APIドキュメントプラグイン](/plugins/@nocobase/plugin-api-doc/)