# API Keys を使用してデータを取得する

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114233060688108&bvid=BV1m8ZuY4E2V&cid=29092153179&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

皆さん、本チュートリアルへようこそ。
このドキュメントでは、NocoBase で API キーを使用してデータを取得する方法をステップバイステップで解説します。「TODO リスト」を例に、各ステップの詳細を理解していただけるよう進めていきます。以下の内容をよく読んで、手順に沿って操作してみてください。

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 API キーの概念を理解する

始める前に、まず API キーとは何かを確認しましょう。API キーは入場券のようなもので、API リクエストが正当なユーザーからのものかどうかを確認するために使用されます。Web ページ、モバイルアプリ、バックエンドスクリプトから NocoBase システムにアクセスする際、この「秘密の鍵」がシステムに対してあなたの身元をすばやく確認してくれます。

HTTP リクエストヘッダーでは、以下のような形式になります：

```txt
Authorization: Bearer {API キー}
```

ここで「Bearer」は、その後に続くのが認証済みの API キーであることを示し、リクエスト元の権限をすばやく確認できます。

実際の利用シーンでは、API キーは以下のような場面で使用されます：

1. **クライアントアプリケーションからのアクセス**：ユーザーがブラウザやモバイルアプリから API を呼び出す際、システムは API キーでユーザーの身元を確認し、認可されたユーザーのみがデータにアクセスできるようにします。
2. **自動化タスクの実行**：バックエンドの定期タスクやスクリプトがデータの更新やログ記録を行う際、API キーを使用してリクエストのセキュリティと正当性を確保します。
3. **開発・テスト**：開発者がデバッグやテスト時に API キーを使用して本番リクエストをシミュレートし、API が正しく応答することを確認します。

要約すると、API キーはリクエスト元の身元確認だけでなく、呼び出し状況の監視、リクエスト頻度の制限、潜在的なセキュリティ脅威の防止にも役立ち、NocoBase の安定稼働を支えます。

## 2 NocoBase で API キーを作成する

### 2.1 [API キー](https://docs-cn.nocobase.com/handbook/api-keys) プラグインを有効にする

