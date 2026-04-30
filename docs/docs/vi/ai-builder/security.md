---
title: 'Bảo mật và Audit'
description: 'Tìm hiểu các cách xác thực khi AI Agent xây dựng NocoBase, chiến lược kiểm soát quyền, các thực hành khuyến nghị, và cách truy vết từng thao tác.'
keywords: 'AI Builder,bảo mật,quyền,xác thực,Token,OAuth,bản ghi thao tác,audit'
---

# Bảo mật và Audit

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, hãy đảm bảo bạn đã cài đặt NocoBase CLI và hoàn tất khởi tạo theo [Bắt đầu nhanh AI Builder](./index.md).

:::

Khi Người dùng dùng AI Agent thao tác NocoBase qua [NocoBase CLI](../ai/quick-start.md), cần đặc biệt chú ý đến xác thực, kiểm soát quyền và truy vết audit, để đảm bảo ranh giới thao tác rõ ràng và quá trình có thể theo dõi.

## Xác thực

AI Agent kết nối với NocoBase, chủ yếu có hai cách xác thực:

- **Xác thực API key**: tạo API Key qua plugin [API keys](/auth-verification/api-keys/index.md), cấu hình vào môi trường CLI, các yêu cầu sau dùng nó để truy cập API
- **Xác thực OAuth**: hoàn tất một lần xác thực OAuth qua trình duyệt, sau đó truy cập API với danh tính Người dùng hiện tại

Cả hai cách đều có thể dùng cùng lệnh `nb`, khác biệt nằm ở nguồn gốc danh tính, tình huống áp dụng và chiến lược kiểm soát rủi ro.

### Xác thực API key

API key chủ yếu dùng cho các Task tự động hóa, scripting và chạy lâu dài, ví dụ:

- Cho AI Agent đồng bộ dữ liệu định kỳ
- Trong môi trường phát triển thường xuyên gọi `nb api`
- Dùng vai trò cố định để thực hiện một loại Task xây dựng rõ ràng, ổn định

Quy trình cơ bản như sau:

1. Bật plugin API keys trong NocoBase và tạo API Key
2. Gắn vai trò chuyên dụng cho API Key này, thay vì gắn trực tiếp toàn bộ quyền của `root` hoặc admin
3. Dùng `nb env add` để lưu địa chỉ API và Token vào môi trường CLI

Ví dụ:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type token \
  --access-token <your-api-key>
```

Sau khi cấu hình xong, AI Agent có thể thực hiện các lệnh gọi API qua môi trường này:

```bash
nb api resource list --env local --resource users
```

Cách này ổn định, phù hợp tự động hóa, và Người dùng cũng không cần đăng nhập lại mỗi lần. Chỉ cần Token chưa hết hạn, người sở hữu nó có thể truy cập hệ thống với quyền của vai trò đã gắn, do đó cần đặc biệt lưu ý:

- Token chỉ gắn vai trò chuyên dụng
- Chỉ lưu trong các môi trường CLI cần thiết
- Xoay vòng định kỳ, không dùng "không bao giờ hết hạn" làm tùy chọn mặc định
- Khi nghi ngờ rò rỉ thì xóa và tạo lại ngay lập tức

Mô tả chung hơn có thể tham khảo [Hướng dẫn bảo mật NocoBase](../security/guide.md).

### Xác thực OAuth

OAuth chủ yếu dùng cho các Task thực hiện thao tác với danh tính Người dùng đang đăng nhập, ví dụ:

- Cho AI giúp admin hiện tại làm một lần điều chỉnh cấu hình
- Cần gán thao tác cho Người dùng đăng nhập rõ ràng
- Không muốn lưu Token quyền cao trong thời gian dài

Quy trình cơ bản như sau:

1. Trước tiên thêm môi trường CLI, chọn cách xác thực là `oauth`
2. Chạy `nb env auth`
3. Trình duyệt mở trang xác thực, đăng nhập và hoàn tất xác thực
4. CLI lưu thông tin xác thực, các yêu cầu `nb api` sau truy cập NocoBase với danh tính Người dùng hiện tại
5. Nếu Người dùng có nhiều vai trò, có thể chỉ định vai trò qua `--role`

Ví dụ:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type oauth

nb env auth local
```

`nb env auth` sẽ khởi động luồng đăng nhập trên trình duyệt. Sau khi thành công, CLI sẽ lưu thông tin xác thực vào cấu hình môi trường hiện tại, sau đó có thể tiếp tục cho AI Agent gọi `nb api`.

Trong cài đặt mặc định hiện tại:

