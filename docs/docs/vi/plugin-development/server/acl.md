:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Kiểm soát quyền ACL

ACL (Access Control List) được sử dụng để kiểm soát quyền thao tác tài nguyên. Bạn có thể cấp quyền cho các vai trò, hoặc bỏ qua các ràng buộc vai trò để trực tiếp giới hạn quyền. Hệ thống ACL cung cấp một cơ chế quản lý quyền linh hoạt, hỗ trợ các đoạn quyền (snippet), middleware, đánh giá điều kiện và nhiều phương pháp khác.

:::tip Lưu ý

Các đối tượng ACL thuộc về nguồn dữ liệu (`dataSource.acl`). ACL của nguồn dữ liệu chính có thể được truy cập nhanh chóng qua `app.acl`. Để biết cách sử dụng ACL của các nguồn dữ liệu khác, vui lòng xem chương [Quản lý nguồn dữ liệu](./data-source-manager.md).

:::

## Đăng ký đoạn quyền (Snippet)

Đoạn quyền (Snippet) cho phép bạn đăng ký các tổ hợp quyền thường dùng thành các đơn vị quyền có thể tái sử dụng. Sau khi một vai trò được liên kết với một đoạn quyền, nó sẽ có được tập hợp các quyền tương ứng, giúp giảm cấu hình lặp lại và nâng cao hiệu quả quản lý quyền.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // Tiền tố ui.* cho biết các quyền có thể cấu hình trên giao diện
  actions: ['customRequests:*'], // Các thao tác tài nguyên tương ứng, hỗ trợ ký tự đại diện
});
```

## Quyền bỏ qua ràng buộc vai trò (allow)

`acl.allow()` được sử dụng để cho phép một số thao tác bỏ qua ràng buộc vai trò. Điều này phù hợp với các API công khai, các tình huống yêu cầu đánh giá quyền động, hoặc các trường hợp cần đánh giá quyền dựa trên ngữ cảnh yêu cầu.

```ts
// Truy cập công khai, không yêu cầu đăng nhập
acl.allow('app', 'getLang', 'public');

// Chỉ người dùng đã đăng nhập mới có thể truy cập
acl.allow('app', 'getInfo', 'loggedIn');

// Dựa trên điều kiện tùy chỉnh
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Mô tả tham số `condition`:**

- `'public'`：Bất kỳ người dùng nào (bao gồm cả người dùng chưa đăng nhập) đều có thể truy cập, không cần bất kỳ xác thực nào.
- `'loggedIn'`：Chỉ người dùng đã đăng nhập mới có thể truy cập, yêu cầu danh tính người dùng hợp lệ.
- `(ctx) => Promise<boolean>` hoặc `(ctx) => boolean`：Hàm tùy chỉnh, động xác định xem có cho phép truy cập hay không dựa trên ngữ cảnh yêu cầu, có thể triển khai logic quyền phức tạp.

## Đăng ký middleware quyền (use)

`acl.use()` được sử dụng để đăng ký middleware quyền tùy chỉnh, cho phép chèn logic tùy chỉnh vào luồng kiểm tra quyền. Thường được sử dụng kết hợp với `ctx.permission` để định nghĩa các quy tắc quyền tùy chỉnh. Điều này phù hợp với các tình huống yêu cầu kiểm soát quyền phi truyền thống, chẳng hạn như biểu mẫu công khai cần xác minh mật khẩu tùy chỉnh, kiểm tra quyền động dựa trên tham số yêu cầu, v.v.

**Các tình huống ứng dụng điển hình:**

- Tình huống biểu mẫu công khai: Không có người dùng, không có vai trò, nhưng cần ràng buộc quyền thông qua mật khẩu tùy chỉnh.
- Kiểm soát quyền dựa trên tham số yêu cầu, địa chỉ IP và các điều kiện khác.
- Các quy tắc quyền tùy chỉnh, bỏ qua hoặc sửa đổi luồng kiểm tra quyền mặc định.

**Kiểm soát quyền thông qua `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Ví dụ: Biểu mẫu công khai cần xác minh mật khẩu để bỏ qua kiểm tra quyền
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Xác minh thành công, bỏ qua kiểm tra quyền
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Thực hiện kiểm tra quyền (tiếp tục luồng ACL)
  await next();
});
```

**Mô tả thuộc tính `ctx.permission`:**

