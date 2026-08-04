---
title: "Bắt đầu nhanh với AI Portal"
description: "Xây dựng AI Portal là để AI Agent viết code hệ thống nghiệp vụ, còn NocoBase cung cấp xác thực, cơ sở dữ liệu, API và quyền làm nền tảng; code nằm trong entry ứng dụng có tên AI Portal."
keywords: "Xây dựng AI Portal,AI Builder,AI Portal,NocoBase AI,Nền tảng NocoBase,Phát triển frontend,React,shadcn/ui,AI Agent,Bắt đầu nhanh"
---

# Bắt đầu nhanh với AI Portal

Chúng tôi nhận thấy AI vibe coding có thể viết ra một trang rất đẹp, nhưng lại khó kết nối với hệ thống nghiệp vụ thực tế, hoặc phải tự triển khai lại từ đầu các năng lực nền tảng như xác thực, quyền, thiết kế bảng dữ liệu.

NocoBase là một nền tảng low-code/no-code, và đã cung cấp sẵn toàn bộ những năng lực nền tảng đó. Bạn có thể xem nó như nền tảng của phần lõi hệ thống, để AI Agent tập trung viết logic nghiệp vụ, còn NocoBase lo phần hạ tầng đáng tin cậy gồm xác thực, cơ sở dữ liệu, API và quyền.

Để làm được điều này, chúng tôi cung cấp một entry truy cập tên là **AI Portal**, mã nguồn nằm ở máy cục bộ và dành riêng cho AI Agent viết code. Code viết trong entry này truy cập trực tiếp được các năng lực nền tảng NocoBase cung cấp, và trang sau khi build là truy cập được ngay.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

## Những năng lực NocoBase cung cấp

Khi viết một hệ thống nghiệp vụ, thứ thực sự tốn thời gian thường không phải là trang, mà là những thứ nằm sau trang — đăng nhập người dùng, kiểm tra quyền, thiết kế bảng dữ liệu, các API CRUD, tải lên tải xuống file... Hệ thống nào cũng cần những thứ này, và làm lại từ đầu mỗi lần thì không đáng.

NocoBase đều đã cung cấp sẵn:

- **Hệ thống xác thực** — Đăng nhập bằng tài khoản mật khẩu dùng được ngay; OIDC, SAML, CAS, LDAP, SMS, DingTalk, WeChat Work... sau khi bật ở phía server thì frontend chỉ cần nối vào là chạy
- **Cơ sở dữ liệu và đa nguồn dữ liệu** — Quản lý bảng dữ liệu tích hợp sẵn, đồng thời kết nối được các nguồn dữ liệu bên ngoài như MySQL, PostgreSQL
- **REST API** — Bảng dữ liệu dựng xong là có ngay các API CRUD, hỗ trợ lọc, sắp xếp, phân trang và Field liên kết
- **Kiểm soát quyền** — ACL dựa trên vai trò, chi tiết đến cấp Field và cấp bản ghi; frontend đọc trực tiếp quyền của người dùng hiện tại để quyết định hiển thị gì
- **Workflow** — Tự động hóa quy trình nghiệp vụ, kích hoạt từ frontend hoặc từ thay đổi dữ liệu
- **Lưu trữ file** — Tải lên và tải xuống

