---
pkg: '@nocobase/plugin-file-manager'
title: "安定 URL（プロキシ URL）"
description: "NocoBase の安定したファイル URL の形式、アクセス権限、リダイレクト、Office プレビューでの動作を説明します。"
keywords: "安定 URL,プロキシ URL,永久 URL,ファイルアクセス,Office プレビュー,NocoBase"
---

# 安定 URL

NocoBase のストレージエンジンで管理されるファイルは、**安定 URL** を通してアクセスされます。NocoBase がファイルレコードと権限を確認した後、ストレージエンジンが生成した実際の URL へリダイレクトします。

## URL 形式

```text
/files/<app>/<dataSource>/<collection>/<id><extname>
```

`APP_PUBLIC_PATH=/nocobase` の場合は `/nocobase/files/` から始まります。ファイル作成後は ID と拡張子を変更できないため、レコードが存在する間は URL が安定します。

| 用途 | URL | 動作 |
|---|---|---|
| 表示 | `/files/.../42.pdf` | 権限確認後に実ファイルへリダイレクト |
| プレビュー | `/files/.../42.png?preview=1` | プレビューまたはサムネイルへリダイレクト |
| ダウンロード | `/files/.../42.pdf?download=1` | ダウンロード用 URL へリダイレクト |
| Office | `/files/.../42.xlsx?temporaryAccessToken=...` | Office Viewer が短時間だけ取得できる URL |

## 各機能での動作

- 添付フィールド、ファイルテーブル、[HTTP API](./http-api.md) は `url` と `preview` に安定 URL を返します
- Markdown にアップロードしたファイルも安定 URL を保存し、非公開の S3、OSS、COS、S3 Pro を利用できます
- 添付 URL フィールドでアップロードした管理対象ファイルは安定 URL を保存し、手入力した外部 URL はそのまま保持します
- 通常の画像、PDF、音声、動画、テキストプレビューは現在の NocoBase ログイン状態とファイル閲覧権限を使用します
- 公開フォームでは、同じ公開フォームセッションでアップロードしたファイルだけに限定アクセスできます

## Office プレビュー

Microsoft Office Online Viewer はユーザーの NocoBase cookie を利用できません。Office プレビューを開くと、NocoBase は先に閲覧権限を確認し、そのファイル専用の短期 URL を発行します。既定の有効期間は 10 分で、`TEMPORARY_FILE_ACCESS_EXPIRES_IN` により 5〜10 分に設定できます。

一時 URL を添付フィールド、Markdown、業務データに保存したり、共有リンクとして使用したりしないでください。

## 注意事項

- 安定 URL は公開 URL ではなく、閲覧者にはログインまたは anonymous 権限が必要です
- ファイルレコードを削除した場合や、アプリ、データソース、ファイルテーブルが変わった場合、元の URL は無効になります
- 応答は `302` です。CLI クライアントはリダイレクトを追跡する必要があります
- `302 Location` や `temporaryAccessToken` を永続化しないでください
- リバースプロキシは `APP_PUBLIC_PATH` 配下の `/files/` を NocoBase に転送する必要があります。サブパスにデプロイする場合は、ルートの `/files/` 互換ルートも残してください。NocoBase CLI が生成する設定には両方のルールが自動的に含まれます
- 独立した複数の NocoBase サービスをデプロイする場合は、ポートだけで区別せず、それぞれに異なる `hostname` を使用してください。ブラウザーの cookie はポートでは分離されません。詳細は[本番環境へのデプロイ](../get-started/deployment/production.md)を参照してください
- 同じ NocoBase デプロイ環境内のサブアプリはアプリ名で区別されるため、個別の hostname は必要ありません。ただし、別ポート上の独立したサービスに同名のメインアプリまたはサブアプリがある場合は、引き続き異なる hostname で分離する必要があります

## 関連リンク

- [HTTP API](./http-api.md) — API でファイルをアップロードする
- [ファイルプレビュー](./file-preview/index.md) — 対応するプレビュー形式を確認する
- [Office ファイルプレビュー](./file-preview/ms-office.md) — Office Viewer を設定する
- [ストレージエンジン](./storage/index.md) — ファイルストレージを設定する
