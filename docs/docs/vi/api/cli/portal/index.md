---
title: "nb portal"
description: "Tài liệu lệnh nb portal: quản lý workspace Portal, gồm cấu hình, tạo, phát triển, đồng bộ mã nguồn, triển khai và xóa."
keywords: "nb portal,NocoBase CLI,Portal,workspace,source storage,deploy"
---

# nb portal

`nb portal` quản lý workspace Portal. Một Portal có thể có mã nguồn frontend, đường dẫn truy cập và kết quả triển khai riêng; nhóm lệnh này kết nối bản ghi Portal trong NocoBase với workspace cục bộ và source storage.

Quy trình thường là tạo workspace cục bộ, chạy chế độ phát triển, đẩy thay đổi mã nguồn lên source storage, sau đó build và deploy. Nếu tiếp nhận một Portal đã có, hãy `pull` về cục bộ trước.

## Cách dùng

```bash
nb portal <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb portal config`](./config.md) | Cập nhật cấu hình mã nguồn của workspace Portal cục bộ và đồng bộ với bản ghi Portal từ xa khi có thể |
| [`nb portal create`](./create.md) | Tạo workspace Portal cục bộ từ template và tạo hoặc cập nhật bản ghi Portal |
| [`nb portal deploy`](./deploy.md) | Build và triển khai workspace Portal đã chỉ định |
| [`nb portal destroy`](./destroy.md) | Xóa bản ghi Portal và workspace cục bộ |
| [`nb portal dev`](./dev.md) | Khởi động chế độ phát triển cho workspace Portal đã chỉ định |
| [`nb portal info`](./info.md) | Hiển thị chi tiết bản ghi Portal và workspace cục bộ đã chỉ định |
| [`nb portal list`](./list.md) | Liệt kê bản ghi Portal và trạng thái đồng bộ workspace cục bộ |
| [`nb portal pull`](./pull.md) | Kéo mã nguồn Portal từ source storage về workspace cục bộ |
| [`nb portal push`](./push.md) | Đẩy thay đổi mã nguồn Portal cục bộ lên source storage |

## Quy trình điển hình

Tạo một Portal tên `customer`:

```bash
nb portal create customer -e dev --yes
```

Khởi động chế độ phát triển cục bộ:

```bash
nb portal dev customer -e dev --yes
```

Kiểm tra workspace cục bộ và bản ghi từ xa:

```bash
nb portal info customer -e dev --yes
nb portal list -e dev --yes
```

Đẩy mã nguồn và triển khai:

```bash
nb portal push customer -e dev --yes --message "Update customer portal"
nb portal deploy customer -e dev --yes
```

Tiếp nhận một Portal đã có:

```bash
nb portal list -e dev --yes
nb portal pull customer -e dev --yes
nb portal dev customer -e dev --yes
```

Chuyển source storage:

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal push customer -e dev --yes --message "Move customer portal source to Git"
```

## source storage

Khi tạo Portal, hãy chọn nơi quản lý mã nguồn:

| Chế độ | Mô tả |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the Portal source should be reviewed, versioned, or built through an existing team workflow.

The Portal name and source configuration are written to `portal.config.json` in the local workspace. `create`, `pull`, and `config` maintain this file; `push` and `deploy` read it to sync source or deployment output.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Chế độ | Mô tả |
| --- | --- |
| `local` | The workspace is independent of app storage. Source and deployment output are synced through APIs. |
| `docker` | The workspace does not depend on a Docker volume. Source and deployment output are synced through APIs. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support Portal management in the current version.

## Local Workspace Path

`create` defaults to a portal-named child of the current directory. The first `pull` uses the same location; if the current directory already contains `portal.config.json`, `pull` uses the current directory directly:

```text
<current-directory>/<portal>
```

`dev`, `push`, `deploy`, `config`, `destroy`, `info`, and `list` use the current directory as the local Portal workspace by default. Pass `--dir <path>` to any of these commands to select a workspace explicitly; relative paths are resolved from the current directory. The CLI does not derive the local workspace from the env `storagePath`.

The main app access path is usually:

```text
<appPublicPath>/x/<portal>/
```

A sub-app access path is usually:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

## Env Confirmation

Most `nb portal` subcommands support `--env` and `--yes`:

| Tham số | Mô tả |
| --- | --- |
| `--env`, `-e` | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | Skip cross-env confirmation when an explicit `--env` targets a different env from the current env. |

In scripts or AI agent workflows, pass `--env` and `--yes` explicitly to avoid stopping at an interactive confirmation.

## Lệnh liên quan

- [`nb env`](../env/index.md)
- [`nb app`](../app/index.md)
- [`nb source`](../source/index.md)
