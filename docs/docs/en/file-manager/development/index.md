# Extension Development

## Extending Storage Engines

### Server-side

1.  **Inherit `StorageType`**
    
    Create a new class and implement the `make()` and `delete()` methods, and override hooks like `getFileURL()`, `getFileStream()`, `getFileData()` if necessary.

Example:

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

4.  **Register the new type**  
    Inject the new storage implementation in the plugin's `beforeLoad` or `load` lifecycle:

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

After registration, the storage configuration will appear in the `storages` resource, just like the built-in types. The configuration provided by `StorageType.defaults()` can be used to auto-fill forms or initialize default records.

<!--
### Client-side Configuration and Management Interface
On the client-side, you need to inform the file manager how to render the configuration form and whether there is custom upload logic. Each storage type object contains the following properties:
-->

## Extending Frontend File Types

For uploaded files, you can display different preview content on the frontend interface based on different file types. The file manager's attachment field has a built-in browser-based file preview (embedded in an iframe), which supports previewing most file formats (such as images, videos, audio, and PDFs) directly in the browser. When a file format is not supported by the browser for preview, or when special preview interactions are required, you can extend the file type-based preview component.

### Example

For example, to extend an image file type with a carousel component, you can use the following code:

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

Here, `attachmentFileTypes` is the entry object provided in the `@nocobase/client` package for extending file types. Use its `add` method to extend a file type description object.

Each file type must implement a `match()` method to check if the file type meets the requirements. In the example, the method provided by the `mime-match` package is used to check the file's `mimetype` attribute. If it matches the `image/*` type, it is considered the file type to be processed. If no match is found, it will fall back to the built-in type handling.

The `Previewer` property on the type description object is the component used for previewing. When the file type matches, this component will be rendered for preview. It is generally recommended to use a dialog-type component (such as `<Modal />`) as the base container, and then place the preview and interactive content within it to implement the preview functionality.

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

`attachmentFileTypes` is a global instance, imported from `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registers a new file type description object with the file type registry. The type of the description object is `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

File format matching method.

The input parameter `file` is the data object of an uploaded file, containing relevant properties that can be used for type checking:

*   `mimetype`: mimetype description
*   `extname`: file extension, including the "."
*   `path`: relative storage path of the file
*   `url`: file URL

Returns a `boolean` value indicating whether it matches.

##### `Previewer`

A React component for previewing files.

The incoming Props are:

*   `index`: The index of the file in the attachment list
*   `list`: The attachment list
*   `onSwitchIndex`: A method for switching the index

The `onSwitchIndex` can be passed any index from the list to switch to another file. If `null` is passed as the argument, the preview component will be closed directly.

```ts
onSwitchIndex(null);
```
