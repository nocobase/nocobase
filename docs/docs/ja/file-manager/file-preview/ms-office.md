---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/file-manager/file-preview/ms-office)をご参照ください。
:::

# Office ファイルプレビュー <Badge>v1.8.11+</Badge>

Office ファイルプレビュープラグインは、NocoBase アプリケーション内で Word、Excel、PowerPoint などの Office 形式のファイルをプレビューするために使用されます。  
このプラグインはマイクロソフトが提供するパブリックオンラインサービスに基づいており、公開 URL を通じてアクセス可能なファイルをプレビューインターフェースに埋め込むことができます。ユーザーは Office アプリケーションをダウンロードしたり使用したりすることなく、ブラウザ上でこれらのファイルを表示できます。

## ユーザーマニュアル

デフォルトでは、このプラグインは **無効** の状態です。プラグインマネージャーで有効にすると、追加の設定なしですぐに使用できます。

![プラグインの有効化画面](https://static-docs.nocobase.com/20250731140048.png)

コレクションのファイルフィールドに Office ファイル（Word / Excel / PowerPoint）をアップロードした後、対応するファイルのアイコンまたはリンクをクリックすると、ポップアップまたは埋め込みのプレビューインターフェースでファイルの内容を確認できます。

![プレビュー操作の例](https://static-docs.nocobase.com/20250731143231.png)

## 実装原理

このプラグインによるプレビュー表示は、マイクロソフトのパブリックオンラインサービス（Office Web Viewer）に依存しています。主なプロセスは以下の通りです：

- フロントエンドが、ユーザーによってアップロードされたファイルに対して公開アクセス可能な URL（S3 の署名付き URL を含む）を生成します。
- プラグインは iframe 内で以下のアドレスを使用してファイルプレビューを読み込みます：

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<公開ファイル URL>
  ```

- マイクロソフトのサービスがその URL に対してファイル内容をリクエストし、レンダリングを行って表示可能なページを返します。

## 注意事項

- このプラグインはマイクロソフトのオンラインサービスに依存しているため、ネットワーク接続が正常であり、マイクロソフトの関連サービスにアクセスできる必要があります。
- マイクロソフトは提供されたファイル URL にアクセスし、プレビューページをレンダリングするためにファイル内容をサーバーに一時的にキャッシュします。そのため、一定のプライバシーリスクが存在します。これについて懸念がある場合は、このプラグインによるプレビュー機能の使用を控えることをお勧めします[^1]。
- プレビューするファイルは、公開アクセス可能な URL である必要があります。通常、NocoBase にアップロードされたファイルは、アクセス可能な公開リンク（S3-Pro プラグインによって生成された署名付き URL を含む）を自動的に生成しますが、ファイルにアクセス権限が設定されている場合や、イントラネット環境に保存されている場合はプレビューできません[^2]。
- このサービスは、ログイン認証やプライベートストレージ内のリソースには対応していません。例えば、イントラネット内でのみアクセス可能なファイルや、ログインが必要なファイルはこのプレビュー機能を利用できません。
- ファイル内容はマイクロソフトのサービスによって取得された後、短期間キャッシュされる可能性があります。元のファイルが削除されても、プレビュー内容は一定期間アクセス可能な場合があります。
- ファイルサイズには推奨される制限があります。プレビューの安定性を確保するため、Word および PowerPoint ファイルは 10MB 以内、Excel ファイルは 5MB 以内を推奨します[^3]。
- このサービスには現在、公式な商用利用ライセンスに関する明確な説明がありません。利用にあたっては、ご自身でリスクを評価してください[^4]。

## サポートされているファイル形式

プラグインは、ファイルの MIME タイプまたは拡張子に基づいて、以下の Office ファイル形式のプレビューのみをサポートしています：

- Word ドキュメント：
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` （`.docx`）または `application/msword`（`.doc`）
- Excel スプレッドシート：
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` （`.xlsx`）または `application/vnd.ms-excel`（`.xls`）
- PowerPoint プレゼンテーション：
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` （`.pptx`）または `application/vnd.ms-powerpoint`（`.ppt`）
- OpenDocument テキスト：`application/vnd.oasis.opendocument.text`（`.odt`）

その他の形式のファイルでは、このプラグインのプレビュー機能は有効になりません。

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)