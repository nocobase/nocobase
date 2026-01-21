:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Phát triển mở rộng

## Mở rộng các loại tệp tin giao diện người dùng

Đối với các tệp tin đã được tải lên, giao diện người dùng có thể hiển thị các nội dung xem trước khác nhau tùy thuộc vào loại tệp. Trường đính kèm của trình quản lý tệp tin tích hợp sẵn tính năng xem trước tệp tin dựa trên trình duyệt (nhúng trong iframe), hỗ trợ hầu hết các định dạng tệp (như hình ảnh, video, âm thanh và PDF) để xem trước trực tiếp trong trình duyệt. Khi định dạng tệp không được trình duyệt hỗ trợ xem trước, hoặc khi cần có tương tác xem trước đặc biệt, quý vị có thể mở rộng các thành phần xem trước dựa trên loại tệp để thực hiện.

### Ví dụ

Ví dụ, nếu quý vị muốn mở rộng một thành phần chuyển đổi dạng băng chuyền (carousel) cho các tệp tin hình ảnh, quý vị có thể sử dụng đoạn mã sau:

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

Trong đó, `attachmentFileTypes` là đối tượng điểm vào được cung cấp trong gói `@nocobase/client` để mở rộng các loại tệp tin. Quý vị có thể sử dụng phương thức `add` của nó để mở rộng một đối tượng mô tả loại tệp tin.

Mỗi loại tệp tin phải triển khai một phương thức `match()` để kiểm tra xem loại tệp có đáp ứng yêu cầu hay không. Trong ví dụ, phương thức được cung cấp bởi gói `mime-match` được sử dụng để kiểm tra thuộc tính `mimetype` của tệp. Nếu khớp với loại `image/*`, tệp đó sẽ được coi là loại tệp cần xử lý. Nếu không khớp, hệ thống sẽ quay về xử lý theo loại tệp tích hợp sẵn.

Thuộc tính `Previewer` trên đối tượng mô tả loại tệp chính là thành phần được sử dụng để xem trước. Khi loại tệp khớp, thành phần này sẽ được hiển thị để xem trước. Thông thường, quý vị nên sử dụng một thành phần dạng hộp thoại (như `<Modal />` v.v.) làm vùng chứa cơ bản, sau đó đặt nội dung xem trước và các tương tác cần thiết vào thành phần đó để triển khai chức năng xem trước.

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

`attachmentFileTypes` là một thể hiện toàn cục, được nhập từ gói `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Đăng ký một đối tượng mô tả loại tệp tin mới vào trung tâm đăng ký loại tệp tin. Loại của đối tượng mô tả là `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Phương thức khớp định dạng tệp tin.

Tham số `file` được truyền vào là một đối tượng dữ liệu của tệp tin đã tải lên, chứa các thuộc tính liên quan có thể được sử dụng để xác định loại tệp:

*   `mimetype`: Mô tả mimetype của tệp.
*   `extname`: Phần mở rộng của tệp, bao gồm dấu ".".
*   `path`: Đường dẫn tương đối của tệp tin đã lưu trữ.
*   `url`: URL của tệp tin.

Giá trị trả về là kiểu `boolean`, cho biết kết quả có khớp hay không.

##### `Previewer`

Thành phần React dùng để xem trước tệp tin.

Các tham số Props được truyền vào là:

*   `index`: Chỉ mục của tệp tin trong danh sách đính kèm.
*   `list`: Danh sách các tệp đính kèm.
*   `onSwitchIndex`: Phương thức dùng để chuyển đổi chỉ mục.

Trong đó, `onSwitchIndex` có thể nhận bất kỳ giá trị chỉ mục nào từ `list` để chuyển sang tệp tin khác. Nếu sử dụng `null` làm tham số để chuyển đổi, thành phần xem trước sẽ được đóng trực tiếp.

```ts
onSwitchIndex(null);
```