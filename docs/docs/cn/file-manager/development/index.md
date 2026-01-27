# 扩展开发

## 扩展存储引擎

### 服务端

1. **继承 `StorageType`**
   
   创建新的类并实现 `make()` 与 `delete()` 方法，必要时重写 `getFileURL()`、`getFileStream()`、`getFileData()` 等钩子。

示例：

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

4. **注册新类型**  
   在插件的 `beforeLoad` 或 `load` 生命周期中注入新的存储实现：

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

注册完成后，存储配置会和内置类型一样出现在 `storages` 资源中，`StorageType.defaults()` 提供的配置可用于自动填充表单或初始化默认记录。

<!--
### 客户端配置与管理界面
客户端侧需要告知文件管理器如何渲染配置表单以及是否拥有定制上传逻辑。每个存储类型对象包含以下属性：
-->

## 扩展前端文件类型

对于已上传完成的文件，在前端界面上可以基于不同文件类型展示不同预览内容。文件管理器的附件字段内置了基于浏览器（内嵌于 iframe）的文件预览，这种方式支持大部分文件格式（图片、视频、音频和 PDF 等）直接在浏览器中进行预览。当文件格式不支持浏览器预览，或者有特殊的预览交互需要时，可以通过扩展基于文件类型的预览组件来实现。

### 示例

例如希望对 Office 文件接入自定义在线预览，可以通过以下代码方式：

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

其中 `filePreviewTypes` 是 `@nocobase/plugin-file-manager/client` 提供的用于扩展文件预览的入口对象，使用其提供的 `add` 方法来扩展一个文件类型描述对象。

每个文件类型必须实现一个 `match()` 方法，用于检查文件类型是否满足要求。示例中通过 `matchMimetype` 对文件的 `mimetype` 属性进行检测，如果匹配 `docx` 的类型，则认为是需要处理的文件类型。如果未匹配成功，则会降级为内置的类型处理。

在类型描述对象上的 `Previewer` 属性即为用于预览的组件，当文件类型匹配时，将渲染该组件进行预览。该组件会渲染在文件预览弹层中，你可以返回任意 React 视图（例如 iframe、播放器、图表等）。

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

`filePreviewTypes` 是一个全局实例，通过 `@nocobase/plugin-file-manager/client` 导入：

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

向文件类型注册中心注册新的文件类型描述对象。描述对象的类型为 `FilePreviewType`。

#### `FilePreviewType`

##### `match()`

文件格式匹配方法。

传入参数 `file` 为已上传文件夹的数据对象，包含相关的属性可以用于类型判断：

* `mimetype`：mimetype 描述
* `extname`：文件后缀名，包含“.”
* `path`：文件储存的相对路径
* `url`：文件 URL

返回值为 `boolean` 类型，表示是否匹配的结果。

##### `getThumbnailURL`

用于返回文件列表里的缩略图地址。当返回值为空时，将使用内置占位图。

##### `Previewer`

用于预览文件的 React 组件。

传入 Props 参数为：

* `file`：当前文件对象（可能是字符串 URL 或包含 `url`/`preview` 的对象）
* `index`：文件在列表中的索引
* `list`：文件列表