- Access token OAuth có thời hạn **10 phút**
- Refresh token OAuth có thời hạn **30 ngày**

CLI sẽ ưu tiên dùng refresh token để tự động làm mới phiên khi access token sắp hết hạn; nếu refresh token đã hết hạn, không khả dụng, hoặc server không trả về refresh token, thì cần chạy lại `nb env auth`.

Đặc điểm của OAuth là yêu cầu thường được thực hiện trong ngữ cảnh Người dùng đang đăng nhập và vai trò của họ, bản ghi audit cũng dễ tương ứng với người thao tác thực tế hơn. Cách này phù hợp hơn với các thao tác có sự tham gia của con người, cần xác nhận danh tính.

### Thực hành khuyến nghị

Khuyến nghị chọn theo các nguyên tắc sau:

- **Phát triển, kiểm thử, Task tự động hóa**: ưu tiên dùng API key, nhưng nhất định phải gắn vai trò chuyên dụng
- **Môi trường production, có sự tham gia của con người, cần gán danh tính chặt chẽ**: ưu tiên dùng OAuth
- **Thao tác rủi ro cao**: dù về mặt kỹ thuật có thể dùng Token, vẫn khuyến nghị chuyển sang dùng OAuth, và do Người dùng có quyền tương ứng hoàn tất xác thực rồi thực hiện

Nếu không có yêu cầu rõ ràng, có thể xử lý theo nguyên tắc mặc định sau:

- **Mặc định dùng OAuth**
- **Chỉ khi rõ ràng cần tự động hóa, không có người trực, hoặc thực thi hàng loạt thì mới dùng API key**

## Kiểm soát quyền

AI Agent bản thân không có "quyền bổ sung", nó có thể làm gì hoàn toàn phụ thuộc vào danh tính và vai trò đang sử dụng.

Nói cách khác:

- Khi truy cập bằng API key, ranh giới quyền do vai trò gắn với Token này quyết định
- Khi truy cập bằng OAuth, ranh giới quyền do Người dùng đang đăng nhập và vai trò hiện tại quyết định

AI sẽ không vượt qua hệ thống ACL của NocoBase. Nếu một vai trò không có quyền với một bảng dữ liệu, Field, trang hoặc cấu hình plugin nào đó, AI Agent dù biết lệnh tương ứng cũng không thể thực thi thành công.

### Vai trò và chiến lược quyền

Khuyến nghị chuẩn bị một vai trò riêng cho AI Agent, thay vì tái sử dụng vai trò admin hiện có.

Vai trò này thường chỉ cần mở các quyền trong phạm vi sau:

- Cho phép thao tác trên các bảng dữ liệu nào
- Cho phép thực hiện các Action nào, ví dụ xem, tạo, cập nhật, xóa
- Có cho phép truy cập các trang hoặc menu nào không
- Có cho phép vào các khu vực rủi ro cao như cài đặt hệ thống, quản lý plugin, cấu hình quyền không

Ví dụ, bạn có thể tạo một vai trò `ai_builder_editor`, chỉ cho phép nó:

- Quản lý các bảng dữ liệu liên quan đến CRM
- Chỉnh sửa các trang được chỉ định
- Kích hoạt một phần Workflow
- Không cho phép sửa quyền vai trò
- Không cho phép enable, disable, install plugin
- Không cho phép xóa các bảng dữ liệu quan trọng

Nếu cần để AI hỗ trợ cấu hình quyền, có thể kết hợp với [Cấu hình quyền](./acl.md) để hoàn thành, nhưng vẫn khuyến nghị con người xác định ranh giới quyền trước.

### Nguyên tắc tối thiểu quyền

Nguyên tắc tối thiểu quyền đặc biệt quan trọng trong tình huống AI Builder, có thể áp dụng cách làm sau:

1. Tạo vai trò chuyên dụng cho AI trước
2. Ban đầu chỉ mở quyền xem
3. Bổ sung dần quyền tạo, chỉnh sửa cần thiết theo Task
4. Giữ kiểm soát thủ công với các thao tác rủi ro cao như xóa, sửa quyền, quản lý plugin

Ví dụ:

- AI dùng để nhập nội dung, chỉ cần quyền xem và tạo của bảng dữ liệu mục tiêu
- AI dùng để xây dựng trang, chỉ cần quyền với trang liên quan và cấu hình UI
- AI dùng để mô hình hóa dữ liệu, chỉ mở quyền sửa cấu trúc bảng cho môi trường kiểm thử, không cho thẳng môi trường production

