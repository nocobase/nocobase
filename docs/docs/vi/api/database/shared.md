:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


**Tham số**

| Tên tham số            | Kiểu          | Giá trị mặc định | Mô tả                                                 |
| :--------------------- | :------------ | :-------------- | :---------------------------------------------------- |
| `options.values`       | `M`           | `{}`            | Đối tượng dữ liệu cần chèn                            |
| `options.whitelist?`   | `string[]`    | -               | Danh sách trắng các trường cho `values`. Chỉ các trường trong danh sách mới được lưu trữ. |
| `options.blacklist?`   | `string[]`    | -               | Danh sách đen các trường cho `values`. Các trường trong danh sách sẽ không được lưu trữ. |
| `options.transaction?` | `Transaction` | -               | Giao dịch                                             |