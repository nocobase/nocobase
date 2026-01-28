:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Phát triển mở rộng

## Mở rộng công cụ lưu trữ

### Phía máy chủ

1. **Kế thừa `StorageType`**
   
   Tạo lớp mới và triển khai các phương thức `make()` và `delete()`. Khi cần, ghi đè các hook như `getFileURL()`, `getFileStream()`, `getFileData()`.

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
   Tiêm triển khai lưu trữ mới vào vòng đời `beforeLoad` hoặc `load` của plugin:

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

Sau khi đăng ký, cấu hình lưu trữ sẽ xuất hiện trong tài nguyên `storages`, giống như các loại tích hợp sẵn. Cấu hình do `StorageType.defaults()` cung cấp có thể dùng để tự động điền biểu mẫu hoặc khởi tạo bản ghi mặc định.

<!--
### Cấu hình phía client và giao diện quản trị
Ở phía client, bạn cần cho trình quản lý tệp biết cách render biểu mẫu cấu hình và có hay không logic tải lên tùy chỉnh. Mỗi đối tượng loại lưu trữ chứa các thuộc tính sau:
-->

## Mở rộng loại tệp ở frontend

Đối với các tệp đã tải lên, bạn có thể hiển thị nội dung xem trước khác nhau trên giao diện frontend dựa trên loại tệp. Trường đính kèm của trình quản lý tệp có xem trước dựa trên trình duyệt (nhúng trong iframe), hỗ trợ xem trước hầu hết định dạng (như hình ảnh, video, âm thanh và PDF) trực tiếp trong trình duyệt. Khi định dạng tệp không được trình duyệt hỗ trợ hoặc cần tương tác xem trước đặc biệt, bạn có thể mở rộng thành phần xem trước theo loại tệp.

### Ví dụ

Ví dụ, nếu bạn muốn tích hợp xem trước trực tuyến tùy chỉnh cho tệp Office, bạn có thể dùng đoạn mã sau:

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

Ở đây `filePreviewTypes` là đối tượng đầu vào do `@nocobase/plugin-file-manager/client` cung cấp để mở rộng xem trước tệp. Dùng phương thức `add` để thêm đối tượng mô tả loại tệp.

Mỗi loại tệp phải triển khai phương thức `match()` để kiểm tra xem loại tệp có đáp ứng yêu cầu hay không. Trong ví dụ, `matchMimetype` được dùng để kiểm tra thuộc tính `mimetype` của tệp. Nếu khớp với loại `docx` thì được coi là loại cần xử lý. Nếu không khớp, sẽ dùng xử lý loại tích hợp sẵn.

Thuộc tính `Previewer` trong đối tượng mô tả loại là thành phần dùng để xem trước. Khi loại tệp khớp, thành phần này sẽ được render trong hộp thoại xem trước. Bạn có thể trả về bất kỳ React view nào (như iframe, trình phát hoặc biểu đồ).

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

`filePreviewTypes` là một instance toàn cục, được import từ `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Đăng ký một đối tượng mô tả loại tệp mới vào registry loại tệp. Kiểu của đối tượng mô tả là `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Phương thức khớp định dạng tệp.

Tham số đầu vào `file` là đối tượng dữ liệu của tệp đã tải lên, chứa các thuộc tính liên quan để kiểm tra loại:

* `mimetype`: mô tả mimetype
* `extname`: phần mở rộng tệp, bao gồm "."
* `path`: đường dẫn lưu trữ tương đối của tệp
* `url`: URL của tệp

Trả về giá trị `boolean` cho biết có khớp hay không.

##### `getThumbnailURL`

Trả về URL ảnh thu nhỏ dùng trong danh sách tệp. Nếu giá trị trả về trống, ảnh placeholder tích hợp sẽ được dùng.

##### `Previewer`

Thành phần React để xem trước tệp.

Các props đầu vào:

* `file`: đối tượng tệp hiện tại (có thể là URL dạng chuỗi hoặc đối tượng chứa `url`/`preview`)
* `index`: chỉ số của tệp trong danh sách
* `list`: danh sách tệp

