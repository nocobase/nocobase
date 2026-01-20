:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan về phát triển plugin

NocoBase áp dụng **kiến trúc vi nhân (microkernel)**, trong đó phần lõi chỉ chịu trách nhiệm điều phối vòng đời plugin, quản lý các phụ thuộc và đóng gói các khả năng cơ bản. Tất cả các chức năng nghiệp vụ đều được cung cấp dưới dạng plugin. Do đó, việc hiểu rõ cấu trúc tổ chức, vòng đời và cách quản lý plugin là bước đầu tiên để tùy chỉnh NocoBase.

## Các khái niệm cốt lõi

- **Cắm và chạy (Plug and Play)**: Bạn có thể cài đặt, kích hoạt hoặc vô hiệu hóa plugin theo nhu cầu, cho phép kết hợp linh hoạt các chức năng nghiệp vụ mà không cần sửa đổi mã nguồn.
- **Tích hợp toàn diện (Full-stack Integration)**: Plugin thường bao gồm cả triển khai phía máy chủ (server-side) và phía máy khách (client-side), đảm bảo tính nhất quán giữa logic dữ liệu và tương tác giao diện người dùng.

## Cấu trúc cơ bản của plugin

Mỗi plugin là một gói npm độc lập, thường có cấu trúc thư mục như sau:

```bash
plugin-hello/
├─ package.json          # Tên plugin, các phụ thuộc và siêu dữ liệu plugin của NocoBase
├─ client.js             # Sản phẩm biên dịch phía frontend, dùng để tải khi chạy
├─ server.js             # Sản phẩm biên dịch phía server, dùng để tải khi chạy
├─ src/
│  ├─ client/            # Mã nguồn phía client, có thể đăng ký các khối (block), hành động (action), trường (field), v.v.
│  └─ server/            # Mã nguồn phía server, có thể đăng ký các tài nguyên (resource), sự kiện (event), lệnh dòng lệnh (command), v.v.
```

## Quy ước thư mục và thứ tự tải

NocoBase mặc định sẽ quét các thư mục sau để tải plugin:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Các plugin đang trong quá trình phát triển (ưu tiên cao nhất)
└── storage/
    └── plugins/          # Các plugin đã được biên dịch, ví dụ: plugin đã tải lên hoặc đã phát hành
```

- `packages/plugins`: Thư mục chứa các plugin dùng để phát triển cục bộ, hỗ trợ biên dịch và gỡ lỗi theo thời gian thực.
- `storage/plugins`: Nơi lưu trữ các plugin đã được biên dịch, chẳng hạn như các phiên bản thương mại hoặc plugin của bên thứ ba.

## Vòng đời và trạng thái của plugin

Một plugin thường trải qua các giai đoạn sau:

1. **Tạo (create)**: Tạo một mẫu plugin thông qua CLI.
2. **Kéo (pull)**: Tải gói plugin về máy cục bộ, nhưng chưa ghi vào cơ sở dữ liệu.
3. **Kích hoạt (enable)**: Lần đầu tiên kích hoạt sẽ thực hiện "đăng ký + khởi tạo"; các lần kích hoạt sau chỉ tải logic.
4. **Vô hiệu hóa (disable)**: Dừng plugin hoạt động.
5. **Gỡ bỏ (remove)**: Xóa plugin hoàn toàn khỏi hệ thống.

:::tip

- Lệnh `pull` chỉ chịu trách nhiệm tải gói plugin; quá trình cài đặt thực sự được kích hoạt bởi lệnh `enable` lần đầu tiên.
- Nếu một plugin chỉ được `pull` nhưng chưa được kích hoạt, nó sẽ không được tải.

:::

### Ví dụ về lệnh CLI

```bash
# 1. Tạo cấu trúc plugin cơ bản
yarn pm create @my-project/plugin-hello

# 2. Kéo gói plugin (tải xuống hoặc liên kết)
yarn pm pull @my-project/plugin-hello

# 3. Kích hoạt plugin (tự động cài đặt khi kích hoạt lần đầu)
yarn pm enable @my-project/plugin-hello

# 4. Vô hiệu hóa plugin
yarn pm disable @my-project/plugin-hello

# 5. Gỡ bỏ plugin
yarn pm remove @my-project/plugin-hello
```

## Giao diện quản lý plugin

Truy cập trình quản lý plugin trong trình duyệt để xem và quản lý plugin một cách trực quan:

**Địa chỉ mặc định:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Trình quản lý plugin](https://static-docs.nocobase.com/20251030195350.png)