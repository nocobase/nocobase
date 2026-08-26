---
title: "テンプレート印刷 HTTP API"
description: "NocoBase テンプレート印刷 HTTP API：templatePrint アクションを使用して、選択したレコード、現在のフィルター結果、または条件に一致するすべてのデータを印刷し、Word、Excel、PowerPoint、PDF ファイルをダウンロードします。"
keywords: "テンプレート印刷,HTTP API,templatePrint,PDF,選択レコードの印刷,全件印刷,NocoBase"
---

# HTTP API

テンプレート印刷は HTTP API を通じてドキュメントのレンダリングとダウンロードを直接トリガーできます。詳細ブロックでもテーブルブロックでも、本質的には現在のビジネスリソースに対して `templatePrint` アクションを実行します。

```shell
curl -X POST \
	-H "Authorization: Bearer <JWT>" \
	-H "Content-Type: application/json" \
	"http://localhost:3000/api/<resource_name>:templatePrint" \
	--data-raw '{...}'
```

説明：
- `<resource_name>` は現在のデータテーブルに対応するリソース名です。
- インターフェースは JSON データではなく、バイナリファイルストリームを返します。
- 呼び出し元は、現在のリソースのクエリ権限と、対応するテンプレート印刷ボタンの使用権限を持っている必要があります。
- インターフェースの呼び出しには、Authorization リクエストヘッダーを通じてユーザーログインに基づく JWT トークンを渡す必要があります。渡さない場合、アクセスが拒否されます。

## リクエストボディパラメータ

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `templateName` | `string` | はい | テンプレート名。テンプレート管理で設定されたテンプレート識別子に対応します。 |
| `blockName` | `string` | はい | ブロックタイプ。テーブルブロックの場合は `table`、詳細ブロックの場合は `details` を渡します。 |
| `timezone` | `string` | いいえ | タイムゾーン。例：`Asia/Shanghai`。テンプレート内の日時レンダリングに使用されます。 |
| `uid` | `string` | いいえ | テンプレート印刷ボタンの schema uid。権限検証に使用されます。 |
| `convertedToPDF` | `boolean` | いいえ | PDF に変換するかどうか。`true` を渡すと `.pdf` ファイルが返されます。 |
| `queryParams` | `object` | いいえ | 下層のデータクエリに渡すパラメータです。 |
| `queryParams.page` | `number \| null` | いいえ | ページ番号。`null` に設定するとページ単位の切り出しを行いません。 |
| `queryParams.pageSize` | `number \| null` | いいえ | 1ページあたりの件数。`null` に設定するとページ単位の切り出しを行いません。 |
| `queryParams.filter` | `object` | いいえ | フィルター条件。ACL の固定フィルター条件と自動的にマージされます。 |
| `queryParams.appends` | `string[]` | いいえ | 追加でクエリするリレーションフィールドです。 |
| `queryParams.filterByTk` | `string \| object` | いいえ | 詳細ブロックでよく使用され、主キー値を指定します。 |
| `queryParams.sort` 等その他のパラメータ | `any` | いいえ | その他のクエリパラメータは、下層のリソースクエリにそのまま渡されます。 |

## テーブルブロック

テーブルブロックは同じインターフェースを使用し、`blockName: "table"` でリスト印刷モードを指定します。サーバー側はリソースに対して `find` クエリを実行し、結果の配列をテンプレートに渡します。

### 選択したレコードまたは現在のページの結果を印刷

テーブルブロックから一部のレコードを選択して印刷する場合、または現在のページのページネーションコンテキストを保持して印刷する場合に適用されます。一般的な方法は以下の通りです：

- `queryParams.page` と `queryParams.pageSize` を現在のテーブルのページ番号と1ページあたりの件数に設定します。
- 選択したレコードの主キーを `filter.id.$in` 条件に結合します。

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": 20,
			"filter": {
				"id": {
					"$in": [1, 2]
				}
			},
			"appends": [],
			"page": 1
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

このリクエストの意味は以下の通りです：

- `blockName` が `table` の場合、リストデータでテンプレートをレンダリングします。
- `filter.id.$in` は印刷するレコードの集合を指定します。
- `page` と `pageSize` は現在のページネーションコンテキストを保持し、UI の動作と一致させます。
- `appends` は必要に応じてリレーションフィールドを追加できます。

### 条件に一致するすべてのデータを印刷

テーブルブロックの「全レコードを印刷」をクリックした際の呼び出し方法に適用されます。この場合、現在のページでの切り出しは行わず、現在のフィルター条件に一致するすべてのデータを直接取得します。

重要なポイントは、`queryParams.page` と `queryParams.pageSize` を明示的に `null` に設定することです。

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": null,
			"filter": {},
			"appends": [],
			"page": null
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

このリクエストの意味は以下の通りです：

- `page: null` と `pageSize: null` はページネーション制限を解除することを意味します。
- `filter: {}` は追加のフィルター条件を付加しないことを意味します。UI 上にフィルター条件がある場合は、ここに直接入れることもできます。
- サーバー側は条件に一致するすべてのデータをクエリし、テンプレートを一括レンダリングします。

> 注意：テーブルブロックは1回の印刷で最大 300 件のレコードまで対応しています。制限を超えた場合、インターフェースは `400` エラーを返します。

## 詳細ブロック

詳細ブロックも `templatePrint` アクションを使用しますが、通常は以下のパラメータを渡します：

- `blockName: "details"`
- `queryParams.filterByTk` で現在のレコードの主キーを指定
- `queryParams.appends` で追加クエリするリレーションフィールドを指定

サーバー側はリソースに対して `findOne` クエリを実行し、結果オブジェクトをテンプレートに渡します。

## レスポンス

呼び出しが成功すると、インターフェースはファイルストリームを直接返します。典型的なレスポンスヘッダーは以下の通りです：

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="<template-title>-<suffix>.<ext>"
```

説明：

- `convertedToPDF` が `true` の場合、返されるファイルの拡張子は `.pdf` です。
- それ以外の場合、テンプレートの元の種類に対応するファイル（`.docx`、`.xlsx`、`.pptx` など）が返されます。
- フロントエンドは通常、`Content-Disposition` のファイル名に基づいてブラウザのダウンロードをトリガーします。

## その他のリソース
- [NocoBase で API キーを使用する](../integration/api-keys/usage.md)
