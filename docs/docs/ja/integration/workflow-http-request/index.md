:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ワークフロー HTTP リクエスト連携

HTTP リクエストノードを使用すると、NocoBase の**ワークフロー**は任意の HTTP サービスにリクエストを送信し、外部システムとのデータ交換やビジネス**連携**を実現できます。

## 概要

HTTP リクエストノードは、**ワークフロー**における主要な**連携**コンポーネントです。これにより、**ワークフロー**の実行中にサードパーティ API、内部サービスインターフェース、またはその他の Web サービスを呼び出し、データを取得したり、外部操作をトリガーしたりできます。

## 主な利用シーン

### データ取得

- **サードパーティデータの照会**: 天気 API や為替レート API などからリアルタイムデータを取得します。
- **住所解析**: マッピングサービス API を呼び出して住所を解析し、ジオコーディングを行います。
- **企業データの同期**: CRM や ERP システムから顧客データや注文データなどを取得します。

### ビジネスのトリガー

- **メッセージプッシュ**: SMS、メール、WeCom などのサービスを呼び出して通知を送信します。
- **支払いリクエスト**: 決済ゲートウェイに対して支払い、返金などの操作を開始します。
- **注文処理**: 物流システムに送り状を提出したり、配送状況を照会したりします。

### システム連携

- **マイクロサービス呼び出し**: マイクロサービスアーキテクチャ内で他のサービスの API を呼び出します。
- **データレポート**: データ分析プラットフォームや監視システムにビジネスデータをレポートします。
- **サードパーティサービス**: AI サービス、OCR 認識、音声合成などを**連携**します。

### 自動化

- **定期タスク**: 定期的に外部 API を呼び出してデータを同期します。
- **イベント応答**: データが変更されたときに自動的に外部 API を呼び出し、関連システムに通知します。
- **承認ワークフロー**: 承認システム API を呼び出して承認リクエストを送信します。

## 機能

### 完全な HTTP サポート

- GET、POST、PUT、PATCH、DELETE など、すべての HTTP メソッドをサポートしています。
- カスタムリクエストヘッダー（Headers）をサポートしています。
- JSON、フォームデータ、XML など、複数のデータ形式をサポートしています。
- URL パラメーター、パスパラメーター、リクエストボディなど、さまざまなパラメーター渡し方をサポートしています。

### 柔軟なデータ処理

- **変数参照**: **ワークフロー**変数を使用してリクエストを動的に構築します。
- **応答解析**: JSON 応答を自動的に解析し、必要なデータを抽出します。
- **データ変換**: リクエストデータと応答データの形式を変換します。
- **エラー処理**: リトライ戦略、タイムアウト設定、エラー処理ロジックを設定します。

### セキュリティ認証

- **Basic 認証**: HTTP 基本認証
- **Bearer トークン**: トークン認証
- **API キー**: カスタム API キー認証
- **カスタムヘッダー**: 任意の認証方法をサポートします。

## 利用手順

### 1. **プラグイン**が有効になっていることを確認する

HTTP リクエストノードは**ワークフロー**の**プラグイン**の組み込み機能です。**[ワークフロー](/plugins/@nocobase/plugin-workflow/)** **プラグイン**が有効になっていることを確認してください。

### 2. **ワークフロー**に HTTP リクエストノードを追加する

1. **ワークフロー**を作成または編集します。
2. 必要な場所に **HTTP リクエスト**ノードを追加します。

