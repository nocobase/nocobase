:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Migration

Trong quá trình phát triển và cập nhật các plugin của NocoBase, cấu trúc cơ sở dữ liệu hoặc cấu hình của plugin có thể có những thay đổi không tương thích. Để đảm bảo quá trình nâng cấp diễn ra suôn sẻ, NocoBase cung cấp cơ chế **Migration** (di chuyển dữ liệu), cho phép bạn xử lý các thay đổi này bằng cách viết các tệp migration. Bài viết này sẽ hướng dẫn bạn tìm hiểu một cách có hệ thống về cách sử dụng và quy trình phát triển Migration.

## Khái niệm về Migration

Migration là một script tự động thực thi trong quá trình nâng cấp plugin, được sử dụng để giải quyết các vấn đề sau:

- Điều chỉnh cấu trúc bảng dữ liệu (như thêm trường, sửa đổi kiểu dữ liệu của trường, v.v.)
- Di chuyển dữ liệu (ví dụ: cập nhật hàng loạt giá trị trường)
- Cập nhật cấu hình hoặc logic nội bộ của plugin

Thời điểm thực thi Migration được chia thành ba loại:

| Loại | Thời điểm kích hoạt | Kịch bản thực thi |
|------|--------------------|-------------------|
| `beforeLoad` | Trước khi tất cả cấu hình plugin được tải | |
| `afterSync` | Sau khi cấu hình bộ sưu tập được đồng bộ hóa với cơ sở dữ liệu (cấu trúc bảng đã thay đổi) | |
| `afterLoad` | Sau khi tất cả cấu hình plugin được tải | |

## Tạo tệp Migration

Các tệp Migration nên được đặt trong thư mục `src/server/migrations/*.ts` của plugin. NocoBase cung cấp lệnh `create-migration` để nhanh chóng tạo các tệp migration.

```bash
yarn nocobase create-migration [options] <name>
```

Tham số tùy chọn

| Tham số | Mô tả |
|------|-----------|
| `--pkg <pkg>` | Chỉ định tên gói plugin |
| `--on [on]` | Chỉ định thời điểm thực thi, các tùy chọn: `beforeLoad`, `afterSync`, `afterLoad` |

Ví dụ

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Đường dẫn tệp migration được tạo như sau:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Nội dung ban đầu của tệp:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Viết logic nâng cấp tại đây
  }
}
```

> ⚠️ `appVersion` được sử dụng để xác định phiên bản mà quá trình nâng cấp hướng tới. Các môi trường có phiên bản nhỏ hơn phiên bản được chỉ định sẽ thực thi migration này.

## Viết Migration

Trong các tệp Migration, bạn có thể truy cập các thuộc tính và API phổ biến sau thông qua `this` để thuận tiện thao tác với cơ sở dữ liệu, plugin và các thể hiện ứng dụng:

Các thuộc tính phổ biến

- **`this.app`**  
  Thể hiện ứng dụng NocoBase hiện tại. Có thể được sử dụng để truy cập các dịch vụ toàn cục, plugin hoặc cấu hình.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  Thể hiện dịch vụ cơ sở dữ liệu, cung cấp các giao diện để thao tác với các mô hình (bộ sưu tập).  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  Thể hiện plugin hiện tại, có thể được sử dụng để truy cập các phương thức tùy chỉnh của plugin.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Thể hiện Sequelize, có thể trực tiếp thực thi SQL thô hoặc các thao tác giao dịch.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  QueryInterface của Sequelize, thường được sử dụng để sửa đổi cấu trúc bảng, ví dụ như thêm trường, xóa bảng, v.v.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Ví dụ về cách viết Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Sử dụng queryInterface để thêm trường
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Sử dụng db để truy cập các mô hình dữ liệu
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Thực thi phương thức tùy chỉnh của plugin
    await this.plugin.customMethod();
  }
}
```

Ngoài các thuộc tính phổ biến được liệt kê ở trên, Migration còn cung cấp nhiều API phong phú. Để biết tài liệu chi tiết, vui lòng tham khảo [Migration API](/api/server/migration).

## Kích hoạt Migration

Việc thực thi Migration được kích hoạt bởi lệnh `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

Trong quá trình nâng cấp, hệ thống sẽ xác định thứ tự thực thi dựa trên loại Migration và `appVersion`.

## Kiểm thử Migration

Trong quá trình phát triển plugin, bạn nên sử dụng **Mock Server** để kiểm thử xem migration có thực thi đúng cách hay không, nhằm tránh làm hỏng dữ liệu thật.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Tên plugin
      version: '0.18.0-alpha.5', // Phiên bản trước khi nâng cấp
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Viết logic xác thực, ví dụ: kiểm tra xem trường có tồn tại không, dữ liệu đã di chuyển thành công chưa
  });
});
```

> Tip: Sử dụng Mock Server có thể nhanh chóng mô phỏng các kịch bản nâng cấp và xác minh thứ tự thực thi Migration cũng như các thay đổi dữ liệu.

## Các khuyến nghị thực hành phát triển

1. **Tách Migration**  
   Mỗi lần nâng cấp, hãy cố gắng tạo một tệp migration duy nhất để duy trì tính nguyên tử và đơn giản hóa việc khắc phục sự cố.
2. **Chỉ định thời điểm thực thi**  
   Chọn `beforeLoad`, `afterSync` hoặc `afterLoad` dựa trên đối tượng thao tác, tránh phụ thuộc vào các module chưa được tải.
3. **Lưu ý về kiểm soát phiên bản**  
   Sử dụng `appVersion` để chỉ rõ phiên bản mà migration áp dụng, nhằm ngăn chặn việc thực thi lặp lại.
4. **Kiểm thử toàn diện**  
   Sau khi xác minh migration trên Mock Server, hãy thực hiện nâng cấp trong môi trường thực.