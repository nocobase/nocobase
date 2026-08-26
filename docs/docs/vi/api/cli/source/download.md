---
title: "nb source download"
description: "Tài liệu lệnh nb source download: lấy source code hoặc image NocoBase từ npm, Docker hoặc Git."
keywords: "nb source download,NocoBase CLI,Tải xuống,npm,Docker,Git"
---

# nb source download

Lấy NocoBase từ npm, Docker hoặc Git. `--version` là tham số phiên bản dùng chung cho cả ba source: npm dùng version package, Docker dùng image tag, Git dùng git ref.

## Cách dùng

```bash
nb source download [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Dùng giá trị mặc định và bỏ qua các câu hỏi tương tác |
| `--verbose` | boolean | Hiển thị output lệnh chi tiết |
| `--locale` | string | Ngôn ngữ CLI prompt: `en-US` hoặc `zh-CN` |
| `--source`, `-s` | string | Cách lấy: `docker`, `npm` hoặc `git` |
| `--version`, `-v` | string | Version package npm, tag image Docker hoặc Git ref |
| `--replace`, `-r` | boolean | Thay thế khi thư mục đích đã tồn tại |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | Có cài devDependencies khi dùng npm/Git hay không |
| `--output-dir`, `-o` | string | Thư mục đích để tải về, hoặc thư mục lưu Docker tarball |
| `--git-url` | string | Địa chỉ Git repository |
| `--docker-registry` | string | Tên Docker registry, không bao gồm tag |
| `--docker-platform` | string | Platform Docker image: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | Có lưu Docker image thành tarball sau khi pull hay không |
| `--npm-registry` | string | Registry npm cho việc tải xuống và cài đặt dependency của npm/Git |
| `--build` / `--no-build` | boolean | Có build sau khi cài đặt dependency npm/Git hay không |
| `--build-dts` | boolean | Có sinh file khai báo TypeScript khi build npm/Git hay không |

## Ví dụ

```bash
nb source download
nb source download -y --source npm --version alpha
nb source download -y --source npm --version alpha --no-build
nb source download --source npm --version alpha --output-dir=./app
nb source download --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64
nb source download -y --source docker --version alpha --docker-save -o ./docker-images
nb source download --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git
nb source download --source git --version fix/cli-v2
nb source download -y --source npm --version alpha --build-dts
nb source download -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com
```

## Alias version

Với source Git, các dist-tag thường dùng sẽ resolve sang nhánh tương ứng: `latest` → `main`, `beta` → `next`, `alpha` → `develop`.

## Lệnh liên quan

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
