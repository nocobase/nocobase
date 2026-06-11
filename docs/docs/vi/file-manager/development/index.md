---
pkg: '@nocobase/plugin-file-manager'
title: "Phát triển mở rộng File Manager"
description: "Mở rộng storage engine tùy chỉnh (kế thừa StorageType, triển khai make/delete), mở rộng loại preview file frontend (filePreviewTypes.add, match, Previewer), kèm ví dụ code đầy đủ."
keywords: "phát triển mở rộng,StorageType,storage tùy chỉnh,filePreviewTypes,mở rộng preview file,File Manager,NocoBase"
---

# Phát triển mở rộng

## Mở rộng storage engine

### Server

1. **Kế thừa `StorageType`**
   
   Tạo class mới và triển khai các phương thức `make()` và `delete()`, khi cần thiết override các hook `getFileURL()`, `getFileStream()`, `getFileData()`, v.v.

Ví dụ:

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

4. **Đăng ký loại mới**  
   Trong vòng đời `beforeLoad` hoặc `load` của plugin, inject triển khai storage mới:

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

Sau khi đăng ký xong, cấu hình storage sẽ xuất hiện trong resource `storages` giống như các loại tích hợp sẵn. Cấu hình do `StorageType.defaults()` cung cấp có thể được dùng để tự động điền form hoặc khởi tạo bản ghi mặc định.

<!--
### Cấu hình client và giao diện quản lý
Phía client cần thông báo cho File Manager biết cách render form cấu hình và liệu có logic upload tùy chỉnh hay không. Mỗi object loại storage chứa các thuộc tính sau:
-->

## Mở rộng loại file frontend

Đối với các file đã upload xong, có thể hiển thị nội dung preview khác nhau trên giao diện frontend dựa trên loại file khác nhau. Field attachment của File Manager đã tích hợp sẵn preview file dựa trên trình duyệt (nhúng trong iframe), phương thức này hỗ trợ hầu hết các định dạng file (hình ảnh, video, audio, PDF, v.v.) preview trực tiếp trong trình duyệt. Khi định dạng file không hỗ trợ preview của trình duyệt, hoặc có nhu cầu tương tác preview đặc biệt, có thể mở rộng component preview dựa trên loại file để thực hiện.

### Ví dụ

Ví dụ muốn tích hợp preview trực tuyến tùy chỉnh cho file Office, có thể thực hiện qua đoạn code sau:

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

Trong đó `filePreviewTypes` là object entry do `@nocobase/plugin-file-manager/client` cung cấp dùng để mở rộng preview file. Sử dụng phương thức `add` mà nó cung cấp để mở rộng một object mô tả loại file.

Mỗi loại file phải triển khai phương thức `match()`, dùng để kiểm tra loại file có thỏa mãn yêu cầu hay không. Trong ví dụ, sử dụng `matchMimetype` để kiểm tra thuộc tính `mimetype` của file, nếu khớp loại `docx` thì xem là loại file cần xử lý. Nếu không khớp thành công, sẽ giảm xuống xử lý loại tích hợp sẵn.

Thuộc tính `Previewer` trên object mô tả loại chính là component dùng để preview, khi loại file khớp, component này sẽ được render để preview. Component này sẽ được render trong popup preview file, bạn có thể trả về bất kỳ React view nào (ví dụ iframe, player, chart, v.v.).

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

`filePreviewTypes` là một global instance, import qua `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Đăng ký object mô tả loại file mới vào trung tâm đăng ký loại file. Kiểu của object mô tả là `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Phương thức khớp định dạng file.

Tham số truyền vào `file` là object dữ liệu của file đã upload, chứa các thuộc tính liên quan có thể dùng để xác định loại:

* `mimetype`: mô tả mimetype
* `extname`: phần mở rộng file, bao gồm "."
* `path`: đường dẫn tương đối lưu trữ file
* `url`: URL file

Giá trị trả về kiểu `boolean`, biểu thị kết quả khớp hay không.

##### `getThumbnailURL`

Dùng để trả về địa chỉ thumbnail trong danh sách file. Khi giá trị trả về rỗng, sẽ sử dụng ảnh placeholder tích hợp sẵn.

##### `Previewer`

Component React dùng để preview file.

Tham số Props truyền vào là:

* `file`: object file hiện tại (có thể là URL chuỗi hoặc object chứa `url`/`preview`)
* `index`: index của file trong danh sách
* `list`: danh sách file
