---
title: "Phát triển tiện ích mở rộng trình quản lý tệp"
description: "Mở rộng thành phần xem trước loại tệp, tùy chỉnh trường tệp đính kèm và logic tải lên dựa trên các API như attachmentFileTypes, mime-match."
keywords: "tiện ích mở rộng trình quản lý tệp, tiện ích mở rộng trường tệp đính kèm, tiện ích mở rộng xem trước tệp,attachmentFileTypes,NocoBase"
---

# Phát triển tiện ích mở rộng

## Mở rộng loại tệp ở frontend

Đối với các tệp đã tải lên hoàn tất, giao diện frontend có thể hiển thị nội dung xem trước khác nhau dựa trên từng loại tệp. Trường tệp đính kèm của trình quản lý tệp tích hợp sẵn tính năng xem trước tệp dựa trên trình duyệt (được nhúng trong iframe). Phương thức này hỗ trợ xem trước trực tiếp trên trình duyệt đối với hầu hết các định dạng tệp (hình ảnh, video, âm thanh, PDF, v.v.). Khi định dạng tệp không được trình duyệt hỗ trợ xem trước hoặc cần tương tác xem trước đặc biệt, có thể mở rộng thành phần xem trước dựa trên loại tệp để thực hiện.

### Ví dụ

Ví dụ, nếu muốn mở rộng một thành phần chuyển đổi dạng carousel cho các tệp hình ảnh, có thể sử dụng đoạn mã sau:

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

Trong đó `attachmentFileTypes` là đối tượng đầu vào dùng để mở rộng loại tệp do gói `@nocobase/client` cung cấp; sử dụng phương thức `add` do đối tượng này cung cấp để mở rộng một đối tượng mô tả loại tệp.

Mỗi loại tệp phải triển khai phương thức `match()` để kiểm tra xem loại tệp có đáp ứng yêu cầu hay không. Trong ví dụ, phương thức do gói `mime-match` cung cấp được sử dụng để kiểm tra thuộc tính `mimetype` của tệp. Nếu khớp với loại `image/*` thì tệp được xem là loại cần xử lý. Nếu không khớp, hệ thống sẽ chuyển sang phương thức xử lý loại tệp tích hợp sẵn.

Thuộc tính `Previewer` trên đối tượng mô tả loại tệp là thành phần dùng để xem trước. Khi loại tệp khớp, thành phần này sẽ được render để xem trước. Thông thường, nên sử dụng thành phần dạng hộp thoại làm container cơ sở (chẳng hạn như `<Modal />`), sau đó đặt nội dung xem trước và nội dung cần tương tác vào thành phần đó để triển khai chức năng xem trước.

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

`attachmentFileTypes` là một instance toàn cục, được import thông qua `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Đăng ký đối tượng mô tả loại tệp mới vào trung tâm đăng ký loại tệp. Kiểu của đối tượng mô tả là `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Phương thức khớp định dạng tệp.

Tham số `file` là đối tượng dữ liệu của tệp đã tải lên, chứa các thuộc tính liên quan có thể dùng để xác định loại:

* `mimetype`: mô tả mimetype
* `extname`: phần mở rộng tệp, bao gồm “.”
* `path`: đường dẫn tương đối nơi tệp được lưu trữ
* `url`: URL của tệp

Giá trị trả về có kiểu `boolean`, biểu thị kết quả có khớp hay không.

##### `Previewer`

Thành phần React dùng để xem trước tệp.

Các tham số Props truyền vào gồm:

* `index`: chỉ mục của tệp trong danh sách tệp đính kèm
* `list`: danh sách tệp đính kèm
* `onSwitchIndex`: phương thức dùng để chuyển đổi chỉ mục

Trong đó, `onSwitchIndex` có thể nhận bất kỳ giá trị chỉ mục nào trong list để chuyển sang tệp khác. Nếu sử dụng `null` làm tham số chuyển đổi, thành phần xem trước sẽ được đóng trực tiếp.

```ts
onSwitchIndex(null);
```
