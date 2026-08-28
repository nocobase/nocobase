---
title: "ファイルマネージャー拡張開発"
description: "ファイルタイプのプレビューコンポーネント、カスタム添付ファイルフィールド、アップロードロジックを、attachmentFileTypes、mime-match などの API に基づいて拡張します。"
keywords: "ファイルマネージャー拡張,添付ファイルフィールド拡張,ファイルプレビュー拡張,attachmentFileTypes,NocoBase"
---

# 拡張開発

## フロントエンドのファイルタイプを拡張する

アップロード済みのファイルは、フロントエンドの画面上でファイルタイプに応じた異なるプレビュー内容を表示できます。ファイルマネージャーの添付ファイルフィールドには、ブラウザ（iframe に埋め込み）に基づくファイルプレビュー機能が組み込まれており、画像、動画、音声、PDF など、ほとんどのファイル形式をブラウザ上で直接プレビューできます。ファイル形式がブラウザでのプレビューに対応していない場合や、特別なプレビュー操作が必要な場合は、ファイルタイプに基づくプレビューコンポーネントを拡張して対応できます。

### 例

たとえば、画像タイプのファイルにカルーセル切り替えコンポーネントを拡張する場合は、次のコードで実装できます。

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

ここで `attachmentFileTypes` は、`@nocobase/client` パッケージが提供するファイルタイプ拡張用のエントリオブジェクトです。これが提供する `add` メソッドを使用して、ファイルタイプ記述オブジェクトを拡張します。

各ファイルタイプには、ファイルタイプが要件を満たしているかを確認する `match()` メソッドを実装する必要があります。例では、`mime-match` パッケージが提供するメソッドを使用してファイルの `mimetype` プロパティを検査し、`image/*` のタイプに一致した場合に、処理対象のファイルタイプとみなします。一致しない場合は、組み込みのタイプ処理にフォールバックします。

タイプ記述オブジェクトの `Previewer` プロパティがプレビュー用のコンポーネントです。ファイルタイプが一致すると、このコンポーネントをレンダリングしてプレビューします。通常は、まずモーダルタイプのコンポーネント（`<Modal />` など）を基本コンテナとして使用し、その中にプレビューおよび必要な操作コンテンツを配置して、プレビュー機能を実装することを推奨します。

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

`attachmentFileTypes` はグローバルインスタンスであり、`@nocobase/client` からインポートできます。

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

ファイルタイプ登録センターに新しいファイルタイプ記述オブジェクトを登録します。記述オブジェクトのタイプは `AttachmentFileType` です。

#### `AttachmentFileType`

##### `match()`

ファイル形式のマッチングメソッドです。

引数 `file` には、アップロード済みファイルのデータオブジェクトが渡されます。タイプ判定に使用できる関連プロパティが含まれています。

* `mimetype`：mimetype の説明
* `extname`：ファイル拡張子（「.」を含む）
* `path`：ファイルが保存されている相対パス
* `url`：ファイル URL

戻り値は `boolean` 型で、一致結果を示します。

##### `Previewer`

ファイルのプレビューに使用する React コンポーネントです。

Props パラメータは次のとおりです。

* `index`：添付ファイルリスト内のファイルのインデックス
* `list`：添付ファイルリスト
* `onSwitchIndex`：インデックスを切り替えるメソッド

`onSwitchIndex` には list 内の任意のインデックス値を渡して、別のファイルに切り替えることができます。`null` を引数として切り替えた場合は、プレビューコンポーネントを直接閉じます。

```ts
onSwitchIndex(null);
```
