:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# コンテキスト変数の使用

コンテキスト変数を使用すると、現在のページ、ユーザー、時間、フィルター条件などの情報を再利用して、コンテキストに基づいてチャートをレンダリングし、連携させることができます。

## 適用範囲
- データクエリのビルダーモードで、フィルター条件に変数を指定して使用します。
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- データクエリのSQLモードでステートメントを記述する際、変数を選択して式を挿入します（例：`{{ ctx.user.id }}`）。
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- チャートオプションのカスタムモードで、JS式を直接記述します。
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- インタラクションイベント（例：ドリルダウンでダイアログを開き、データを渡す場合など）で、JS式を直接記述します。
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**注意点：**
- `{{ ... }}` をシングルクォートやダブルクォートで囲まないでください。バインディング時にシステムが変数タイプ（文字列、数値、時間、NULL）に基づいて安全に処理します。
- 変数が `NULL` または未定義の場合、SQLで `COALESCE(...)` または `IS NULL` を使用して、NULL値を明示的に処理してください。