- `skip: true`：Bỏ qua các kiểm tra quyền ACL tiếp theo, trực tiếp cho phép truy cập.
- Có thể được thiết lập động trong middleware dựa trên logic tùy chỉnh để đạt được kiểm soát quyền linh hoạt.

## Thêm ràng buộc dữ liệu cố định cho các thao tác cụ thể (addFixedParams)

`addFixedParams` có thể thêm các ràng buộc phạm vi dữ liệu (filter) cố định cho các thao tác của một số tài nguyên. Các ràng buộc này sẽ bỏ qua hạn chế vai trò và được áp dụng trực tiếp, thường được sử dụng để bảo vệ dữ liệu hệ thống quan trọng.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Ngay cả khi người dùng có quyền xóa vai trò, họ cũng không thể xóa các vai trò hệ thống như root, admin, member.
```

> **Mẹo:** `addFixedParams` có thể được sử dụng để ngăn dữ liệu nhạy cảm bị xóa hoặc sửa đổi do nhầm lẫn, chẳng hạn như các vai trò hệ thống tích hợp sẵn, tài khoản quản trị viên, v.v. Các ràng buộc này sẽ có hiệu lực kết hợp với quyền vai trò, đảm bảo rằng ngay cả khi có quyền, dữ liệu được bảo vệ cũng không thể bị thao tác.

## Kiểm tra quyền (can)

`acl.can()` được sử dụng để kiểm tra xem một vai trò có quyền thực hiện thao tác được chỉ định hay không, trả về đối tượng kết quả quyền hoặc `null`. Thường được sử dụng trong logic nghiệp vụ để động kiểm tra quyền, ví dụ như trong middleware hoặc trình xử lý thao tác để quyết định xem có cho phép thực hiện một số thao tác hay không dựa trên vai trò.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Có thể truyền một vai trò hoặc một mảng vai trò
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Vai trò ${result.role} có thể thực hiện thao tác ${result.action}`);
  // result.params chứa các tham số cố định được thiết lập thông qua addFixedParams
  console.log('Tham số cố định:', result.params);
} else {
  console.log('Không có quyền thực hiện thao tác này');
}
```

> **Mẹo:** Nếu truyền nhiều vai trò, hệ thống sẽ kiểm tra từng vai trò tuần tự và trả về kết quả của vai trò đầu tiên có quyền.

**Định nghĩa kiểu:**

```ts
interface CanArgs {
  role?: string;      // Một vai trò
  roles?: string[];   // Nhiều vai trò (sẽ kiểm tra tuần tự, trả về vai trò đầu tiên có quyền)
  resource: string;   // Tên tài nguyên
  action: string;    // Tên thao tác
}

interface CanResult {
  role: string;       // Vai trò có quyền
  resource: string;   // Tên tài nguyên
  action: string;    // Tên thao tác
  params?: any;       // Thông tin tham số cố định (nếu được thiết lập thông qua addFixedParams)
}
```

## Đăng ký thao tác có thể cấu hình (setAvailableAction)

Nếu bạn muốn các thao tác tùy chỉnh có thể được cấu hình trên giao diện (ví dụ: hiển thị trong trang quản lý vai trò), bạn cần sử dụng `setAvailableAction` để đăng ký chúng. Các thao tác đã đăng ký sẽ xuất hiện trong giao diện cấu hình quyền, nơi quản trị viên có thể cấu hình quyền thao tác cho các vai trò khác nhau.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Tên hiển thị trên giao diện, hỗ trợ quốc tế hóa
  type: 'new-data',               // Loại thao tác
  onNewRecord: true,              // Có hiệu lực khi tạo bản ghi mới hay không
});
```

**Mô tả tham số:**

- **displayName**: Tên hiển thị trong giao diện cấu hình quyền, hỗ trợ quốc tế hóa (sử dụng định dạng `{{t("key")}}`).
- **type**: Loại thao tác, quyết định phân loại thao tác này trong cấu hình quyền.
  - `'new-data'`：Các thao tác tạo dữ liệu mới (ví dụ: nhập, thêm mới, v.v.).
  - `'existing-data'`：Các thao tác sửa đổi dữ liệu hiện có (ví dụ: cập nhật, xóa, v.v.).
- **onNewRecord**: Có hiệu lực khi tạo bản ghi mới hay không, chỉ có giá trị đối với loại `'new-data'`.

Sau khi đăng ký, thao tác này sẽ xuất hiện trong giao diện cấu hình quyền, nơi quản trị viên có thể cấu hình quyền của thao tác này trong trang quản lý vai trò.