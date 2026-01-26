# Extension Development

## Extending Storage Engines

### Server-side

1. **Inherit `StorageType`**
   
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

4. **Register the new type**  
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

For example, if you want to integrate a custom online preview for Office files, you can use the following code:

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

Here, `filePreviewTypes` is the entry object provided by `@nocobase/plugin-file-manager/client` for extending file previews. Use its `add` method to extend a file type descriptor object.

Each file type must implement a `match()` method to check whether the file type meets the requirements. In the example, `matchMimetype` is used to check the file's `mimetype` attribute. If it matches the `docx` type, it is considered the file type to be handled. If it does not match, the built-in type handling will be used.

The `Previewer` property on the type descriptor object is the component used for previewing. When the file type matches, this component will be rendered in the preview dialog. You can return any React view (such as an iframe, player, or chart).

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

`filePreviewTypes` is a global instance, imported from `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Register a new file type descriptor object with the file type registry. The type of the descriptor object is `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

File format matching method.

The input parameter `file` is the data object of an uploaded file, containing relevant properties that can be used for type checking:

* `mimetype`: mimetype description
* `extname`: file extension, including "."
* `path`: relative storage path of the file
* `url`: file URL

Returns a `boolean` value indicating whether it matches.

##### `getThumbnailURL`

Returns the thumbnail URL used in the file list. If the return value is empty, the built-in placeholder image will be used.

##### `Previewer`

A React component for previewing files.

The incoming Props are:

* `file`: the current file object (may be a string URL or an object containing `url`/`preview`)
* `index`: index of the file in the list
* `list`: file list

