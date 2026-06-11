---
title: "Tổng quan phát triển Plugin server"
description: "Phát triển Plugin server NocoBase: lớp Plugin, app, db, resource, ACL, database, migration, middleware, event, command line."
keywords: "Plugin server,Server Plugin,lớp Plugin,app,db,ACL,migration,NocoBase"
---

# Tổng quan

Plugin server của NocoBase có thể làm rất nhiều việc: định nghĩa bảng dữ liệu, viết API tùy chỉnh, quản lý quyền, lắng nghe sự kiện, đăng ký tác vụ định kỳ, thậm chí mở rộng lệnh CLI. Tất cả những năng lực này đều được tổ chức thông qua một lớp Plugin thống nhất.

| Tôi muốn… | Xem ở đâu |
|-----------|-----------|
| Tìm hiểu vòng đời lớp Plugin và thành viên `app` | [Plugin](./plugin.md) |
| CRUD database, quản lý transaction | [Database](./database.md) |
| Định nghĩa hoặc mở rộng bảng dữ liệu bằng code | [Collections](./collections.md) |
| Migration dữ liệu khi nâng cấp Plugin | [Migration](./migration.md) |
| Quản lý nhiều nguồn dữ liệu | [DataSourceManager](./data-source-manager.md) |
| Đăng ký API tùy chỉnh và Action resource | [ResourceManager](./resource-manager.md) |
| Cấu hình quyền API | [ACL](./acl.md) |
| Thêm interceptor request/response hoặc middleware | [Context](./context.md) và [Middleware](./middleware.md) |
| Lắng nghe sự kiện ứng dụng hoặc database | [Event](./event.md) |
| Sử dụng cache để cải thiện hiệu năng | [Cache](./cache.md) |
| Đăng ký tác vụ định kỳ | [CronJobManager](./cron-job-manager.md) |
| Hỗ trợ đa ngôn ngữ | [I18n](./i18n.md) |
| Tùy chỉnh log output | [Logger](./logger.md) |
| Mở rộng lệnh CLI | [Command](./command.md) |
| Viết test case | [Test](./test.md) |

## Liên kết liên quan

- [Plugin](./plugin.md) — Vòng đời lớp Plugin, các phương thức thành viên và đối tượng `app`
- [Collections](./collections.md) — Định nghĩa hoặc mở rộng cấu trúc bảng dữ liệu bằng code
- [Database](./database.md) — CRUD, Repository, transaction và sự kiện database
- [ResourceManager](./resource-manager.md) — Đăng ký API tùy chỉnh và Action resource
- [ACL](./acl.md) — Quyền role, đoạn quyền và kiểm soát truy cập
- [Tổng quan phát triển Plugin](../index.md) — Giới thiệu tổng thể về phát triển Plugin
- [Viết Plugin đầu tiên](../write-your-first-plugin.md) — Tạo Plugin hoàn chỉnh từ đầu