まず、NocoBase 内蔵の「認証：API キー」プラグインが有効になっていることを確認してください。有効にすると、システム設定センターに [API キー](https://docs-cn.nocobase.com/handbook/api-keys) の設定ページが追加されます。

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 テスト用の TODO 記録テーブルを作成する

テストのために、`TODO 記録テーブル(todos)` というテーブルを事前に作成します。フィールドは以下の通りです：

- `id`
- `タイトル（title）`
- `完了済み（completed）`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

次に、このテーブルにいくつかの TODO を入力します。例：

- ご飯を食べる
- 寝る
- ゲームをする

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 ロールの作成とバインド

API キーはユーザーロールにバインドされるため、システムはロールに基づいてリクエストの権限を判定します。したがって、API キーを作成する前に、まずロールを作成して適切な権限を割り当てる必要があります。
「TODO API ロール」というテスト用ロールを作成し、このロールに TODO 記録テーブルのすべての権限を割り当てることをお勧めします。

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

API キー作成時に「TODO システム API ロール」を選択できない場合は、現在のユーザーがそのロールをまだ持っていない可能性があります。その場合は、まず現在のユーザーにこのロールを割り当ててください：

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

ロールを割り当てた後、ページを更新して API キー管理ページに入り、「API キーを追加」をクリックすると、「TODO システム API ロール」が表示されるようになります。

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

より正確な管理を行うために、専用の「TODO API ユーザー」を作成してシステムにログインし、権限テストや API キー管理を行うこともできます。このユーザーには専用の「TODO API ロール」を割り当てます。
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 API キーの作成と保存

送信をクリックすると、API キーの作成が成功したことを知らせるメッセージがポップアップ表示され、ダイアログにキーが表示されます。セキュリティ上の理由から、システムは以後このキーを再表示しません。必ずコピーして保存してください。

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

例えば、以下のような API キーが取得できます：

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 注意事項

- API キーの有効期限は、申請時に選択した期間によって異なります。
- API キーの生成と検証ロジックは環境変数の `APP_KEY` と密接に関連しています。変更しないでください。変更すると、システム内のすべての API キーが無効になります。

## 3 API キーの有効性をテストする

### 3.1 [API ドキュメント](https://docs-cn.nocobase.com/handbook/api-doc) プラグインを使用する

API ドキュメントプラグインを開くと、各 API のリクエスト方法、アドレス、パラメータ、リクエストヘッダー情報を確認できます。

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 基本的な CRUD API を理解する

NocoBase が提供する基本 API の例を以下に示します：

- **一覧取得（list API）：**

  ```txt
  GET {baseURL}/{collectionName}:list
  リクエストヘッダー：
  - Authorization: Bearer <APIキー>

  ```
- **レコード作成（create API）：**

  ```txt
  POST {baseURL}/{collectionName}:create

  リクエストヘッダー：
  - Authorization: Bearer <APIキー>

  リクエストボディ（JSON 形式）、例：
      {
          "title": "123"
      }
  ```
- **レコード更新（update API）：**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  リクエストヘッダー：
  - Authorization: Bearer <APIキー>

  リクエストボディ（JSON 形式）、例：
      {
          "title": "123",
          "completed": true
      }
  ```
- **レコード削除（delete API）：**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  リクエストヘッダー：
  - Authorization: Bearer <APIキー>
  ```

ここで、`{baseURL}` は NocoBase システムのアドレス、`{collectionName}` はデータテーブル名です。例えば、ローカルでテストする場合、アドレスは `localhost:13000`、テーブル名は `todos` で、リクエスト URL は以下のようになります：

```txt
http://localhost:13000/todos:list
```

### 3.3 Postman でテストする（List API を例に）

Postman を開いて新しい GET リクエストを作成し、上記のリクエストアドレスを入力します。リクエストヘッダーに `Authorization` を追加し、値に API キーを設定します：

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)
リクエスト送信後、すべてが正常であれば、以下のようなレスポンスが返されます：

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

API キーが正しく認可されていない場合、以下のようなエラーメッセージが表示されることがあります：

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

この場合は、ロール権限の設定、API キーのバインド状況、キーの形式が正しいかどうかを確認してください。

### 3.4 Postman のリクエストコードをコピーする

テスト成功後、List API のリクエストコードをコピーできます。例えば、以下の curl リクエスト例は Postman からコピーしたものです：

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 [iframe ブロック](https://docs-cn.nocobase.com/handbook/block-iframe) で TODO リストを表示する

API リクエストの効果をより直感的に体験できるよう、シンプルな HTML ページを使って NocoBase から取得した TODO リストを表示してみましょう。以下のサンプルコードを参考にしてください：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
</head>
<body>
    <h1>Todo List</h1>
    <pre id="result"></pre>

    <script>
        fetch('http://localhost:13000/api/todos:list', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    </script>
</body>
</html>
```

上記のコードは iframe ブロック内にシンプルな「Todo List」を表示します。ページ読み込み後、API を呼び出して TODO レコードを取得し、結果をフォーマット済み JSON でページに表示します。

以下のアニメーションで、リクエスト全体のダイナミックな動作を確認できます：

![202503031918-fetch](https://static-docs.nocobase.com/202503031918-fetch.gif)

## 5 まとめ

以上のステップを通じて、NocoBase での API キーの作成と使用方法を詳しく解説しました。プラグインの有効化、データテーブルの作成、ロールのバインドから、API のテスト、iframe ブロックでのデータ表示まで、すべてのステップが重要です。最終的には、DeepSeek の助けを借りてシンプルな TODO ページも実現しました。ご自身のニーズに合わせて、コードを自由にカスタマイズ・拡張してみてください。

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

[本サンプルページのコード](https://forum.nocobase.com/t/api-api-key/3314)はコミュニティの投稿で公開しています。ぜひ参考にしてディスカッションにご参加ください。このドキュメントが皆さんにとって分かりやすいガイドとなれば幸いです。楽しく学んで、スムーズに操作できますように！
