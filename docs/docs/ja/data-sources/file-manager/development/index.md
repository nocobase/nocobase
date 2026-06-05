:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 拡張開発

## フロントエンドのファイルタイプを拡張する

アップロード済みのファイルは、フロントエンドのUI上でファイルタイプに応じて異なるプレビューコンテンツを表示できます。ファイルマネージャーの添付ファイルフィールドには、ブラウザベース（iframeに埋め込み）のファイルプレビュー機能が組み込まれており、画像、動画、音声、PDFなど、ほとんどのファイル形式をブラウザで直接プレビューできます。ブラウザでのプレビューに対応していないファイル形式や、特別なプレビュー操作が必要な場合は、ファイルタイプに基づいたプレビューコンポーネントを拡張することで実現できます。

### 例

例えば、画像ファイルタイプに対してカルーセル切り替えコンポーネントを拡張したい場合は、以下のコードを使用します。

```ts
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

`attachmentFileTypes` は、`@nocobase/client` パッケージで提供されている、ファイルタイプを拡張するためのエントリーオブジェクトです。この `add` メソッドを使用して、ファイルタイプディスクリプターを拡張します。

各ファイルタイプは、ファイルタイプが要件を満たしているかを確認するための `match()` メソッドを実装する必要があります。この例では、`mime-match` パッケージが提供するメソッドを使ってファイルの `mimetype` 属性をチェックしています。`image/*` のタイプに一致する場合、処理が必要なファイルタイプと見なされます。一致しなかった場合は、組み込みのタイプ処理にフォールバックされます。

タイプディスクリプターオブジェクトの `Previewer` プロパティは、プレビューに使用されるコンポーネントです。ファイルタイプが一致すると、このコンポーネントがレンダリングされてプレビューが表示されます。通常、`<Modal />` のようなモーダルタイプのコンポーネントを基本コンテナとして使用し、その中にプレビューとインタラクティブなコンテンツを配置してプレビュー機能を実装することをお勧めします。

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

ファイルタイプレジストリに新しいファイルタイプディスクリプターオブジェクトを登録します。ディスクリプターのタイプは `AttachmentFileType` です。

#### `AttachmentFileType`

##### `match()`

ファイル形式のマッチングメソッドです。

引数 `file` は、アップロードされたファイルのデータオブジェクトで、タイプ判定に使用できる関連プロパティが含まれています。

*   `mimetype`: ファイルのMIMEタイプです。
*   `extname`: ファイルの拡張子です（"."を含む）。
*   `path`: ファイルの相対保存パスです。
*   `url`: ファイルのURLです。

戻り値は `boolean` 型で、一致したかどうかの結果を示します。

##### `Previewer`

ファイルをプレビューするためのReactコンポーネントです。

渡されるPropsパラメータは以下の通りです。

*   `index`: 添付ファイルリスト内でのファイルのインデックスです。
*   `list`: 添付ファイルのリストです。
*   `onSwitchIndex`: インデックスを切り替えるためのメソッドです。

`onSwitchIndex` には、`list` 内の任意のインデックス値を渡すことで、他のファイルに切り替えることができます。`null` を引数として渡すと、プレビューコンポーネントは直接閉じられます。

```ts
onSwitchIndex(null);
```