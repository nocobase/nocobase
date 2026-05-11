---
title: "Các khả năng được hỗ trợ"
description: "Tất cả các khả năng được AI Development hỗ trợ: scaffold, bảng dữ liệu, Block, Field, Action, trang cài đặt, API, quyền, quốc tế hóa, script nâng cấp."
keywords: "AI Development,khả năng,phát triển plugin,scaffold,bảng dữ liệu,Block,Field,Action,quyền,quốc tế hóa"
---

# Các khả năng được hỗ trợ

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, hãy đảm bảo bạn đã chuẩn bị môi trường theo [Bắt đầu nhanh với AI Development Plugin](./index.md).

:::

Khả năng AI Development Plugin được xây dựng dựa trên Skill [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development). Nếu bạn đã khởi tạo qua [NocoBase CLI](../ai/quick-start.md) (`nb init`), Skill này sẽ được cài đặt tự động.

Dưới đây liệt kê tất cả những việc AI hiện có thể giúp bạn. Mỗi khả năng đều kèm prompt mẫu, bạn có thể trực tiếp sao chép, chỉnh sửa mô tả nhu cầu là dùng được.

:::warning Lưu ý

- NocoBase đang chuyển từ `client` (v1) sang `client-v2`, hiện `client-v2` vẫn đang trong quá trình phát triển. Mã client do AI Development sinh ra dựa trên `client-v2`, chỉ có thể dùng dưới đường dẫn `/v2/`, dùng để trải nghiệm trước, không khuyến nghị dùng trực tiếp trong môi trường production.
- Mã do AI sinh ra không phải lúc nào cũng đúng 100%, khuyến nghị review trước khi enable. Nếu gặp vấn đề khi runtime, có thể gửi thông báo lỗi cho AI để nó tiếp tục kiểm tra và sửa — thường vài lượt trao đổi là giải quyết được.
- Khuyến nghị dùng các mô hình lớn họ GPT hoặc Claude để phát triển, hiệu quả tốt nhất. Các mô hình khác cũng có thể dùng, tuy nhiên chất lượng sinh có thể có sự khác biệt.

:::

## Best Practices

- **Nói rõ với AI là tạo hoặc sửa đổi một plugin NocoBase, và cung cấp tên plugin** — ví dụ "Hãy dùng nocobase-plugin-development skill giúp tôi phát triển một plugin NocoBase, tên là @my-scope/plugin-rating". Nếu không cung cấp tên plugin, AI có thể không biết sinh code vào đâu.
- **Trong prompt nói rõ là dùng skill nocobase-plugin-development** — ví dụ "Hãy dùng nocobase-plugin-development skill giúp tôi phát triển một plugin NocoBase…". Như vậy AI Agent có thể trực tiếp đọc khả năng của Skills, tránh việc vào plan mode mà bỏ qua Skills.
- **Chạy AI Agent ở thư mục gốc của repository mã nguồn NocoBase** — như vậy AI có thể tự động tìm cấu trúc dự án, dependencies và các plugin sẵn có. Nếu bạn không ở thư mục gốc mã nguồn, cần nói thêm với AI Agent về đường dẫn repository mã nguồn.

## Mục lục nhanh

| Tôi muốn…                       | AI có thể giúp bạn                                              |
| ------------------------------- | --------------------------------------------------------------- |
| Tạo một plugin mới              | Sinh scaffold hoàn chỉnh, bao gồm cấu trúc thư mục frontend/backend |
| Định nghĩa bảng dữ liệu          | Sinh định nghĩa Collection, hỗ trợ tất cả kiểu Field và quan hệ liên kết |
| Tạo một Block tùy chỉnh         | Sinh BlockModel + bảng cấu hình + đăng ký vào menu "Thêm Block" |
| Tạo một Field tùy chỉnh         | Sinh FieldModel + ràng buộc với interface Field                 |
| Thêm nút Action tùy chỉnh       | Sinh ActionModel + popup/drawer/hộp xác nhận                    |
| Tạo trang cài đặt plugin        | Sinh form frontend + API backend + lưu trữ                      |
| Viết API tùy chỉnh              | Sinh Resource Action + đăng ký route + cấu hình ACL             |
| Cấu hình quyền                  | Sinh quy tắc ACL, kiểm soát truy cập theo vai trò               |
| Hỗ trợ đa ngôn ngữ              | Tự động sinh language pack tiếng Trung và tiếng Anh             |
| Viết script nâng cấp            | Sinh Migration, hỗ trợ DDL và migration dữ liệu                 |

## Scaffold plugin

AI có thể dựa vào mô tả nhu cầu của bạn, sinh ra một cấu trúc thư mục plugin NocoBase hoàn chỉnh — bao gồm các file entry frontend/backend, định nghĩa kiểu và cấu hình cơ bản.

Prompt mẫu:

