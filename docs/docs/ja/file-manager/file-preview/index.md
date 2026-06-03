---
pkg: '@nocobase/plugin-file-manager'
---
:::tip AI 翻訳に関する注意
このドキュメントは AI によって自動翻訳されています。
:::

# ファイルプレビュー

ファイルフィールド（添付フィールドを含む）を含む画面では、ファイルのサムネイルまたはアイコンをクリックしてファイルをプレビューできます。組み込みのプレビュー機能は、画像、PDF、およびブラウザーがネイティブに対応している多くのファイル形式をサポートしています。

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

ネイティブプレビューに対応していないファイル形式については、対応するファイルプレビュープラグインをインストールまたは拡張することでプレビュー機能を有効にできます。たとえば、Office ファイルプレビュープラグインをインストールすると、Word、Excel、PowerPoint ファイルをプレビューできます。

現在、NocoBase は次のファイルプレビュープラグインを提供しています。

* Office ファイルプレビュープラグイン

## 外部ストレージでの PDF プレビュー

PDF プレビューは PDF.js を使用してブラウザー内でファイルをレンダリングします。ブラウザーはまず PDF ファイルの内容を読み取り、その後 PDF.js に渡してレンダリングします。そのため、ファイルが OSS、S3、COS、CDN などの外部ストレージに保存されており、ファイルアクセス用のドメインが NocoBase サイトのドメインと異なる場合、外部ストレージは NocoBase サイトからのクロスオリジン読み取りを許可する必要があります。

CORS が設定されていない場合でも PDF のダウンロードは通常どおり機能しますが、プレビューはファイル読み込みエラーで失敗する可能性があります。

外部ストレージまたは CDN の CORS 設定には、次の内容を含めることを推奨します。

```http
Access-Control-Allow-Origin: https://your-nocobase-domain
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: *
Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges, Content-Disposition, Content-Type
```

`Access-Control-Allow-Origin` には、NocoBase にアクセスする実際のドメインを設定してください。非公開ファイルに対して長期的に `*` を使用することは推奨されません。ファイルを読み取れるサイトの範囲が広がるためです。
