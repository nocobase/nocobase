# Development

## Extend client file type

For uploaded files, the client UI can display different previews based on file types. The attachment field of file-manager uses a built-in browser-based (iframe) file preview capacity, supporting most file types (such as images, videos, audio, and PDFs) for direct preview in the browser. When a file type is not supported for browser preview or requires special interaction, additional preview components can be extended based on the file type.

### Example

For example, if you want to extend a carousel component for image files, you can use the following code:

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

The `attachmentFileTypes` is an entry object provided by the `@nocobase/client` package for extending file types. You can use its `add` method to extend a file type descriptor.

Each file type must implement a `match()` method to check if the file type meets the requirements. In the example, the `mime-match` package is used to check the file's `mimetype` attribute. If it matches `image/*`, it is considered a file type that needs processing. If it does not match, it will fall back to the built-in type.

The `Previewer` property on the type descriptor is the component used for previewing. When the file type matches, this component will be rendered for preview. It is generally recommended to use a modal component (like `<Modal />`) as the base container and place the preview and interactive content within that component to implement the preview functionality.

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

`attachmentFileTypes` is a global instance which could be imported from `@nocobase/client` package:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Register file type descriptor to the file type registry. The type of the descriptor is `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

The match method of file type.

The argument `file` is the uploaded file data object, including some properties could be used to check types.

* `mimetype`: Mimetype
* `extname`: Extension name of file, including "."
* `path`: Relative path of the file storing
* `url`: File URL

The return value type is `boolean`, means matched or not.

##### `Previewer`

Component used to preview file.

Props:

* `index`: Index value in attachemnts list
* `list`: Attachemnt list
* `onSwitchIndex`: Method to switch preview index

For `onSwitchIndex`, any index value in the list could be used, to switch to other file. If `null` is used as argument, the preview component will be closed.

```ts
onSwitchIndex(null);
```
