:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/get-started/translations)をご参照ください。
:::

# 翻訳への貢献

NocoBase のデフォルト言語は英語です。現在、メインアプリケーションは英語、イタリア語、オランダ語、簡体字中国語、および日本語をサポートしています。世界中のユーザーがより便利に NocoBase を利用できるよう、他の言語の翻訳への貢献を心よりお待ちしております。

---

## 一、 システムのローカライズ

### 1. システムインターフェースとプラグインの翻訳

#### 1.1 翻訳の範囲
これは NocoBase のシステムインターフェースとプラグインのローカライズのみに適用され、その他のカスタムコンテンツ（データテーブルや Markdown ブロックなど）は含まれません。

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 ローカライズ内容の概要
NocoBase は Git を使用してローカライズ内容を管理しています。メインリポジトリは以下の通りです：
https://github.com/nocobase/nocobase/tree/main/locales

各言語は、言語コードで命名された JSON ファイル（例：de-DE.json、fr-FR.json）で表されます。ファイル構造はプラグインモジュールごとに整理されており、キーと値のペアを使用して翻訳を保存します。例：

```json
{
  // クライアントプラグイン
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...その他のキーと値のペア
  },
  "@nocobase/plugin-acl": {
    // このプラグインのキーと値のペア
  }
  // ...その他のプラグインモジュール
}
```

翻訳する際は、以下のような構造に段階的に変換してください：

```json
{
  // クライアントプラグイン
  "@nocobase/client": {
    "(Fields only)": "(フィールドのみ - 翻訳済み)",
    "12 hour": "12時間",
    "24 hour": "24時間"
    // ...その他のキーと値のペア
  },
  "@nocobase/plugin-acl": {
    // このプラグインのキーと値のペア
  }
  // ...その他のプラグインモジュール
}
```

#### 1.3 翻訳のテストと同期
- 翻訳が完了したら、すべてのテキストが正しく表示されるかテストして確認してください。
また、翻訳検証プラグインも公開しています。プラグインマーケットプレイスで `Locale tester` を検索してください。
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
インストール後、Git リポジトリ内の対応するローカライズファイルから JSON コンテンツをコピーして貼り付け、「確定」をクリックして翻訳内容が反映されるか確認します。
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- 提出後、システムスクリプトによってローカライズ内容がコードリポジトリに自動的に同期されます。

#### 1.4 NocoBase 2.0 ローカライズプラグイン

> **注意：** このセクションは開発中です。NocoBase 2.0 のローカライズプラグインは 1.x バージョンといくつかの違いがあります。詳細は今後の更新で提供される予定です。

<!-- TODO: 2.0 ローカライズプラグインの違いに関する詳細を追加 -->

## 二、 ドキュメントのローカライズ（NocoBase 2.0）

NocoBase 2.0 のドキュメントは新しい構造で管理されています。ドキュメントのソースファイルは NocoBase のメインリポジトリにあります：

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 ドキュメント構造