![HTTP リクエスト_追加](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. リクエストパラメーターを設定します。

### 3. リクエストパラメーターを設定する

![HTTP リクエストノード_ノード設定](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### 基本設定

- **リクエスト URL**: ターゲット API アドレス。変数を使用できます。
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **リクエストメソッド**: GET、POST、PUT、DELETE などを選択します。

- **リクエストヘッダー**: HTTP ヘッダーを設定します。
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **リクエストパラメーター**:
  - **クエリパラメーター**: URL クエリパラメーター
  - **ボディパラメーター**: リクエストボディデータ（POST/PUT）

#### 詳細設定

- **タイムアウト**: リクエストのタイムアウトを設定します（デフォルト 30 秒）。
- **失敗時のリトライ**: リトライ回数とリトライ間隔を設定します。
- **失敗を無視**: リクエストが失敗しても、**ワークフロー**の実行を続行します。
- **プロキシ設定**: HTTP プロキシを設定します（必要な場合）。

### 4. 応答データを使用する

HTTP リクエストノードの実行後、応答データは後続のノードで使用できます。

- `{{$node.data.status}}`: HTTP ステータスコード
- `{{$node.data.headers}}`: 応答ヘッダー
- `{{$node.data.data}}`: 応答ボディデータ
- `{{$node.data.error}}`: エラーメッセージ（リクエストが失敗した場合）

![HTTP リクエストノード_応答結果の使用](https://static-docs.nocobase.com/20240529110610.png)

## 応用例

### 例 1: 天気情報の取得

```javascript
// 設定
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// 応答の使用
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### 例 2: WeCom メッセージの送信

```javascript
// 設定
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "注文 {{$context.orderId}} は発送されました"
  }
}
```

### 例 3: 支払い状況の照会

```javascript
// 設定
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// 条件判定
もし {{$node.data.data.status}} が "paid" と等しい場合
  - 注文ステータスを「支払い済み」に更新する
  - 支払い成功通知を送信する
そうでなく、もし {{$node.data.data.status}} が "pending" と等しい場合
  - 注文ステータスを「支払い待ち」に維持する
それ以外の場合
  - 支払い失敗ログを記録する
  - 管理者に異常処理を通知する
```

### 例 4: CRM へのデータ同期

```javascript
// 設定
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## 認証方法の設定

### Basic 認証

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Bearer トークン

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### API キー

```javascript
// ヘッダー内
Headers:
  X-API-Key: your-api-key

// またはクエリ内
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

まず access_token を取得し、その後使用します。

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## エラー処理とデバッグ

### よくあるエラー

1. **接続タイムアウト**: ネットワーク接続を確認し、タイムアウト時間を増やします。
2. **401 未承認**: 認証情報が正しいか確認します。
3. **404 見つかりません**: URL が正しいか確認します。
4. **500 サーバーエラー**: API プロバイダーのサービスステータスを確認します。

### デバッグのヒント

1. **ログノードの使用**: HTTP リクエストの前後にログノードを追加し、リクエストと応答データを記録します。

2. **実行ログの確認**: **ワークフロー**の実行ログには、詳細なリクエストと応答情報が含まれています。

3. **テストツール**: Postman、cURL などのツールを使用して、まず API をテストします。

4. **エラー処理**: 異なる応答ステータスを処理するための条件判定を追加します。

```javascript
もし {{$node.data.status}} が 200 以上かつ {{$node.data.status}} が 300 未満の場合
  - 成功時のロジックを処理する
それ以外の場合
  - 失敗時のロジックを処理する
  - エラーを記録する: {{$node.data.error}}
```

## パフォーマンス最適化のヒント

### 1. 非同期処理を使用する

すぐに結果を必要としないリクエストの場合は、非同期**ワークフロー**の使用を検討してください。

### 2. 適切なタイムアウトを設定する

API の実際の応答時間に基づいてタイムアウトを設定し、過度な待機を避けます。

### 3. キャッシュ戦略を実装する

頻繁に変化しないデータ（設定、辞書など）については、応答結果をキャッシュすることを検討してください。

### 4. バッチ処理

同じ API を複数回呼び出す必要がある場合は、API のバッチインターフェース（サポートされている場合）の使用を検討してください。

### 5. エラーリトライ

適切なリトライ戦略を設定しますが、過度なリトライによる API のレート制限を避けてください。

## セキュリティのベストプラクティス

### 1. 機密情報を保護する

- URL に機密情報を公開しないでください。
- HTTPS を使用して暗号化された転送を行います。
- API キーなどの機密情報は、環境変数または設定管理を使用して保存します。

### 2. 応答データを検証する

```javascript
// 応答ステータスの検証
if (![200, 201].includes($node.data.status)) {
  throw new Error('API request failed');
}

// データ形式の検証
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Invalid response data');
}
```

### 3. リクエスト頻度を制限する

サードパーティ API のレート制限を遵守し、ブロックされないようにします。

### 4. ログの匿名化

ログを記録する際は、機密情報（パスワード、キーなど）の匿名化処理に注意してください。

## Webhook との比較

| 特性 | HTTP リクエストノード | Webhook トリガー |
|------|-------------|---------------|
| 方向 | NocoBase が外部を能動的に呼び出す | 外部が NocoBase を能動的に呼び出す |
| タイミング | **ワークフロー**実行時 | 外部イベント発生時 |
| 用途 | データ取得、外部操作のトリガー | 外部通知、イベントの受信 |
| 主なシナリオ | 決済 API の呼び出し、天気照会 | 支払いコールバック、メッセージ通知 |

これらの 2 つの機能は相互に補完し合い、完全なシステム**連携**ソリューションを構築します。

## 関連リソース

- [**ワークフロー** **プラグイン**ドキュメント](/plugins/@nocobase/plugin-workflow/)
- [**ワークフロー**: HTTP リクエストノード](/workflow/nodes/request)
- [**ワークフロー**: Webhook トリガー](/integration/workflow-webhook/)
- [API キー認証](/integration/api-keys/)
- [API ドキュメント**プラグイン**](/plugins/@nocobase/plugin-api-doc/)