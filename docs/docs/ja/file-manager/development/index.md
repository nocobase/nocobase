:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 拡張開発

## ストレージエンジンの拡張

### サーバーサイド

1. **`StorageType` の継承**
   
   新しいクラスを作成し、`make()` と `delete()` を実装します。必要に応じて `getFileURL()`、`getFileStream()`、`getFileData()` などのフックをオーバーライドしてください。

例：

```ts
// packages/my-plugin/src/server/storages/custom.ts
import { AttachmentModel, StorageModel, StorageType } from '@nocobase/plugin-file-manager';
import type { StorageEngine } from 'multer';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export class CustomStorageType extends StorageType {
  make(): StorageEngine {
    return multer.diskStorage({
      destination: path.resolve('custom-uploads'),
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
  }

  async delete(records: AttachmentModel[]) {
    let deleted = 0;
    const failures: AttachmentModel[] = [];
    for (const record of records) {
      try {
        await fs.unlink(path.resolve('custom-uploads', record.path || '', record.filename));
        deleted += 1;
      } catch (error) {
        failures.push(record);
      }
    }
    return [deleted, failures];
  }
}
```

4. **新しいタイプを登録**  
   プラグインの `beforeLoad` または `load` ライフサイクルに新しいストレージ実装を注入します：

```ts
// packages/my-plugin/src/server/plugin.ts
import { Plugin } from '@nocobase/server';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { CustomStorageType } from './storages/custom';

export default class MyStoragePluginServer extends Plugin {
  async load() {
    const fileManager = this.app.pm.get(PluginFileManagerServer);
    fileManager.registerStorageType('custom-storage', CustomStorageType);
  }
}
```

登録後、ストレージ設定は組み込みタイプと同様に `storages` リソースに表示されます。`StorageType.defaults()` が提供する設定は、フォームの自動入力やデフォルトレコードの初期化に利用できます。

<!--
### クライアント側の設定と管理画面
クライアント側では、設定フォームの描画方法やカスタムアップロードロジックの有無をファイルマネージャーに伝える必要があります。各ストレージタイプのオブジェクトには以下のプロパティがあります：
-->

## フロントエンドのファイルタイプ拡張

アップロード済みのファイルについて、フロントエンドの画面でファイルタイプに応じた異なるプレビュー内容を表示できます。ファイルマネージャーの添付フィールドには、ブラウザ（iframe 内）でのファイルプレビューが組み込まれており、画像・動画・音声・PDF などの多くの形式をブラウザで直接プレビューできます。ブラウザが対応しない形式や特別なプレビュー操作が必要な場合は、ファイルタイプに基づくプレビューコンポーネントを拡張できます。

### 例

たとえば Office ファイルに対してカスタムのオンラインプレビューを統合したい場合、次のコードを使用できます：

```tsx
import React, { useMemo } from 'react';
import { Plugin, matchMimetype } from '@nocobase/client';
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';

class MyPlugin extends Plugin {
  load() {
    filePreviewTypes.add({
      match(file) {
        return matchMimetype(file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      },
      Previewer({ file }) {
        const url = useMemo(() => {
          const src =
            file.url.startsWith('https://') || file.url.startsWith('http://')
              ? file.url
              : `${location.origin}/${file.url.replace(/^\//, '')}`;
          const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
          u.searchParams.set('src', src);
          return u.href;
        }, [file.url]);
        return <iframe src={url} width="100%" height="600px" style={{ border: 'none' }} />;
      },
    });
  }
}
```

ここで `filePreviewTypes` は `@nocobase/plugin-file-manager/client` が提供するファイルプレビュー拡張のための入口オブジェクトです。`add` メソッドでファイルタイプの記述オブジェクトを追加します。

各ファイルタイプは `match()` メソッドを実装し、要件に合致するかを判定します。例では `matchMimetype` を使ってファイルの `mimetype` を確認し、`docx` に一致すれば処理対象とします。一致しない場合は組み込みのタイプ処理にフォールバックします。

タイプ記述オブジェクトの `Previewer` プロパティがプレビュー用コンポーネントです。ファイルタイプが一致すると、このコンポーネントがプレビューダイアログに描画されます。任意の React ビュー（iframe、プレイヤー、チャートなど）を返せます。

### API

```ts
export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
}

export interface FilePreviewType {
  match(file: any): boolean;
  getThumbnailURL?: (file: any) => string | null;
  Previewer?: React.ComponentType<FilePreviewerProps>;
}

export class FilePreviewTypes {
  add(type: FilePreviewType): void;
}
```

#### `filePreviewTypes`

`filePreviewTypes` は `@nocobase/plugin-file-manager/client` からインポートするグローバルインスタンスです：

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

ファイルタイプの登録センターに新しい記述オブジェクトを登録します。記述オブジェクトの型は `FilePreviewType` です。

#### `FilePreviewType`

##### `match()`

ファイル形式のマッチング方法。

入力パラメータ `file` はアップロード済みファイルのデータオブジェクトで、タイプ判定に使える属性を含みます：

* `mimetype`：mimetype の説明
* `extname`：拡張子（"." を含む）
* `path`：ファイルの相対保存パス
* `url`：ファイル URL

戻り値は `boolean` で、マッチするかどうかを示します。

##### `getThumbnailURL`

ファイル一覧で使うサムネイル URL を返します。返り値が空の場合は内蔵のプレースホルダー画像が使われます。

##### `Previewer`

ファイルをプレビューするための React コンポーネント。

受け取る Props は以下です：

* `file`：現在のファイルオブジェクト（文字列 URL または `url`/`preview` を含むオブジェクト）
* `index`：一覧内のファイルのインデックス
* `list`：ファイル一覧

