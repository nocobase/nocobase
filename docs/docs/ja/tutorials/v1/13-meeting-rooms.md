# 第 12 章：会議室予約とワークフロー

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114048192480747&bvid=BV1PKPuevEH5&cid=28526840811&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

ここまで来たあなたは、**NocoBase** にかなり慣れていることでしょう。

本章では、特別なシナリオとして会議管理モジュールを一緒に実装していきます。

このモジュールには会議室の予約と通知などの機能が含まれています。このプロセスでは、ゼロから会議管理モジュールを段階的に構築し、基礎から始めて徐々に複雑な機能を実現していきます。まず、このモジュールの基本的なデータテーブル構造を設計しましょう。

---

### 12.1 データテーブル構造の設計

データテーブル構造は、会議管理モジュールの基盤フレームワークと理解できます。ここでは**会議室テーブル**と**予約テーブル**を中心に説明し、ユーザーとの[多対多](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m)リレーションなど、いくつかの新しいリレーションも取り上げます。

![](https://static-docs.nocobase.com/Solution/CRuKbVrnroSgGdxaVrBcvzSMnHd.png)

#### 12.1.1 会議室テーブル

会議室テーブルは、すべての会議室の基本情報を格納するために使用します。フィールドには会議室の名称、場所、収容人数、設備などが含まれます。

##### テーブル構造の例

```json
会議室（Rooms）
    ID（主キー）
    会議室名（name、単行テキスト）
    場所（location、複数行テキスト）
    収容人数（capacity、整数）
    設備（equipment、複数行テキスト）
```

#### 12.1.2 予約テーブル

予約テーブルは、すべての会議予約情報を記録するために使用します。フィールドには会議室、参加ユーザー、時間帯、会議テーマ、説明などが含まれます。

##### テーブル構造の例

```json
予約（Bookings）
    ID（整数、一意の主キー）
    会議室（room、多対一リレーション、外部キー room_id が会議室 ID に関連）
    ユーザー（users、多対多、ユーザー ID に関連）
    開始時間（start_time、日付時間）
    終了時間（end_time、日付時間）
    会議タイトル（title、単行テキスト）
    会議説明（description、Markdown）
```

##### [多対多リレーション](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m)

予約テーブルでは「多対多」リレーションが必要です：1 人のユーザーが複数の会議に参加でき、1 つの会議にも複数のユーザーが参加できます。この多対多リレーションの外部キー関連を正しく設定する必要があります。管理しやすくするため、中間テーブルを **booking_users** と命名できます。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428726.png)

---

### 12.2 会議管理モジュールの構築

データテーブル構造の設計が完了したら、設計に従って 2 つのテーブルを作成し、「会議管理」モジュールを構築します。以下が作成と設定の手順です：

#### 12.2.1 [テーブルブロック](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)の作成

まず、ページに「会議管理」モジュールを追加し、**会議室テーブルブロック**と**予約テーブルの[テーブルブロック](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)**をそれぞれ作成します。さらに予約テーブルの[カレンダーブロック](https://docs-cn.nocobase.com/handbook/calendar)を作成し、カレンダーのデフォルトビューを「日」に設定します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428135.png)

##### 会議室テーブルブロックの関連付け設定

会議室テーブルブロックを他の 2 つのブロックと関連付けることで、その会議室に対応する予約レコードを自動的にフィルターできます。次に、フィルター、追加・削除・参照・編集の機能を試して、モジュールの基本的なインタラクションをテストしましょう。

> **NocoBase ブロック接続（おすすめ！）**：
>
> これまでのフィルターブロックに加えて、テーブルブロックも他のブロックと接続でき、クリックによるフィルター効果を実現できます。
>
> 下図のように、会議室テーブルの設定で他の 2 つの予約テーブルのブロック（予約テーブル - テーブルブロック、予約テーブル - カレンダーブロック）を接続します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428280.png)

> 接続が成功すると、会議室テーブルをクリックすると他の 2 つのテーブルも連動してフィルターされます！選択中の項目を再度クリックすると選択解除できます。
>
> ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429198.gif)

---

### 12.3 会議室の使用状況検出

ページの設定が完了したら、重要な機能を追加する必要があります：会議室の使用状況の検出です。この機能は、会議の作成や更新時に、対象の会議室が指定された時間帯に使用中かどうかを確認し、予約の重複を防ぎます。

![](https://static-docs.nocobase.com/project-management-cn-er.drawio.svg)

#### 12.3.1 「操作前イベント」[ワークフロー](https://docs-cn.nocobase.com/handbook/workflow)の設定

予約時に検出を行うため、特別なワークフロー「[操作前イベント](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor)」を使用します：

- [**操作前イベント**](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor)（商用プラグイン）：データの追加・削除・変更の前に一連の操作を実行でき、いつでも中断して事前にインターセプトできます。この方式は日常のコード開発フローに非常に近いものです！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429352.png)

