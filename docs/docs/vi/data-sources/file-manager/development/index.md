---
title: "Phát triển mở rộng File Manager"
description: "Mở rộng component preview kiểu file, custom field attachment, logic upload, dựa trên các API như attachmentFileTypes, mime-match, v.v."
keywords: "Mở rộng file manager,Mở rộng field attachment,Mở rộng preview file,attachmentFileTypes,NocoBase"
---

# Phát triển mở rộng

## Mở rộng kiểu file frontend

Đối với các file đã upload xong, trên giao diện frontend có thể hiển thị nội dung preview khác nhau dựa trên các kiểu file khác nhau. Field attachment của file manager đã tích hợp preview file dựa trên trình duyệt (nhúng trong iframe), cách này hỗ trợ hầu hết các định dạng file (hình ảnh, video, audio và PDF, v.v.) trực tiếp preview trong trình duyệt. Khi định dạng file không hỗ trợ preview trên trình duyệt, hoặc có nhu cầu tương tác preview đặc biệt, có thể thực hiện thông qua việc mở rộng component preview dựa trên kiểu file.

### Ví dụ

Ví dụ muốn mở rộng một component carousel chuyển đổi cho file kiểu hình ảnh, có thể thực hiện theo cách code sau:

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

Trong đó `attachmentFileTypes` là object entry được cung cấp bởi package `@nocobase/client` để mở rộng kiểu file, sử dụng method `add` của nó để mở rộng một object mô tả kiểu file.

Mỗi kiểu file phải implement một method `match()`, dùng để kiểm tra kiểu file có thỏa mãn yêu cầu hay không, trong ví dụ thông qua method được cung cấp bởi package `mime-match` để kiểm tra thuộc tính `mimetype` của file, nếu match kiểu `image/*`, thì coi là kiểu file cần xử lý. Nếu match không thành công, sẽ rớt xuống xử lý kiểu mặc định tích hợp sẵn.

Thuộc tính `Previewer` trên object mô tả kiểu chính là component dùng để preview, khi kiểu file match, sẽ render component này để preview. Thông thường khuyến nghị sử dụng component dạng popup làm container cơ sở (ví dụ `<Modal />`, v.v.), rồi đặt nội dung preview và tương tác cần thiết vào component này, để thực hiện chức năng preview.

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

`attachmentFileTypes` là một global instance, được import thông qua `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Đăng ký object mô tả kiểu file mới vào registry kiểu file. Kiểu của object mô tả là `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Method match định dạng file.

Tham số `file` được truyền vào là object dữ liệu của file đã upload xong, chứa các thuộc tính liên quan có thể dùng để xác định kiểu:

* `mimetype`: Mô tả mimetype
* `extname`: Phần mở rộng file, bao gồm "."
* `path`: Đường dẫn tương đối lưu trữ file
* `url`: URL của file

Giá trị trả về là kiểu `boolean`, biểu thị kết quả có match hay không.

##### `Previewer`

React component dùng để preview file.

Tham số Props được truyền vào là:

* `index`: Index của file trong danh sách attachment
* `list`: Danh sách attachment
* `onSwitchIndex`: Method dùng để chuyển đổi index

Trong đó `onSwitchIndex` có thể truyền vào một giá trị index bất kỳ trong list, dùng để chuyển sang file khác. Nếu sử dụng `null` làm tham số chuyển, thì sẽ đóng trực tiếp component preview.

```ts
onSwitchIndex(null);
```
