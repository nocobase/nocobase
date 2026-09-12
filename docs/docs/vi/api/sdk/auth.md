---
title: "Auth (SDK)"
description: "Auth trong SDK frontend của NocoBase: đăng nhập, đăng xuất, quản lý token."
keywords: "Auth SDK,đăng nhập,đăng xuất,quản lý token,xác thực frontend,NocoBase"
---

# Auth

## Tổng quan

Lớp `Auth` chủ yếu được dùng để lưu trữ thông tin người dùng phía client và gọi các API liên quan đến xác thực người dùng.

## Thuộc tính của instance

### `locale`

Ngôn ngữ mà người dùng hiện tại đang sử dụng.

### `role`

Vai trò mà người dùng hiện tại đang sử dụng.

### `token`

Token cho API.

### `authenticator`

Authenticator được dùng khi xác thực người dùng hiện tại. Tham khảo [Xác thực người dùng](/auth-verification/auth/index.md).

## Phương thức của lớp

### `signIn()`

Đăng nhập người dùng.

#### Chữ ký

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Thông tin chi tiết

| Tên tham số     | Kiểu     | Mô tả                                |
| --------------- | -------- | ------------------------------------ |
| `values`        | `any`    | Tham số request của API đăng nhập     |
| `authenticator` | `string` | Định danh authenticator để đăng nhập |

### `signUp()`

Đăng ký người dùng.

#### Chữ ký

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Thông tin chi tiết

| Tên tham số     | Kiểu     | Mô tả                                |
| --------------- | -------- | ------------------------------------ |
| `values`        | `any`    | Tham số request của API đăng ký       |
| `authenticator` | `string` | Định danh authenticator để đăng ký   |

### `signOut()`

Đăng xuất.

#### Chữ ký

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Thông tin chi tiết

| Tên tham số     | Kiểu     | Mô tả                                |
| --------------- | -------- | ------------------------------------ |
| `values`        | `any`    | Tham số request của API đăng xuất    |
| `authenticator` | `string` | Định danh authenticator để đăng xuất |