ドキュメントは静的サイトジェネレーターとして [Rspress](https://rspress.dev/) を使用しており、22 言語をサポートしています。構造は以下の通りです：

```
docs/
├── docs/
│   ├── en/                    # 英語（ソース言語）
│   ├── cn/                    # 簡体字中国語
│   ├── ja/                    # 日本語
│   ├── ko/                    # 韓国語
│   ├── de/                    # ドイツ語
│   ├── fr/                    # フランス語
│   ├── es/                    # スペイン語
│   ├── pt/                    # ポルトガル語
│   ├── ru/                    # ロシア語
│   ├── it/                    # イタリア語
│   ├── tr/                    # トルコ語
│   ├── uk/                    # ウクライナ語
│   ├── vi/                    # ベトナム語
│   ├── id/                    # インドネシア語
│   ├── th/                    # タイ語
│   ├── pl/                    # ポーランド語
│   ├── nl/                    # オランダ語
│   ├── cs/                    # チェコ語
│   ├── ar/                    # アラビア語
│   ├── he/                    # ヘブライ語
│   ├── hi/                    # ヒンディー語
│   ├── sv/                    # スウェーデン語
│   └── public/                # 共有リソース（画像など）
├── theme/                     # カスタムテーマ
├── rspress.config.ts          # Rspress 設定
└── package.json
```

### 2.2 翻訳ワークフロー

1. **英語ソースとの同期**：すべての翻訳は英語ドキュメント（`docs/en/`）に基づいている必要があります。英語ドキュメントが更新された場合、翻訳もそれに応じて更新する必要があります。

2. **ブランチ戦略**：
   - 最新の英語コンテンツの参照として `develop` または `next` ブランチを使用します。
   - ターゲットブランチから翻訳用ブランチを作成します。

3. **ファイル構造**：各言語ディレクトリは英語のディレクトリ構造をミラーリングする必要があります。例：
   ```
   docs/en/get-started/index.md    →    docs/ja/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/ja/api/acl/acl.md
   ```

### 2.3 翻訳への貢献方法

1. リポジトリをフォークする：https://github.com/nocobase/nocobase
2. フォークしたリポジトリをクローンし、`develop` または `next` ブランチをチェックアウトする
3. `docs/docs/` ディレクトリに移動する
4. 貢献したい言語のディレクトリ（例：日本語なら `ja/`）を見つける
5. 英語バージョンと同じファイル構造を維持しながら、Markdown ファイルを翻訳する
6. ローカルで変更をテストする：
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. メインリポジトリにプルリクエストを送信する

### 2.4 翻訳ガイドライン

- **フォーマットの一貫性を保つ**：ソースファイルと同じ Markdown 構造、見出し、コードブロック、リンクを維持してください。
- **フロントマター（frontmatter）を保持する**：ファイル上部の YAML フロントマターは、翻訳可能なコンテンツが含まれていない限り、変更しないでください。
- **画像の参照**：`docs/public/` の同じ画像パスを使用してください。画像はすべての言語間で共有されます。
- **内部リンク**：内部リンクを正しい言語パスを指すように更新してください。
- **コード例**：通常、コード例は翻訳すべきではありませんが、コード内のコメントは翻訳しても構いません。

### 2.5 ナビゲーション設定

各言語のナビゲーション構造は、各言語ディレクトリ内の `_nav.json` および `_meta.json` ファイルで定義されています。新しいページやセクションを追加する場合は、必ずこれらの設定ファイルを更新してください。

## 三、 公式サイトのローカライズ

公式サイトのページとすべてのコンテンツは以下に保存されています：
https://github.com/nocobase/website

### 3.1 入門と参照リソース

新しい言語を追加する際は、既存の言語ページを参考にしてください：
- 英語：https://github.com/nocobase/website/tree/main/src/pages/en
- 中国語：https://github.com/nocobase/website/tree/main/src/pages/cn
- 日本語：https://github.com/nocobase/website/tree/main/src/pages/ja

![公式サイトローカライズ図示](https://static-docs.nocobase.com/20250319121600.png)

グローバルスタイルの修正場所：
- 英語：https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- 中国語：https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- 日本語：https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![グローバルスタイル図示](https://static-docs.nocobase.com/20250319121501.png)

公式サイトのグローバルコンポーネントのローカライズ場所：
https://github.com/nocobase/website/tree/main/src/components

![公式サイトコンポーネント図示](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 コンテンツ構造とローカライズ方法

混合型のコンテンツ管理アプローチを採用しています。英語、中国語、日本語のコンテンツとリソースは、CMS システムから定期的に同期・上書きされますが、その他の言語はローカルファイルで直接編集できます。ローカルコンテンツは `content` ディレクトリに保存され、以下のように構成されています：

```
/content
  /articles        # ブログ記事
    /article-slug
      index.md     # 英語コンテンツ（デフォルト）
      index.cn.md  # 中国語コンテンツ
      index.ja.md  # 日本語コンテンツ
      metadata.json # メタデータとその他のローカライズ属性
  /tutorials       # チュートリアル
  /releases        # リリース情報
  /pages           # 一部の静的ページ
  /categories      # カテゴリ情報
    /article-categories.json  # 記事カテゴリリスト
    /category-slug            # 個別カテゴリ詳細
      /category.json
  /tags            # タグ情報
    /article-tags.json        # 記事タグリスト
    /release-tags.json        # リリースタグリスト
    /tag-slug                 # 個別タグ詳細
      /tag.json
  /help-center     # ヘルプセンターのコンテンツ
    /help-center-tree.json    # ヘルプセンターのナビゲーション構造
  ....
```

### 3.3 コンテンツ翻訳ガイドライン

- Markdown コンテンツの翻訳について

1. デフォルトファイルに基づいて新しい言語ファイルを作成します（例：`index.md` から `index.fr.md`）
2. JSON ファイルの対応するフィールドにローカライズ属性を追加します
3. ファイル構造、リンク、画像の参照の一貫性を維持します

- JSON コンテンツの翻訳
多くのコンテンツメタデータは JSON ファイルに保存されており、通常は多言語フィールドが含まれています：

```json
{
  "id": 123,
  "title": "English Title",       // 英語タイトル（デフォルト）
  "title_cn": "中文标题",          // 中国語タイトル
  "title_ja": "日本語タイトル",    // 日本語タイトル
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // URL パス（通常は翻訳しない）
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**翻訳時の注意点：**

1. **フィールドの命名規則**：翻訳フィールドは通常 `{元のフィールド}_{言語コード}` の形式を使用します。
   - 例：title_fr（フランス語タイトル）、description_de（ドイツ語の説明）

2. **新しい言語を追加する場合**：
   - 翻訳が必要な各フィールドに対して、対応する言語サフィックス版を追加します。
   - 元のフィールド値（title、description など）はデフォルト言語（英語）のコンテンツとして機能するため、変更しないでください。

3. **CMS 同期メカニズム**：
   - CMS システムは定期的に英語、中国語、日本語のコンテンツを更新します。
   - システムはこれら 3 言語のコンテンツ（JSON 内の特定の属性）のみを更新/上書きし、他の貢献者が追加した言語フィールドを**削除することはありません**。
   - 例：フランス語の翻訳（title_fr）を追加した場合、CMS の同期がこのフィールドに影響を与えることはありません。


### 3.4 新しい言語サポートの設定

新しい言語のサポートを追加するには、`src/utils/index.ts` ファイル内の `SUPPORTED_LANGUAGES` 設定を修正する必要があります：

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // 新しい言語の追加例：
  fr: {
    code: 'fr',
    locale: 'fr-FR',
    name: 'French'
  }
};
```

### 3.5 レイアウトファイルとスタイル

各言語には対応するレイアウトファイルが必要です：

1. 新しいレイアウトファイルを作成します（例：フランス語の場合、`src/layouts/BaseFR.astro` を作成）
2. 既存のレイアウトファイル（`BaseEN.astro` など）をコピーして翻訳できます
3. レイアウトファイルには、ナビゲーションメニューやフッターなどのグローバル要素の翻訳が含まれます
4. 言語スイッチャーの設定を更新して、新しく追加された言語に正しく切り替えられるようにしてください

### 3.6 言語ページディレクトリの作成

新しい言語用に独立したページディレクトリを作成します：

1. `src` ディレクトリ内に言語コードで命名されたフォルダを作成します（例：`src/fr/`）
2. 他の言語ディレクトリ（例：`src/en/`）からページ構造をコピーします
3. ページコンテンツを更新し、タイトル、説明、テキストをターゲット言語に翻訳します
4. ページが正しいレイアウトコンポーネントを使用していることを確認してください（例：`.layout: '@/layouts/BaseFR.astro'`）

### 3.7 コンポーネントのローカライズ

一部の共通コンポーネントも翻訳が必要です：

1. `src/components/` ディレクトリ内のコンポーネントを確認します
2. 固定テキストを持つコンポーネント（ナビゲーションバー、フッターなど）に特に注意してください
3. コンポーネントは条件付きレンダリングを使用して、異なる言語のコンテンツを表示する場合があります：

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/fr') && <p>Contenu français</p>}
```

### 3.8 テストと検証

翻訳が完了したら、包括的なテストを行ってください：

1. ローカルでサイトを実行します（通常は `yarn dev`）
2. 新しい言語ですべてのページが正しく表示されるか確認します
3. 言語切り替え機能が正常に動作するか検証します
4. すべてのリンクが正しい言語バージョンのページを指していることを確認します
5. レスポンシブレイアウトを確認し、翻訳されたテキストがページデザインを崩していないかチェックします

## 四、 翻訳の始め方

NocoBase の新しい言語翻訳に貢献したい場合は、以下の手順に従ってください：

| コンポーネント | リポジトリ | ブランチ | 備考 |
|------|------|------|------|
| システムインターフェース | https://github.com/nocobase/nocobase/tree/main/locales | main | JSON ローカライズファイル |
| ドキュメント（2.0） | https://github.com/nocobase/nocobase | develop / next | `docs/docs/<lang>/` ディレクトリ |
| 公式サイト | https://github.com/nocobase/website | main | 第三節を参照 |

翻訳が完了したら、NocoBase にプルリクエストを送信してください。新しい言語はシステム設定に表示され、表示する言語を選択できるようになります。

![言語の有効化図示](https://static-docs.nocobase.com/20250319123452.png)

## NocoBase 1.x ドキュメント

NocoBase 1.x の翻訳ガイドについては、以下を参照してください：

https://docs.nocobase.com/welcome/community/translations