---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

Sau khi kích hoạt Plugin dịch vụ NocoBase MCP, ứng dụng NocoBase sẽ cung cấp một interface dịch vụ MCP ra ngoài, để các MCP client truy cập và gọi các API của NocoBase.

## Địa chỉ dịch vụ

- Ứng dụng chính:

  `http(s)://<host>:<port>/api/mcp`

- Ứng dụng con:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Địa chỉ này sử dụng giao thức truyền tải `streamable HTTP`.

## Năng lực cung cấp

### Công cụ chung

Có thể dùng để thao tác với bảng dữ liệu

| Tên công cụ           | Mô tả chức năng                                       |
| ------------------ | ---------------------------------------------- |
| `resource_list`    | Lấy danh sách dữ liệu                                   |
| `resource_get`     | Lấy chi tiết dữ liệu                                   |
| `resource_create`  | Tạo dữ liệu                                       |
| `resource_update`  | Cập nhật dữ liệu                                       |
| `resource_destroy` | Xóa dữ liệu                                       |
| `resource_query`   | Truy vấn dữ liệu, hỗ trợ điều kiện truy vấn phức tạp như aggregate, truy vấn liên kết... |

### Các interface kernel NocoBase và các Plugin

Hỗ trợ điều khiển những package nào được MCP expose qua header `x-mcp-packages`, ví dụ:

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

Header này hỗ trợ truyền tên package đầy đủ, khi không có scope sẽ tự động bổ sung thành `@nocobase/`.

Mặc định không tải interface của các package khác ngoài công cụ chung, khuyến nghị sử dụng cách [NocoBase CLI](../quick-start.md) để thao tác với các tính năng hệ thống khác.

Các package thường dùng:

| Tên package                                   | Mô tả chức năng                                 |
| -------------------------------------- | ---------------------------------------- |
| `@nocobase/plugin-data-source-main`    | Quản lý nguồn dữ liệu chính, bao gồm tạo bảng, thêm Field... |
| `@nocobase/plugin-data-source-manager` | Quản lý nguồn dữ liệu, lấy thông tin nguồn dữ liệu khả dụng           |
| `@nocobase/plugin-workflow`            | Quản lý Workflow                               |
| `@nocobase/plugin-acl`                 | Quản lý vai trò và quyền                           |
| `@nocobase/plugin-users`               | Quản lý người dùng                                 |

Bạn có thể tham khảo thêm các package và interface liên quan qua Plugin [API documentation](/integration/api-doc).

## Phương thức xác thực

### Xác thực qua API Key

Sử dụng API key được tạo qua Plugin [API keys](/auth-verification/api-keys/index.md) để gọi interface dịch vụ MCP, quyền hạn được quyết định bởi vai trò gắn với API key đó.

### Xác thực qua OAuth

Sử dụng access token có được sau khi xác thực OAuth để gọi interface dịch vụ MCP, quyền hạn được quyết định bởi người dùng đã xác thực. Nếu người dùng có nhiều vai trò, có thể đặt vai trò gọi qua header `x-role`.

## Bắt đầu nhanh

### Codex

#### Sử dụng xác thực API Key

Trước tiên kích hoạt Plugin API Keys và tạo một API Key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Sử dụng xác thực OAuth

Trước tiên kích hoạt Plugin IdP: OAuth.

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Sử dụng xác thực API Key

Trước tiên kích hoạt Plugin API Keys và tạo một API Key.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Sử dụng xác thực OAuth

Trước tiên kích hoạt Plugin IdP: OAuth.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

Sau khi thực thi xong, mở Claude và chọn dịch vụ MCP tương ứng để đăng nhập:

```bash
claude
/mcp
```

### OpenCode

#### Sử dụng xác thực API Key

Trước tiên kích hoạt Plugin API Keys và tạo một API Key. Cấu hình `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer <your_api_key>"
      }
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

#### Sử dụng xác thực OAuth

Trước tiên kích hoạt Plugin IdP: OAuth. Cấu hình `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

Đăng nhập xác thực

```bash
opencode mcp auth nocobase
```

Debug

```bash
opencode mcp debug nocobase
```
