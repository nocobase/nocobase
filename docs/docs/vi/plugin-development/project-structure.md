:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cấu trúc dự án

Dù bạn clone mã nguồn từ Git hay khởi tạo dự án bằng `create-nocobase-app`, dự án NocoBase được tạo ra về bản chất đều là một monorepo (kho lưu trữ đa gói) dựa trên **Yarn Workspace**.

## Tổng quan về thư mục cấp cao nhất

Ví dụ sau đây sử dụng `my-nocobase-app/` làm thư mục dự án. Có thể có một vài khác biệt nhỏ tùy thuộc vào môi trường:

```bash
my-nocobase-app/
├── packages/              # Mã nguồn dự án
│   ├── plugins/           # Các plugin đang phát triển (chưa biên dịch)
├── storage/               # Dữ liệu runtime và nội dung được tạo động
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Các plugin đã biên dịch (bao gồm cả những plugin được tải lên qua giao diện người dùng)
│   └── tar/               # Các tệp gói plugin (.tar)
├── scripts/               # Các script tiện ích và lệnh công cụ
├── .env*                  # Cấu hình biến môi trường cho các môi trường khác nhau
├── lerna.json             # Cấu hình workspace của Lerna
├── package.json           # Cấu hình gói gốc, khai báo workspace và các script
├── tsconfig*.json         # Cấu hình TypeScript (frontend, backend, ánh xạ đường dẫn)
├── vitest.config.mts      # Cấu hình kiểm thử đơn vị Vitest
└── playwright.config.ts   # Cấu hình kiểm thử E2E Playwright
```

## Mô tả thư mục con packages/

Thư mục `packages/` chứa các module cốt lõi và các gói mở rộng của NocoBase. Nội dung của thư mục này phụ thuộc vào nguồn gốc dự án:

- **Các dự án được tạo bằng `create-nocobase-app`**: Mặc định chỉ bao gồm `packages/plugins/`, dùng để lưu trữ mã nguồn của các plugin tùy chỉnh. Mỗi thư mục con là một gói npm độc lập.
- **Khi clone kho mã nguồn chính thức**: Bạn sẽ thấy nhiều thư mục con hơn, như `core/`, `plugins/`, `pro-plugins/`, `presets/`, v.v., tương ứng với các module cốt lõi của framework, các plugin tích hợp sẵn và các giải pháp cài đặt sẵn chính thức.

Trong cả hai trường hợp, `packages/plugins` là vị trí chính để phát triển và gỡ lỗi các plugin tùy chỉnh.

## Thư mục runtime storage/

Thư mục `storage/` lưu trữ dữ liệu được tạo ra trong quá trình runtime và các kết quả build. Mô tả các thư mục con phổ biến như sau:

- `apps/`: Cấu hình và bộ nhớ đệm cho các kịch bản đa ứng dụng.
- `logs/`: Các tệp log runtime và đầu ra gỡ lỗi.
- `uploads/`: Các tệp và tài nguyên media do người dùng tải lên.
- `plugins/`: Các plugin đã đóng gói được tải lên qua giao diện người dùng (UI) hoặc nhập qua CLI.
- `tar/`: Các gói plugin nén được tạo ra sau khi thực thi `yarn build <plugin> --tar`.

> Thông thường, chúng tôi khuyến nghị thêm thư mục `storage` vào `.gitignore` và xử lý riêng biệt khi triển khai hoặc sao lưu.

## Cấu hình môi trường và các script dự án

- `.env`, `.env.test`, `.env.e2e`: Được sử dụng lần lượt cho chạy cục bộ, kiểm thử đơn vị/tích hợp và kiểm thử end-to-end (E2E).
- `scripts/`: Chứa các script vận hành và bảo trì phổ biến (ví dụ: khởi tạo cơ sở dữ liệu, các công cụ hỗ trợ phát hành, v.v.).

## Đường dẫn tải plugin và độ ưu tiên

Các plugin có thể tồn tại ở nhiều vị trí khác nhau. Khi NocoBase khởi động, hệ thống sẽ tải chúng theo thứ tự ưu tiên sau:

1. Phiên bản mã nguồn trong `packages/plugins` (dùng cho phát triển và gỡ lỗi cục bộ).
2. Phiên bản đã đóng gói trong `storage/plugins` (được tải lên qua giao diện người dùng hoặc nhập qua CLI).
3. Các gói phụ thuộc trong `node_modules` (được cài đặt qua npm/yarn hoặc tích hợp sẵn trong framework).

Khi một plugin có cùng tên tồn tại đồng thời trong thư mục mã nguồn và thư mục đã đóng gói, hệ thống sẽ ưu tiên tải phiên bản mã nguồn, giúp việc ghi đè và gỡ lỗi cục bộ trở nên thuận tiện.

## Mẫu thư mục plugin

Tạo một plugin bằng CLI:

```bash
yarn pm create @my-project/plugin-hello
```

Cấu trúc thư mục được tạo ra như sau:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Đầu ra build (được tạo khi cần)
├── src/                     # Thư mục mã nguồn
│   ├── client/              # Mã frontend (các khối, trang, mô hình, v.v.)
│   │   ├── plugin.ts        # Lớp chính của plugin phía client
│   │   └── index.ts         # Điểm vào phía client
│   ├── locale/              # Tài nguyên đa ngôn ngữ (chia sẻ giữa frontend và backend)
│   ├── swagger/             # Tài liệu OpenAPI/Swagger
│   └── server/              # Mã phía server
│       ├── collections/     # Định nghĩa bảng dữ liệu / bộ sưu tập
│       ├── commands/        # Các lệnh tùy chỉnh
│       ├── migrations/      # Các script di chuyển cơ sở dữ liệu
│       ├── plugin.ts        # Lớp chính của plugin phía server
│       └── index.ts         # Điểm vào phía server
├── index.ts                 # Xuất cầu nối frontend và backend
├── client.d.ts              # Khai báo kiểu dữ liệu phía frontend
├── client.js                # Sản phẩm build phía frontend
├── server.d.ts              # Khai báo kiểu dữ liệu phía server
├── server.js                # Sản phẩm build phía server
├── .npmignore               # Cấu hình bỏ qua khi phát hành
└── package.json
```

> Sau khi quá trình build hoàn tất, thư mục `dist/` cùng các tệp `client.js` và `server.js` sẽ được tải khi plugin được kích hoạt.  
> Trong giai đoạn phát triển, bạn chỉ cần sửa đổi thư mục `src/`. Trước khi phát hành, hãy thực thi `yarn build <plugin>` hoặc `yarn build <plugin> --tar`.