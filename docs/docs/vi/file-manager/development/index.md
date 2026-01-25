:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Phát triển mở rộng

## Mở rộng công cụ lưu trữ

### Phía máy chủ

1.  **Kế thừa `StorageType`**

    Tạo một lớp mới và triển khai các phương thức `make()` và `delete()`. Nếu cần, ghi đè các hook như `getFileURL()`, `getFileStream()`, `getFileData()`.

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

4.  **Đăng ký loại mới**
    Chèn triển khai lưu trữ mới vào vòng đời `beforeLoad` hoặc `load` của plugin:

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

Sau khi đăng ký, cấu hình lưu trữ sẽ xuất hiện trong tài nguyên `storages`, tương tự như các loại tích hợp sẵn. Cấu hình do `StorageType.defaults()` cung cấp có thể được sử dụng để tự động điền biểu mẫu hoặc khởi tạo các bản ghi mặc định.

### Phía máy khách: Cấu hình và giao diện quản lý
Ở phía máy khách, bạn cần thông báo cho trình quản lý tệp biết cách hiển thị biểu mẫu cấu hình và liệu có logic tải lên tùy chỉnh hay không. Mỗi đối tượng loại lưu trữ bao gồm các thuộc tính sau:

## Mở rộng các loại tệp phía giao diện người dùng

Đối với các tệp đã tải lên, bạn có thể hiển thị nội dung xem trước khác nhau trên giao diện người dùng dựa trên các loại tệp khác nhau. Trường tệp đính kèm của trình quản lý tệp có tính năng xem trước tệp tích hợp sẵn dựa trên trình duyệt (nhúng trong iframe), hỗ trợ xem trước trực tiếp hầu hết các định dạng tệp (như hình ảnh, video, âm thanh và PDF) trong trình duyệt. Khi một định dạng tệp không được trình duyệt hỗ trợ xem trước hoặc khi cần các tương tác xem trước đặc biệt, bạn có thể mở rộng thành phần xem trước dựa trên loại tệp để thực hiện điều này.

### Ví dụ

Ví dụ, để mở rộng loại tệp hình ảnh với một thành phần chuyển đổi băng chuyền (carousel), bạn có thể sử dụng đoạn mã sau:

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

Trong đó, `attachmentFileTypes` là đối tượng điểm truy cập được cung cấp trong gói `@nocobase/client` để mở rộng các loại tệp. Bạn sử dụng phương thức `add` của nó để mở rộng một đối tượng mô tả loại tệp.

Mỗi loại tệp phải triển khai một phương thức `match()` để kiểm tra xem loại tệp có đáp ứng yêu cầu hay không. Trong ví dụ, phương thức được cung cấp bởi gói `mime-match` được sử dụng để kiểm tra thuộc tính `mimetype` của tệp. Nếu nó khớp với loại `image/*`, thì đó được coi là loại tệp cần xử lý. Nếu không khớp thành công, nó sẽ quay về cách xử lý loại tệp tích hợp sẵn.

Thuộc tính `Previewer` trên đối tượng mô tả loại tệp chính là thành phần được sử dụng để xem trước. Khi loại tệp khớp, thành phần này sẽ được hiển thị để xem trước. Thông thường, bạn nên sử dụng một thành phần dạng hộp thoại (như `<Modal />` v.v.) làm vùng chứa cơ sở, sau đó đặt nội dung xem trước và các tương tác cần thiết vào thành phần đó để triển khai chức năng xem trước.

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

`attachmentFileTypes` là một thể hiện toàn cục, được nhập từ `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Đăng ký một đối tượng mô tả loại tệp mới vào trung tâm đăng ký loại tệp. Loại của đối tượng mô tả là `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Phương thức khớp định dạng tệp.

Tham số đầu vào `file` là đối tượng dữ liệu của một tệp đã tải lên, chứa các thuộc tính liên quan có thể được sử dụng để xác định loại:

*   `mimetype`: mô tả mimetype
*   `extname`: phần mở rộng của tệp, bao gồm dấu "."
*   `path`: đường dẫn lưu trữ tương đối của tệp
*   `url`: URL của tệp

Giá trị trả về là kiểu `boolean`, cho biết kết quả khớp.

##### `Previewer`

Một thành phần React dùng để xem trước tệp.

Các tham số Props được truyền vào là:

*   `index`: Chỉ mục của tệp trong danh sách tệp đính kèm
*   `list`: Danh sách tệp đính kèm
*   `onSwitchIndex`: Phương thức dùng để chuyển đổi chỉ mục

Trong đó, `onSwitchIndex` có thể nhận bất kỳ giá trị chỉ mục nào từ danh sách để chuyển sang tệp khác. Nếu truyền `null` làm tham số để chuyển đổi, thành phần xem trước sẽ đóng trực tiếp.

```ts
onSwitchIndex(null);
```