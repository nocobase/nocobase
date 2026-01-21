:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 拡張開発

## ストレージエンジンの拡張

### サーバーサイド

1.  **`StorageType` の継承**
    
    新しいクラスを作成し、`make()` メソッドと `delete()` メソッドを実装します。必要に応じて、`getFileURL()`、`getFileStream()`、`getFileData()` などのフックをオーバーライドしてください。

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

4.  **新しいタイプの登録**  
    プラグインの `beforeLoad` または `load` ライフサイクルで、新しいストレージ実装を注入します。

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

登録が完了すると、ストレージ設定は組み込みタイプと同様に `storages` リソースに表示されます。`StorageType.defaults()` が提供する設定は、フォームの自動入力やデフォルトレコードの初期化に利用できます。

### クライアントサイドの設定と管理インターフェース
クライアントサイドでは、ファイルマネージャーに設定フォームのレンダリング方法や、カスタムアップロードロジックの有無を伝える必要があります。各ストレージタイプオブジェクトには、以下のプロパティが含まれます。

## フロントエンドファイルタイプの拡張

アップロードされたファイルについて、フロントエンドのインターフェースでは、ファイルタイプに応じて異なるプレビューコンテンツを表示できます。ファイルマネージャーの添付ファイルフィールドには、ブラウザベースのファイルプレビュー（iframe に埋め込まれる形式）が組み込まれており、この方法でほとんどのファイル形式（画像、動画、音声、PDF など）をブラウザで直接プレビューできます。ファイル形式がブラウザでのプレビューに対応していない場合や、特別なプレビュー操作が必要な場合は、ファイルタイプに基づいたプレビューコンポーネントを拡張することで実現できます。

### 例

例えば、画像タイプのファイルにカルーセル切り替えコンポーネントを拡張したい場合は、以下のコードを使用できます。

```tsx
import React, { useCallback } from 'react';
import match from 'mime-match';
import { Plugin, attachmentFileTypes } from '@nocobase/client';

class MyPlugin extends Plugin {
  load() {
    attachmentFileTypes.add({
      match(file) {
        return match(file.mimetype, 'image/*');
      },
      Previewer({ index, list, onSwitchIndex }) {
        const onDownload = useCallback(
          (e) => {
            e.preventDefault();
            const file = list[index];
            saveAs(file.url, `${file.title}${file.extname}`);
          },
          [index, list],
        );
        return (
          <LightBox
            // discourageDownloads={true}
            mainSrc={list[index]?.url}
            nextSrc={list[(index + 1) % list.length]?.url}
            prevSrc={list[(index + list.length - 1) % list.length]?.url}
            onCloseRequest={() => onSwitchIndex(null)}
            onMovePrevRequest={() => onSwitchIndex((index + list.length - 1) % list.length)}
            onMoveNextRequest={() => onSwitchIndex((index + 1) % list.length)}
            imageTitle={list[index]?.title}
            toolbarButtons={[
              <button
                key={'preview-img'}
                style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
                type="button"
                aria-label="Download"
                title="Download"
                className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
                onClick={onDownload}
              >
                <DownloadOutlined />
              </button>,
            ]}
          />
        );
      },
    });
  }
}
```

ここで、`attachmentFileTypes` は `@nocobase/client` パッケージで提供される、ファイルタイプを拡張するためのエントリーオブジェクトです。この `add` メソッドを使用して、ファイルタイプ記述オブジェクトを拡張します。

各ファイルタイプは、ファイルタイプが要件を満たしているかを確認するための `match()` メソッドを実装する必要があります。この例では、`mime-match` パッケージが提供するメソッドを使用してファイルの `mimetype` 属性をチェックし、`image/*` タイプに一致する場合、処理対象のファイルタイプと見なされます。一致しなかった場合は、組み込みのタイプ処理にフォールバックされます。

タイプ記述オブジェクトの `Previewer` プロパティは、プレビューに使用されるコンポーネントです。ファイルタイプが一致すると、このコンポーネントがレンダリングされてプレビューが行われます。通常、`<Modal />` などのダイアログタイプのコンポーネントを基本コンテナとして使用し、その中にプレビューとインタラクティブなコンテンツを配置してプレビュー機能を実装することをお勧めします。

### API

```ts
export interface FileModel {
  id: number;
  filename: string;
  path: string;
  title: string;
  url: string;
  extname: string;
  size: number;
  mimetype: string;
}

export interface PreviewerProps {
  index: number;
  list: FileModel[];
  onSwitchIndex(index): void;
}

export interface AttachmentFileType {
  match(file: any): boolean;
  Previewer?: React.ComponentType<PreviewerProps>;
}

export class AttachmentFileTypes {
  add(type: AttachmentFileType): void;
}
```

#### `attachmentFileTypes`

`attachmentFileTypes` は、`@nocobase/client` からインポートされるグローバルインスタンスです。

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

ファイルタイプ登録センターに新しいファイルタイプ記述オブジェクトを登録します。記述オブジェクトのタイプは `AttachmentFileType` です。

#### `AttachmentFileType`

##### `match()`

ファイル形式のマッチングメソッドです。

引数 `file` は、アップロードされたファイルのデータオブジェクトであり、タイプ判定に使用できる関連プロパティを含んでいます。

*   `mimetype`：mimetype の説明
*   `extname`：ファイル拡張子（「.」を含む）
*   `path`：ファイルの相対保存パス
*   `url`：ファイル URL

戻り値は `boolean` 型で、マッチング結果を示します。

##### `Previewer`

ファイルをプレビューするための React コンポーネントです。

渡される Props パラメータは以下のとおりです。

*   `index`：添付ファイルリスト内のファイルのインデックス
*   `list`：添付ファイルリスト
*   `onSwitchIndex`：インデックスを切り替えるためのメソッド

この `onSwitchIndex` には、リスト内の任意のインデックス値を渡すことで、他のファイルに切り替えることができます。引数として `null` を渡すと、プレビューコンポーネントが直接閉じられます。

```ts
onSwitchIndex(null);
```