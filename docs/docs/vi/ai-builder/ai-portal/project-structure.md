---
title: "Cấu trúc dự án và công nghệ sử dụng"
description: "Công nghệ sử dụng, quy ước thư mục, biến môi trường và các lệnh thường dùng của template AI Portal, giúp bạn đánh giá code AI viết đã đặt đúng chỗ hay chưa."
keywords: "AI Portal,Cấu trúc dự án,Công nghệ sử dụng,React,Vite,Refine,Tailwind CSS,shadcn/ui,Biến môi trường"
---

# Cấu trúc dự án và công nghệ sử dụng

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã chạy được Portal đầu tiên theo [Bắt đầu nhanh với AI Portal](./index.md).

:::

Phần lớn công việc phát triển hằng ngày cứ giao cho AI là được. Tuy nhiên khi hiểu qua cấu trúc của template, bạn sẽ đánh giá được code AI viết có đặt đúng chỗ không, và gặp vấn đề cũng dễ khoanh vùng hơn.

## Công nghệ sử dụng

Template Portal dựa trên `@nocobase/portal-template-default`, mã nguồn nằm tại [nocobase/portal-template-default](https://github.com/nocobase/portal-template-default).

| Công nghệ | Công dụng |
| --- | --- |
| React 19 + TypeScript | Framework frontend |
| Vite | Dịch vụ phát triển và công cụ build |
| [Refine](https://refine.dev/docs/) | Framework tầng dữ liệu, xử lý resource, route, biểu mẫu và quyền |
| Tailwind CSS 4 | Giải pháp style |
| [shadcn/ui](https://ui.shadcn.com/) | Nền component, mã nguồn thuộc về dự án |
| lucide | Thư viện icon |
| pnpm | Trình quản lý package |

Bộ kết hợp này là stack frontend mà AI hiện quen thuộc nhất, nhờ đó AI viết ra có độ chính xác cao hơn.

Portal hiện là một dự án frontend thuần túy, logic nghiệp vụ được hoàn thành qua API, component chuẩn... của NocoBase. Sau này sẽ hỗ trợ để AI Agent viết cả code backend của Portal.

## Cấu trúc thư mục

```text
src/
├── app/            Route và nạp extension
├── pages/          Đăng nhập, đăng ký, quên mật khẩu...
├── components/     Component
│   ├── ui/         Nền component shadcn/ui
│   ├── app-shell/  Bố cục, điều hướng, trạng thái loading
│   ├── auth/       Component liên quan đến xác thực
│   └── ...
├── extensions/     Extension, cài xong là dùng được
├── lib/            Phần đóng gói client NocoBase và logic ACL
├── providers/      Các provider của Refine
├── hooks/          Hook tùy chỉnh
└── locales/        Nội dung đa ngôn ngữ
```

Vài vị trí quan trọng:

- **`src/app/routes.tsx`** — Cấu trúc route. Route cho trạng thái đã đăng nhập và chưa đăng nhập tách riêng, route do extension cung cấp sẽ tự động được gắn vào
- **`src/app/extensions.tsx`** — Logic nạp extension, dùng `import.meta.glob` để quét `src/extensions/*/extension.tsx`
- **`src/providers/data.ts`** — data provider của Refine, dịch cú pháp truy vấn của Refine thành tham số API của NocoBase
- **`src/lib/nocobase/client.ts`** — `NocoBaseClient`, lớp đóng gói bên dưới của mọi request
- **`src/components/ui/`** — Hơn 60 component shadcn/ui, dùng trực tiếp là được

Trang nghiệp vụ thường được viết dưới `src/extensions/`, mỗi module chức năng một thư mục. Chi tiết xem [Component chuẩn và mở rộng](./components.md).

## File quan trọng

| File | Vai trò |
| --- | --- |
| `AGENTS.md` | Quy ước phát triển dành cho AI Agent, bạn cũng có thể bổ sung quy tắc riêng của dự án vào đây |
| `components.json` | Cấu hình shadcn/ui, gồm phong cách style, thư viện icon và alias đường dẫn |
| `.env` / `.env.local` | Biến môi trường, `nb portal dev` và `deploy` sẽ tự động làm mới |
| `vite.config.ts` | Cấu hình build, bao gồm proxy API khi phát triển |

## Biến môi trường

| Biến | Mô tả |
| --- | --- |
| `NOCOBASE_API_URL` | Địa chỉ gốc của REST API NocoBase, **bắt buộc có hậu tố `/api`**. Triển khai cùng origin thường là `/api` |
| `NOCOBASE_PORTAL_BASE` | Đường dẫn công khai nơi Portal được gắn vào. Phát triển cục bộ dùng `/`, khi build dùng đường dẫn triển khai thực tế, ví dụ `/x/main/` |
| `NOCOBASE_AUTHENTICATOR` | Tên authenticator, mặc định là `basic` |
| `NOCOBASE_API_TOKEN` | Token tạm dùng khi phát triển, đừng commit giá trị thật |
| `API_CLIENT_STORAGE_PREFIX` | Tiền tố lưu token, nếu phía server đã tùy chỉnh thì phải giữ nhất quán |
| `API_CLIENT_STORAGE_TYPE` | Cách lưu token, mặc định là `localStorage` |
| `API_CLIENT_SHARE_TOKEN` | Có chia sẻ token hay không, mặc định là `false` |

Mấy biến này `nb portal dev` và `nb portal deploy` sẽ tự động ghi sẵn, thường không cần sửa tay. Chỉ khi phía server tùy chỉnh cách lưu trữ thông tin xác thực thì mới cần chỉnh ba biến cuối cho khớp.

Khi phát triển, nếu `NOCOBASE_API_URL` điền địa chỉ tuyệt đối, Vite sẽ tự cấu hình một proxy để chuyển tiếp request, bạn không phải tự xử lý CORS.

## Lệnh thường dùng

Phát triển hằng ngày chỉ dùng tới chừng này lệnh; việc cài dependency, làm mới biến môi trường, build đều do CLI xử lý phía sau:

| Lệnh | Vai trò |
| --- | --- |
| `nb portal list` | Xem ứng dụng hiện tại có những Portal nào |
| `nb portal info <portal>` | Tra đường dẫn phát triển, đường dẫn triển khai và địa chỉ truy cập của Portal |
| `nb portal create <portal>` | Tạo workspace phát triển cho một Portal mới dựa trên template |
| `nb portal pull <portal>` | Kéo mã nguồn Portal từ remote về workspace phát triển cục bộ |
| `nb portal dev <portal>` | Khởi động dịch vụ phát triển cục bộ, sửa code thấy kết quả ngay |
| `nb portal push <portal>` | Đẩy thay đổi mã nguồn cục bộ lên remote |
| `nb portal deploy <portal>` | Build và triển khai, để thay đổi có hiệu lực với người dùng |
| `nb portal config <portal>` | Điều chỉnh source storage, cấu hình Git và đường dẫn workspace phát triển |
| `nb portal destroy <portal>` | Xóa bản ghi Portal và các file đã triển khai |

Tham số đầy đủ của từng lệnh xem [Tài liệu tham khảo lệnh `nb portal`](../../api/cli/portal/index.md).

## Workspace phát triển nằm ở đâu

Workspace phát triển của Portal mặc định đặt trong thư mục nơi bạn chạy `nb portal create` hoặc `nb portal pull`:

```text
./<portal>
```

Khi tạo hoặc kéo về, bạn có thể dùng `--path` để trỏ sang chỗ khác. Sản phẩm triển khai sau khi build nằm ở một vị trí khác, đặt dưới storage của ứng dụng đích, do `nb portal deploy` lo việc đồng bộ, bình thường bạn không phải quan tâm.

Không chắc workspace phát triển của Portal hiện tại nằm ở đâu thì tra thẳng:

```bash
nb portal info main
```

## Liên kết liên quan

- [Bắt đầu nhanh với AI Portal](./index.md) — Chạy được entry frontend đầu tiên do AI viết
- [Component chuẩn và mở rộng](./components.md) — Nền component shadcn/ui và cơ chế mở rộng
- [Triển khai và quản lý mã nguồn](./deploy.md) — Quy trình build triển khai và source storage
- [Cộng tác cùng AI Agent để xây dựng](./agent-workflow.md) — Dùng ngôn ngữ tự nhiên điều khiển AI viết trang
- [`nb portal info`](../../api/cli/portal/info.md) — Xem vị trí workspace phát triển của Portal