```
Hãy giúp tôi tạo một plugin NocoBase, tên plugin là @my-scope/plugin-todo
```

AI sẽ chạy `yarn pm create @my-scope/plugin-todo` và sinh thư mục chuẩn:

```
packages/plugins/@my-scope/plugin-todo/
├── src/
│   ├── server/
│   │   └── plugin.ts
│   ├── client-v2/
│   │   └── plugin.tsx
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── package.json
└── ...
```

## Định nghĩa bảng dữ liệu

AI hỗ trợ sinh định nghĩa Collection cho tất cả kiểu Field của NocoBase, bao gồm cả các quan hệ liên kết (one-to-many, many-to-many, v.v.).

Prompt mẫu:

```
Hãy dùng nocobase-plugin-development skill giúp tôi phát triển một plugin NocoBase, tên là @my-scope/plugin-order,
sau đó định nghĩa bên trong một bảng "đơn hàng", các Field bao gồm: Mã đơn hàng (auto increment), tên Khách hàng (string),
số tiền (decimal), trạng thái (single select: chờ xử lý/đang xử lý/đã hoàn thành), thời gian tạo.
Đơn hàng và Khách hàng là quan hệ many-to-one.
```

AI sẽ sinh định nghĩa `defineCollection`, bao gồm kiểu Field, giá trị mặc định, cấu hình liên kết, v.v.

## Block tùy chỉnh

Block là cách mở rộng cốt lõi nhất của frontend NocoBase. AI có thể giúp bạn sinh model Block, bảng cấu hình và đăng ký menu.

Prompt mẫu:

```
Hãy dùng nocobase-plugin-development skill giúp tôi phát triển một plugin NocoBase, tên là @my-scope/plugin-simple-block,
tạo một Block hiển thị tùy chỉnh (BlockModel), Người dùng có thể nhập nội dung HTML trong bảng cấu hình,
Block sẽ render những HTML này ra. Đăng ký Block này vào menu "Thêm Block".
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

AI sẽ sinh `BlockModel`, tạo bảng cấu hình thông qua `registerFlow` + `uiSchema`, và đăng ký vào menu "Thêm Block".

Xem ví dụ đầy đủ tại [Tạo một Block hiển thị tùy chỉnh](../plugin-development/client/examples/custom-block).

## Component Field tùy chỉnh

Nếu component render Field tích hợp sẵn của NocoBase không đáp ứng nhu cầu, AI có thể giúp bạn tạo một component hiển thị tùy chỉnh, thay thế cách render Field mặc định.

Prompt mẫu:

```
Hãy dùng nocobase-plugin-development skill giúp tôi phát triển một plugin NocoBase, tên là @my-scope/plugin-rating,
tạo một component hiển thị Field tùy chỉnh (FieldModel), render Field kiểu integer thành biểu tượng ngôi sao,
hỗ trợ 1-5 điểm, click vào sao có thể trực tiếp sửa giá trị đánh giá và lưu vào cơ sở dữ liệu.
```

![Hiệu ứng hiển thị component Rating](https://static-docs.nocobase.com/20260422170712.png)

AI sẽ sinh `FieldModel` tùy chỉnh, thay thế component render mặc định của Field integer.

## Action tùy chỉnh

Nút Action có thể xuất hiện ở đầu Block (cấp collection), ở cột Action của mỗi hàng trong bảng (cấp record), hoặc xuất hiện đồng thời ở cả hai vị trí. Sau khi click có thể bật toast, mở popup form, gọi API, v.v.

Prompt mẫu:

```
Hãy dùng nocobase-plugin-development skill giúp tôi phát triển một plugin NocoBase, tên là @my-scope/plugin-simple-action,
tạo ba nút Action tùy chỉnh (ActionModel):
1. Một nút cấp collection, xuất hiện ở đầu Block, click xong bật toast thành công
2. Một nút cấp record, xuất hiện ở cột Action của mỗi hàng trong bảng, click xong hiển thị ID của record hiện tại
3. Một nút cấp both, đồng thời xuất hiện ở cả hai vị trí, click xong bật toast thông tin
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

AI sẽ sinh `ActionModel`, kiểm soát vị trí xuất hiện của nút thông qua `ActionSceneEnum`, xử lý sự kiện click thông qua `registerFlow({ on: 'click' })`.

Xem ví dụ đầy đủ tại [Tạo một nút Action tùy chỉnh](../plugin-development/client/examples/custom-action).

## Trang cài đặt plugin

Nhiều plugin cần một trang cài đặt để Người dùng cấu hình tham số — như API Key của dịch vụ bên thứ ba, địa chỉ Webhook, v.v.

Prompt mẫu:

```
Hãy dùng nocobase-plugin-development skill giúp tôi phát triển một plugin NocoBase, tên là @my-scope/plugin-settings-page,
tạo một trang cài đặt plugin, đăng ký một entry "Cấu hình dịch vụ bên ngoài" trong menu "Cấu hình plugin", bao gồm hai Tab:
1. Tab "Cấu hình API": form bao gồm API Key (string, bắt buộc), API Secret (password, bắt buộc), Endpoint (string, tùy chọn), lưu vào cơ sở dữ liệu thông qua API backend
2. Tab "Giới thiệu": hiển thị tên plugin và thông tin phiên bản
Frontend dùng component form Ant Design, backend định nghĩa hai interface externalApi:get và externalApi:set.
```

![Hiệu ứng trang cài đặt plugin](https://static-docs.nocobase.com/20260415160006.png)

AI sẽ sinh component trang cài đặt frontend, Resource Action backend, định nghĩa bảng dữ liệu và cấu hình ACL.

Xem ví dụ đầy đủ tại [Tạo một trang cài đặt plugin](../plugin-development/client/examples/settings-page).

## API tùy chỉnh

Nếu interface CRUD tích hợp sẵn không đủ dùng, AI có thể giúp bạn viết REST API tùy chỉnh. Dưới đây là một ví dụ đầy đủ về tương tác frontend-backend — backend định nghĩa bảng dữ liệu và API, frontend tạo Block tùy chỉnh hiển thị dữ liệu.

Prompt mẫu:

```
Hãy dùng nocobase-plugin-development skill giúp tôi phát triển một plugin NocoBase, tên là @my-scope/plugin-todo,
tạo một plugin quản lý dữ liệu Todo có tương tác frontend-backend:
1. Backend định nghĩa một bảng todoItems, các Field bao gồm title (string), completed (bool), priority (string, mặc định medium)
2. Frontend tạo một TableBlock tùy chỉnh, chỉ hiển thị dữ liệu của todoItems
3. Field priority hiển thị bằng Tag màu sắc (high màu đỏ, medium màu cam, low màu xanh lá)
4. Thêm một nút "Tạo Todo mới", click xong bật form để tạo record
5. Người dùng đã đăng nhập có thể thực hiện tất cả thao tác CRUD
```

![Hiệu ứng plugin quản lý dữ liệu Todo](https://static-docs.nocobase.com/20260408164204.png)

AI sẽ sinh định nghĩa Collection phía server, Resource Action, cấu hình ACL, cũng như `TableBlockModel`, `FieldModel` tùy chỉnh và `ActionModel` phía client.

Xem ví dụ đầy đủ tại [Tạo một plugin quản lý dữ liệu có tương tác frontend-backend](../plugin-development/client/examples/fullstack-plugin).

## Cấu hình quyền

AI sẽ tự động cấu hình các quy tắc ACL hợp lý cho API và resource được sinh ra. Bạn cũng có thể chỉ định rõ yêu cầu quyền trong prompt:

Prompt mẫu:

```
Hãy dùng nocobase-plugin-development skill giúp tôi phát triển một plugin NocoBase, tên là @my-scope/plugin-todo,
định nghĩa một bảng dữ liệu todoItems (Field title, completed, priority),
yêu cầu quyền: Người dùng đã đăng nhập có thể xem, tạo và chỉnh sửa, chỉ vai trò admin mới có thể xóa.
```

AI sẽ cấu hình các quy tắc truy cập tương ứng phía server thông qua `this.app.acl.allow()`.

## Quốc tế hóa

AI mặc định sẽ sinh hai language pack tiếng Trung và tiếng Anh (`zh-CN.json` và `en-US.json`), bạn không cần phải nhắc thêm.

Nếu cần ngôn ngữ khác:

```
Hãy dùng nocobase-plugin-development skill giúp tôi phát triển một plugin NocoBase, tên là @my-scope/plugin-order,
cần hỗ trợ ba language pack tiếng Trung, tiếng Anh và tiếng Nhật
```

## Script nâng cấp

Khi plugin cần cập nhật cấu trúc cơ sở dữ liệu hoặc migration dữ liệu, AI có thể giúp bạn sinh script Migration.

Prompt mẫu:

```
Hãy dùng nocobase-plugin-development skill giúp tôi viết một script nâng cấp cho plugin NocoBase @my-scope/plugin-order,
thêm một Field "ghi chú" (long text, tùy chọn) vào bảng "đơn hàng", và điền mặc định "không" cho Field ghi chú của các đơn hàng hiện có.
```

AI sẽ sinh file Migration có version number, bao gồm thao tác DDL và logic migration dữ liệu.

## Liên kết liên quan

- [Bắt đầu nhanh với AI Development Plugin](./index.md) — Bắt đầu nhanh và tổng quan các khả năng
- [Thực hành: Phát triển plugin watermark](./watermark-plugin) — Case thực hành đầy đủ về AI Development Plugin
- [Phát triển Plugin](../plugin-development/index.md) — Hướng dẫn đầy đủ về phát triển plugin NocoBase
- [NocoBase CLI](../ai/quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