![AI Portal Template](https://static-docs.nocobase.com/20260803161414.png)

Dựa trên các năng lực trên, chúng tôi đã đóng gói sẵn [mã nguồn template hệ thống](https://github.com/nocobase/portal-template-default) chuẩn, AI Agent chỉ cần copy là chạy được một ứng dụng cơ bản. Đồng thời, NocoBase cung cấp một loạt Skill như [Mô hình hóa dữ liệu](../data-modeling.md), [Cấu hình quyền](../acl.md), nên sau khi bạn mô tả nhu cầu nghiệp vụ của mình, AI Agent không chỉ sinh ra trang frontend mà còn giúp bạn tạo bảng dữ liệu, cấu hình quyền, hoàn thiện một hệ thống nghiệp vụ đầy đủ.

## Điều kiện tiên quyết

- NocoBase >= 3.0.0-alpha.6
- Node.js >= 22
- [pnpm](https://pnpm.io/installation) — template Portal dùng nó để cài dependency và khởi động dịch vụ phát triển
- Đã cài phiên bản alpha của `nocobase cli` (**lưu ý: hiện chỉ hỗ trợ phiên bản alpha**)
  - `npm install -g @nocobase/cli@alpha`
  - Và một ứng dụng NocoBase đã khởi tạo xong qua `nb init --ui`, xem chi tiết tại [Hướng dẫn tích hợp AI Agent](../../ai/quick-start.md)
- Một AI Agent, ví dụ Claude Code, Codex, Cursor

## Bước 1: Xác nhận bạn đã có một AI Portal

Trước hết xác nhận `main` mặc định thực sự có ở đó:

```bash
nb portal list
```

![nb portal list](https://static-docs.nocobase.com/20260803163517.png)

Output sẽ liệt kê tên Portal, URL truy cập, kiểu Portal, source storage, đường dẫn phát triển, trạng thái kích hoạt và trạng thái mặc định.

Sau khi kéo mã nguồn về, bạn còn có thể dùng `info` để xem chi tiết hơn, ví dụ đường dẫn phát triển và đường dẫn triển khai nằm ở đâu:

```bash
nb portal info main
```

## Bước 2: Khởi động chế độ phát triển

```bash
# Kéo mã nguồn của portal
nb portal pull main
# Khởi động dịch vụ phát triển
nb portal dev main
```

Dịch vụ phát triển mặc định chạy tại `http://localhost:5173`.

Template có sẵn một trang quản lý người dùng dựa trên bảng dữ liệu `users` của NocoBase, bạn có thể đăng nhập vào xem thử — nó cũng là một mẫu ban đầu rất tốt để cho AI tham khảo.

![portal dev home page](https://static-docs.nocobase.com/20260802220652.png)

## Bước 3: Để AI sửa một trang

Vào workspace phát triển của Portal (`pull` mặc định kéo về `./main`, nếu không chắc thì dùng `nb portal info main` để tra đường dẫn phát triển), mở AI Agent ngay tại đó — Claude Code, Codex, Cursor, tùy bạn — rồi nhập câu lệnh:

```
Thêm một trang quản lý khách hàng,
gồm danh sách khách hàng, tìm kiếm theo tên, click vào một dòng thì mở drawer chi tiết
```

<!-- 需要一个视频，展示从输入提示词到 AI 完成页面编写、开发服务热更新出效果的完整过程 -->

AI sẽ đọc qua các trang và extension hiện có, viết trang mới theo đúng quy ước của template, rồi bạn xem được kết quả tại `http://localhost:5173`.

Để tìm hiểu cách cộng tác hiệu quả với AI Agent, vui lòng xem [Cộng tác cùng AI Agent để xây dựng](./agent-workflow.md).

## Bước 4: Triển khai

Sau khi sửa xong ở máy cục bộ, đẩy mã nguồn lên remote rồi build và triển khai:

```bash
nb portal push main --message "Add customer management page"
nb portal deploy main
```

`push` đẩy đi đâu là tùy vào cấu hình source storage của Portal này. Mặc định là `nocobase`, mã nguồn do NocoBase quản lý; nếu bạn dùng [`nb portal config`](../../api/cli/portal/config.md) để đặt thành `git`, `push` sẽ commit và đẩy mã nguồn lên repository Git bạn chỉ định, và `--message` cũng trở thành Git commit message. Chi tiết xem [Triển khai và quản lý mã nguồn](./deploy.md#source-storage).

Triển khai xong, truy cập `/x/main/` là thấy được thay đổi vừa rồi.

Đến đây bạn đã chạy trọn một vòng đầy đủ — mô tả nhu cầu, AI viết code, xem kết quả ở máy cục bộ, rồi đẩy lên và triển khai.

## Khi bạn cần thêm entry

Một ứng dụng có thể có nhiều Portal. Ví dụ nhân viên nội bộ dùng một entry, khách hàng bên ngoài dùng entry khác, trang và quyền của hai entry hoàn toàn độc lập nhưng dùng chung một bộ dữ liệu:

```bash
nb portal create customer
```

Khi tạo, lệnh sẽ sinh `./customer` trong thư mục hiện tại làm workspace phát triển, hoặc bạn dùng `--path` để trỏ sang chỗ khác. Portal mới tạo cũng phát triển bằng `nb portal dev` và triển khai bằng `nb portal deploy` như cái đầu tiên — chỉ cần vào workspace của nó và mở AI Agent. Hướng dẫn chi tiết vui lòng xem [Triển khai và quản lý mã nguồn](./deploy.md).

## Trải nghiệm Demo

Nếu bạn muốn trải nghiệm kết quả của việc xây dựng AI Portal, có thể đăng ký một môi trường Demo tại https://demo.nocobase.com/new . Sau khi bạn điền form, chúng tôi sẽ tạo cho bạn một môi trường Demo riêng — trong đó có sẵn một số ứng dụng AI Portal được triển khai trên nền tảng NocoBase.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

Sau đó bạn chọn một AI Portal để vào xem:

![AI Portal CRM](https://static-docs.nocobase.com/20260803154700.png)

Ngoài ra, ở trang chào mừng của Portal chúng tôi có cung cấp sẵn câu lệnh, để AI Agent của bạn kết nối thẳng tới ứng dụng AI Portal này, kéo code ứng dụng về, khởi động dịch vụ phát triển ở máy cục bộ, sửa trang, rồi cuối cùng đẩy lên và triển khai ngược lại môi trường Demo; triển khai thành công thì refresh trang là thấy kết quả.

## Tiếp theo

- [Cộng tác cùng AI Agent để xây dựng](./agent-workflow.md) — Viết câu lệnh thế nào, AI sửa sai thì quay lui ra sao
- [Cấu trúc dự án và công nghệ sử dụng](./project-structure.md) — Quy ước thư mục và các lệnh thường dùng của template
- [Triển khai và quản lý mã nguồn](./deploy.md) — Đưa mã nguồn Portal vào Git, và triển khai đa môi trường

## Liên kết liên quan

- [Cộng tác cùng AI Agent để xây dựng](./agent-workflow.md) — Dùng ngôn ngữ tự nhiên điều khiển AI viết trang Portal
- [Cấu trúc dự án và công nghệ sử dụng](./project-structure.md) — Quy ước thư mục và các lệnh thường dùng của template
- [Component chuẩn và mở rộng](./components.md) — Nền component shadcn/ui và cơ chế mở rộng
- [Triển khai và quản lý mã nguồn](./deploy.md) — Quy trình đầy đủ từ phát triển, đẩy mã nguồn đến triển khai
- [Hướng dẫn tích hợp AI Agent](../../ai/quick-start.md) — Cài đặt NocoBase CLI và hoàn thành khởi tạo
- [Bắt đầu nhanh với AI Builder](../index.md) — Cách xây dựng khác, không cần viết code
- [Quản lý phiên bản](../version-control.md) — Snapshot phiên bản cho cách xây dựng không cần code
- [Tài liệu tham khảo lệnh `nb portal`](../../api/cli/portal/index.md) — Hướng dẫn đầy đủ các tham số của tất cả lệnh Portal