#### 12.3.2 ノードの設定

使用状況検出のワークフローでは、以下の種類のノードが必要です：

- [**計算ノード**](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation)（データ変換ロジック、更新・追加のケースを処理）
- [**SQL 操作**](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql)（SQL クエリの実行）
- [**JSON 解析**](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)（商用プラグイン、JSON データの解析用）
- [**レスポンスメッセージ**](https://docs-cn.nocobase.com/handbook/workflow/nodes/response-message)（商用プラグイン、フィードバックメッセージの返却用）

---

#### 12.3.3 予約テーブルのバインドとトリガー設定

予約テーブルをバインドし、トリガーモードを「グローバルモード」に設定して、操作タイプとしてレコードの作成とレコードの更新を選択します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429296.png)

---

### 12.4 [計算ノード](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation)の設定

#### 12.4.1 「空白 ID を -1 に変換」計算ノードの作成

まず、空白の ID を -1 に変換する計算ノードを作成します。計算ノードは、必要に応じて変数を変換でき、以下の 3 つの形式の操作を提供します：

- **Math.js**（[Math.js](https://mathjs.org/) を参照）
- **Formula.js**（[Formula.js](https://formulajs.info/functions/) を参照）
- **文字列テンプレート**（データの結合用）

ここでは **Formula.js** を使用して数値判定を行います：

```html
IF(NUMBERVALUE(【トリガー変数/パラメータ/送信値オブジェクト/ID】, '', '.'),【トリガー変数/パラメータ/送信値オブジェクト/ID】, -1)
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429134.png)

---

### 12.5 [SQL 操作ノード](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql)の作成

次に、SQL 操作ノードを作成し、クエリを実行して利用可能な会議室を確認します：

#### 12.5.1 利用可能な会議室を検索する SQL

```sql
-- 予約可能なすべての会議室を検索
SELECT r.id, r.name
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id
  AND b.id <> {{$jobsMapByNodeKey.3a0lsms6tgg}}  -- 現在の予約を除外
  AND b.start_time < '{{$context.params.values.end_time}}' -- 開始時間がクエリの終了時間より前
  AND b.end_time > '{{$context.params.values.start_time}}' -- 終了時間がクエリの開始時間より後
WHERE b.id IS NULL;
```

> SQL の注意点：変数は SQL 文に直接置換されるため、変数を慎重に確認し、SQL インジェクションを防いでください。適切な箇所にシングルクォートを追加してください。

各変数の意味は以下の通りです：

{{$jobsMapByNodeKey.3a0lsms6tgg}} は前のノードの結果、【ノードデータ/空白 ID を -1 に変換】を表します。

{{$context.params.values.end_time}} は【トリガー変数/パラメータ/送信値オブジェクト/終了時間】を表します。

{{$context.params.values.start_time}} は【トリガー変数/パラメータ/送信値オブジェクト/開始時間】を表します。

#### 12.5.2 SQL のテスト

目的は、対象の時間帯と重複しないすべての会議室を検索することです。

その間、下部の「Test run」をクリックして変数の値を変更し、SQL をデバッグできます。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211437958.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438641.png)

---

### 12.6 [JSON 解析](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

#### 12.6.1 [JSON 解析ノード](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)の設定

前のステップのテストで、結果が以下のような形式であることがわかります。ここで [**JSON query node プラグイン**](https://docs-cn.nocobase.com/handbook/workflow-json-query)を有効にする必要があります：

```json
[
  {
    "id": 2,
    "name": "会議室2"
  },
  {
    "id": 1,
    "name": "会議室1"
  }
]
```

> JSON の解析方式は 3 種類あります：
> [JMESPath](https://jmespath.org/)
> [JSON Path Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
> [JSONata](https://jsonata.org/)

ここでは任意の方式を選択できます。例えば [JMESPath](https://jmespath.org/) 形式の場合、利用可能なすべての会議室名のリストを取得したいので、式は以下の通りです：

```sql
[].name
```

属性マッピングの設定はオブジェクトリストに対するもので、現時点では必要ないため、入力不要です。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438250.png)

### 12.7 [条件判定](https://docs-cn.nocobase.com/handbook/workflow/nodes/condition)

条件判定ノードを設定し、現在の会議室が利用可能な会議室リストに含まれているかどうかを判定します。判定結果の**はい**または**いいえ**に応じて、それぞれレスポンスメッセージを設定します：

判定条件は「基本」演算を選択すれば十分です：

```json
【ノードデータ / 会議室リストの解析】 が 【トリガー変数 / パラメータ / 送信値オブジェクト / 会議室 / 名前】 を含む
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439432.png)

#### 12.7.1 はい：成功メッセージの設定

ここで [**Workflow: Response message プラグイン**](https://docs-cn.nocobase.com/handbook/workflow-response-message)を有効にする必要があります：

```json
【トリガー変数/パラメータ/送信値オブジェクト/会議室/名前】 は利用可能です。予約成功！
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439159.png)

#### 12.7.2 いいえ：失敗メッセージの設定

```json
対象の会議室は利用できません。利用可能な会議室リスト：【ノードデータ/会議室リストの解析】
```

判定が失敗した場合は、必ず「プロセス終了」ノードを設定し、手動でプロセスを終了させてください。

![202411170606321731794792.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440377.png)

---

### 12.8 機能テストとデバッグの詳細

それでは、会議管理システムの最終テストに入りましょう。このステップの目的は、ワークフローが正しく検出を行い、重複する会議室予約をブロックできるかを確認することです。

#### 12.8.1 重複する時間帯の予約を追加する

まず、既存の予約と時間が重複する会議を追加してみて、システムが操作をブロックしてエラーメッセージを表示するかどうかを確認します。

- 重複する予約時間帯を設定

「会議室 1」に新しい予約を追加します。時間は以下の通りです：

`2024-11-14 00:00:00 - 2024-11-14 23:00:00`

この時間帯は終日をカバーしており、既存の予約時間との重複を意図的に作り出しています。

- 既存の会議予約を確認

「会議室 1」には既に 2 つの予約時間帯が存在します：

1. `2024-11-14 09:00:00 から 2024-11-14 12:00:00`
2. `2024-11-14 14:00:00 から 2024-11-14 16:30:00`

この 2 つの時間帯は、追加しようとしている時間帯

（`2024-11-14 00:00:00 - 2024-11-14 23:00:00`）

と重複しています。

したがって、ロジック判定に基づき、システムは時間の重複を検出してこの予約をブロックするはずです。

- 予約を送信してフィードバックを確認

**送信**ボタンをクリックすると、システムがワークフロー内の検出プロセスを実行します：

**成功フィードバック：** 送信後、システムが重複の警告を表示し、検出ロジックが正常に機能していることを示します。ページのフィードバックが、この予約を完了できないことを正しく通知しています。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440141.png)

---

#### 12.8.2 重複しない予約時間帯の追加

次に、重複しない予約のテストを行います。

会議時間が重複しない場合に、会議室を正常に予約できることを確認しましょう！

- 重複しない予約時間帯を設定

重複しない時間帯を選択します。例えば

`2024-11-10 16:00:00 - 2024-11-10 17:00:00`

この時間帯は既存の予約時間と重複しないため、会議室予約の要件を満たしています。

- 重複しない予約を送信

**送信**ボタンをクリックすると、システムが再びワークフローの検出ロジックを実行します：

**一緒に確認しましょう：** 送信成功です！システムに「予約成功」のメッセージが表示されます。重複がない場合の予約機能も正常に動作しています。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440542.png)

#### 12.8.3 既存の予約時間の変更

新規予約に加えて、既存の予約時間の変更もテストしてみてください。

例えば、既存の会議時間を重複しない別の時間帯に変更し、再度送信します。

このステップは皆さんにお任せします。

---

### 12.9 ダッシュボードの最適化とパーソナルスケジュールパネル

すべてのテスト機能が合格した後、ダッシュボードをさらに美化・最適化して、ユーザー体験を向上させましょう。

#### 12.9.1 ダッシュボードレイアウトの調整

ダッシュボードでは、ユーザーの操作習慣に合わせてページコンテンツを再配置し、システムデータの状況をより便利に確認できるようにします。

ユーザー体験をさらに向上させるため、各ユーザー専用の会議スケジュールパネルを作成できます。具体的な操作は以下の通りです：

1. **「パーソナルスケジュール」ブロックの新規作成**：ダッシュボードにカレンダーまたはリストブロックを追加し、ユーザー個人の会議スケジュールを表示します。
2. **メンバーのデフォルト値の設定**：メンバーのデフォルト値を現在のユーザーに設定し、ユーザーがダッシュボードを開いた際に自分に関連する会議がデフォルトで表示されるようにします。

これにより、会議管理モジュールでのユーザー体験がさらに向上します。

これらの設定が完了すると、ダッシュボードの機能とレイアウトがより直感的で使いやすくなり、機能も充実しました！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507712.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507197.png)

以上のステップにより、会議管理モジュールの主要機能を実装し最適化することに成功しました！操作を通じて NocoBase のコア機能を段階的にマスターし、モジュール式システム構築の楽しさを体験していただければ幸いです。

---

引き続き探索し、創造力を存分に発揮してください！問題が発生した場合は、いつでも [NocoBase 公式ドキュメント](https://docs-cn.nocobase.com/) を参照するか、[NocoBase コミュニティ](https://forum.nocobase.com/) に参加してディスカッションできます。