Không khuyến nghị gắn trực tiếp các vai trò `root`, `admin` hoặc có khả năng cấu hình hệ thống toàn cục cho AI Agent. Cách làm này tuy đơn giản về mặt triển khai, nhưng sẽ mở rộng đáng kể bề mặt phơi nhiễm quyền.

## Logs

Trong tình huống AI Builder, logs dùng để hỗ trợ truy vết thao tác và định vị vấn đề.

Tập trung vào hai loại logs sau:

- **Request log**: ghi lại đường dẫn, phương thức, status code, thời gian xử lý và nguồn gốc của yêu cầu interface
- **Audit log**: ghi lại chủ thể thực hiện, đối tượng thao tác, kết quả và metadata liên quan của các thao tác resource quan trọng

Khi gửi yêu cầu qua `nb api`, CLI sẽ tự động đính kèm header `x-request-source: cli`, server có thể dựa vào đó để nhận biết yêu cầu này đến từ CLI.

### Request log

Request log dùng để ghi lại thông tin lệnh gọi interface, bao gồm đường dẫn yêu cầu, trạng thái phản hồi, thời gian xử lý và đánh dấu nguồn.

File log thường nằm tại:

```bash
storage/logs/<appName>/request_YYYY-MM-DD.log
```

Trong tình huống gọi `nb api`, request log sẽ kèm:

- `req.header.x-request-source`

Dựa vào đó có thể phân biệt yêu cầu CLI và yêu cầu trình duyệt thông thường.

Về mô tả thư mục và Field của request log, có thể tham khảo [Logs phía server NocoBase](../log-and-monitor/logger/index.md).

### Audit log

Audit log dùng để ghi lại chủ thể thực hiện, resource đích, kết quả thực thi và thông tin yêu cầu liên quan của các thao tác quan trọng.

Với các thao tác đã được đưa vào phạm vi audit, log sẽ ghi lại:

- `resource`
- `action`
- `userId`
- `roleName`
- `status`
- `metadata.request.headers.x-request-source`

Ví dụ, khi AI gọi `collections:apply`, `fields:apply` qua CLI hoặc các thao tác ghi đã bật audit khác, audit log sẽ ghi `x-request-source: cli`, để tiện phân biệt với thao tác giao diện và thao tác phát sinh từ CLI.

Về mô tả chi tiết của audit log, có thể tham khảo [Audit log](../security/audit-logger/index.md).

## Khuyến nghị bảo mật

Dưới đây là một vài đề xuất thực hành phù hợp hơn với tình huống AI Builder:

- Không gắn trực tiếp các vai trò `root`, `admin` hoặc cấu hình hệ thống toàn cục cho AI Agent
- Tạo vai trò chuyên dụng cho AI Agent, và phân tách ranh giới quyền theo Task
- Xoay vòng API key định kỳ, tránh tái sử dụng lâu dài cùng một Token quyền cao
- Kiểm chứng các thay đổi mô hình hóa dữ liệu, cấu trúc trang và Workflow ở môi trường kiểm thử trước, rồi mới đồng bộ sang môi trường production
- Bật và kiểm tra định kỳ request log và audit log, đảm bảo các thao tác quan trọng có thể truy vết
- Với các thao tác rủi ro cao như xóa dữ liệu, sửa quyền, bật/tắt plugin, điều chỉnh cấu hình hệ thống, khuyến nghị con người xác nhận trước khi thực thi
- Nếu AI cần chạy lâu dài, ưu tiên tách thành nhiều môi trường quyền thấp, tránh tập trung sử dụng một môi trường quyền cao duy nhất

## Liên kết liên quan

- [Bắt đầu nhanh AI Builder](./index.md) — Cài đặt và chuẩn bị môi trường
- [Quản lý môi trường](./env-bootstrap) — Kiểm tra môi trường, thêm môi trường và chẩn đoán sự cố
- [Cấu hình quyền](./acl.md) — Cấu hình vai trò, chiến lược quyền và đánh giá rủi ro
- [NocoBase CLI](../ai/quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
- [Hướng dẫn bảo mật NocoBase](../security/guide.md) — Đề xuất cấu hình bảo mật toàn diện hơn
- [Logs phía server NocoBase](../log-and-monitor/logger/index.md) — Mô tả thư mục và Field của request log
- [Audit log](../security/audit-logger/index.md) — Mô tả Field bản ghi audit và hướng dẫn sử dụng
- [NocoBase MCP](../ai/mcp/index.md) — Kết nối AI Agent qua giao thức MCP
