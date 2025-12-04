---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# 承認

## はじめに

「承認」は、人の手によって開始され、人の手によって処理されることで、関連データのステータスを決定するプロセスの一種です。これは通常、オフィスオートメーションやその他の手動による意思決定業務のプロセス管理に利用されます。例えば、「休暇申請」や「経費精算承認」、「原材料購入承認」といったシナリオにおける手動プロセスを作成・管理できます。

承認**プラグイン**は、専用の**ワークフロー**タイプ（トリガー）である「承認（イベント）」と、このプロセス専用の「承認」ノードを提供しています。NocoBase独自のカスタム**コレクション**やカスタムブロックと組み合わせることで、様々な承認シナリオを迅速かつ柔軟に作成・管理できます。

## ワークフローの作成

**ワークフロー**を作成する際に「承認」タイプを選択すると、承認**ワークフロー**を作成できます。

![Approval Trigger_Create Approval Workflow](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

その後、**ワークフロー**設定画面でトリガーをクリックすると、詳細設定用のダイアログが開きます。

## トリガーの設定

### コレクションのバインド

NocoBaseの承認**プラグイン**は柔軟性を重視して設計されており、任意のカスタム**コレクション**と組み合わせて使用できます。つまり、承認設定でデータモデルを再設定する必要はなく、既存の**コレクション**を直接再利用できるのです。そのため、トリガー設定に入ったら、まず**コレクション**を選択し、どの**コレクション**のデータが作成または更新されたときにこの**ワークフロー**がトリガーされるかを決定します。

![Approval Trigger_Trigger Configuration_Select Collection](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

次に、対応する**コレクション**のデータ作成（または編集）フォームで、この**ワークフロー**を送信ボタンにバインドします。

![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

その後、ユーザーがこのフォームを送信すると、対応する承認**ワークフロー**がトリガーされます。送信されたデータは、対応する**コレクション**に保存されるだけでなく、承認フロー内にスナップショットとして保存され、後続の承認者が確認できるようになります。

### 撤回

承認プロセスで申請者が**撤回**を許可されている場合、申請者インターフェースの設定で「**撤回**」ボタンを有効にする必要があります。

![Approval Trigger_Trigger Configuration_Allow Withdraw](https://static-docs.nocobase.com/20251029232544.png)

有効にすると、このプロセスで開始された承認は、どの承認者も処理する前であれば申請者によって**撤回**できます。ただし、後続の承認ノードで設定された承認者が処理を完了した後は、**撤回**できなくなります。

:::info{title=注意}
**撤回**ボタンを有効または削除した後、トリガー設定ダイアログで「保存して送信」をクリックしないと変更は適用されません。
:::

### 承認申請フォームのインターフェース設定

最後に、申請者のフォームインターフェースを設定する必要があります。このインターフェースは、承認センターブロックから申請する場合や、ユーザーが**撤回**後に再申請する場合の送信操作に使用されます。「設定」ボタンをクリックしてダイアログを開きます。

![Approval Trigger_Trigger Configuration_Initiator Form](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

申請者用のインターフェースには、バインドされた**コレクション**に基づく入力フォームや、ヒントやガイダンスとして機能する説明文（Markdown）を追加できます。フォームは必須です。追加しない場合、申請者はこのインターフェースに入っても操作できません。

フォームブロックを追加した後、通常のフォーム設定インターフェースと同様に、対応する**コレクション**のフィールドコンポーネントを追加し、フォームに入力する内容を整理するために自由に配置できます。

![Approval Trigger_Trigger Configuration_Initiator Form_Field Configuration](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

直接送信するボタンとは別に、「下書き保存」操作ボタンを追加して、一時保存の処理フローをサポートすることもできます。

![Approval Trigger_Trigger Configuration_Initiator Form_Action Configuration](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## 承認ノード

承認**ワークフロー**では、承認者が申請された承認を処理（承認、却下、または差し戻し）するための操作ロジックを設定するために、専用の「承認」ノードを使用する必要があります。「承認」ノードは承認プロセスでのみ使用できます。詳細については、[承認ノード](../nodes/approval.md)を参照してください。

## 承認申請の設定

承認**ワークフロー**を設定して有効にした後、対応する**コレクション**のフォームの送信ボタンにその**ワークフロー**をバインドすることで、ユーザーが送信時に承認を申請できるようにします。

![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

**ワークフロー**をバインドすると、ユーザーが現在のフォームを送信したときに承認が申請されます。

:::info{title=注意}
現在、承認申請ボタンは、新規作成または更新フォームの「送信」（または「保存」）ボタンのみをサポートしています。「**ワークフロー**に送信」ボタン（このボタンは「アクション後イベント」にのみバインド可能）はサポートしていません。
:::

## To-Doセンター

To-Doセンターは、ユーザーがTo-Doタスクを確認・処理するための統一された入り口を提供します。現在のユーザーが申請した承認や保留中のタスクは、上部のツールバーにあるTo-Doセンターからアクセスでき、左側のカテゴリナビゲーションを通じて異なる種類のTo-Doタスクを確認できます。

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### 申請済み

#### 申請済みの承認を確認

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### 新しい承認を直接申請

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### 自分のTo-Do

#### To-Doリスト

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### To-Doの詳細

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### 申請者

#### コレクションからの申請

データブロックから申請する場合、次のように呼び出すことができます（`posts`**コレクション**の作成ボタンを例に説明します）。

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

ここで、URLパラメータ `triggerWorkflows` は**ワークフロー**のキーであり、複数の**ワークフロー**はカンマで区切られます。このキーは、**ワークフロー**キャンバス上部の**ワークフロー**名にマウスカーソルを合わせると取得できます。

![Workflow_Key_View_Method](https://static-docs.nocobase.com/20240426135108.png)

呼び出しが成功すると、対応する`posts`**コレクション**の承認**ワークフロー**がトリガーされます。

:::info{title="注意"}
外部からの呼び出しもユーザーの身元に基づく必要があるため、HTTP API を介して呼び出す際は、通常のインターフェースから送信されるリクエストと同様に、認証情報を提供する必要があります。これには、`Authorization` リクエストヘッダーまたは `token` パラメータ（ログイン時に取得したトークン）、および `X-Role` リクエストヘッダー（ユーザーの現在のロール名）が含まれます。
:::

この操作で1対1のリレーションデータ（1対多は現在サポートされていません）のイベントをトリガーする必要がある場合、パラメータで `!` を使用して、リレーションフィールドのトリガーデータを指定できます。

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

上記の呼び出しが成功すると、対応する`categories`**コレクション**の承認イベントがトリガーされます。

:::info{title="注意"}
HTTP API を介してアクション後のイベントをトリガーする場合、**ワークフロー**の有効化状態と、**コレクション**の設定が一致しているかどうかに注意する必要があります。そうでない場合、呼び出しが成功しないか、エラーが発生する可能性があります。
:::

#### 承認センターからの申請

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**パラメータ**

*   `collectionName`：承認申請の対象となる**コレクション**名です。必須。
*   `workflowId`：承認申請に使用する**ワークフロー**IDです。必須。
*   `data`：承認申請時に作成される**コレクション**レコードのフィールドです。必須。
*   `status`：承認申請時に作成されるレコードのステータスです。必須。選択可能な値は以下の通りです。
    *   `0`：下書き。保存はされますが、承認のために送信はされません。
    *   `1`：承認申請。申請者が承認リクエストを送信し、承認プロセスに入ります。

#### 保存と送信

申請中（または**撤回**済み）の承認が下書き状態の場合、以下のAPIを通じて再度保存または送信できます。

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### 申請済みの承認リストを取得

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### 撤回

申請者は、以下のAPIを通じて現在承認中のレコードを**撤回**できます。

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**パラメータ**

*   `<approval id>`：**撤回**する承認レコードのIDです。必須。

### 承認者

承認**ワークフロー**が承認ノードに入ると、現在の承認者に対してTo-Doタスクが作成されます。承認者は、インターフェース操作またはHTTP API呼び出しを通じて承認タスクを完了できます。

#### 承認処理レコードの取得

To-Doタスクは承認処理レコードです。以下のAPIを通じて、現在のユーザーのすべての承認処理レコードを取得できます。

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

ここで、`approvalRecords` は**コレクション**リソースとして、`filter`、`sort`、`pageSize`、`page`などの一般的なクエリ条件も使用できます。

#### 個別の承認処理レコードを取得

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### 承認と却下

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**パラメータ**

*   `<record id>`：承認処理するレコードのIDです。必須。
*   `status`：承認処理のステータスです。`2`は「承認」、`-1`は「却下」を意味します。必須。
*   `comment`：承認処理の備考情報です。任意。
*   `data`：承認後、現在の承認ノードにある**コレクション**レコードに対して行われる変更を示します。任意（承認時のみ有効）。

#### 差し戻し <Badge>v1.9.0+</Badge>

v1.9.0より前のバージョンでは、**差し戻し**は「承認」や「却下」と同じインターフェースを使用し、`"status": 1`が**差し戻し**を表していました。

v1.9.0以降、**差し戻し**には個別のAPIが用意されています。

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**パラメータ**

*   `<record id>`：承認処理するレコードのIDです。必須。
*   `returnToNodeKey`：**差し戻し**先のターゲットノードのキーです。任意。ノードに**差し戻し**可能なノード範囲が設定されている場合、このパラメータを使用してどのノードに**差し戻し**るかを指定できます。設定されていない場合、このパラメータは渡す必要はなく、デフォルトで開始点に**差し戻し**され、申請者が再提出します。

#### 委任

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**パラメータ**

*   `<record id>`：承認処理するレコードのIDです。必須。
*   `assignee`：**委任**するユーザーのIDです。必須。

#### 承認者の追加

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**パラメータ**

*   `<record id>`：承認処理するレコードのIDです。必須。
*   `assignees`：**承認者として追加**するユーザーIDのリストです。必須。
*   `order`：**承認者として追加**する順序です。`-1`は「自分」より前、`1`は「自分」より後を示します。