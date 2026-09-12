---
title: "Tham số chung của Repository"
description: "Tham số chung của các phương thức Repository NocoBase: values, whitelist, blacklist, transaction, v.v."
keywords: "Repository,tham số chung,CreateOptions,UpdateOptions,NocoBase"
---

**Tham số**

| Tên tham số            | Kiểu          | Giá trị mặc định | Mô tả                                                            |
| ---------------------- | ------------- | ---------------- | ---------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`             | Đối tượng dữ liệu cần insert                                     |
| `options.whitelist?`   | `string[]`    | -                | Whitelist của các field trong `values`, chỉ các field trong whitelist sẽ được lưu |
| `options.blacklist?`   | `string[]`    | -                | Blacklist của các field trong `values`, các field trong blacklist sẽ không được lưu |
| `options.transaction?` | `Transaction` | -                | Transaction                                                       |
