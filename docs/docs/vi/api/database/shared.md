:::tip Thông báo dịch AI
Tài liệu này đã được dịch tự động bằng AI.
:::


**Tham số**

| Tên tham số            | Kiểu          | Giá trị mặc định | Mô tả                                                 |
| :--------------------- | :------------ | :-------------- | :---------------------------------------------------- |
| `options.values`       | `M`           | `{}`            | Đối tượng dữ liệu cần chèn                            |
| `options.whitelist?`   | `string[]`    | -               | Danh sách trắng các trường cho `values`. Chỉ các trường trong danh sách mới được lưu trữ. |
| `options.blacklist?`   | `string[]`    | -               | Danh sách đen các trường cho `values`. Các trường trong danh sách sẽ không được lưu trữ. |
| `options.transaction?` | `Transaction` | -               | Giao dịch                                             |