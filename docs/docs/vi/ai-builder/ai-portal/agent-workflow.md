---
title: "Cộng tác cùng AI Agent để xây dựng"
description: "Dùng ngôn ngữ tự nhiên điều khiển AI Agent viết trang frontend cho AI Portal, gồm cách viết câu lệnh, mẹo cộng tác và cách xử lý các vấn đề thường gặp."
keywords: "AI Portal,AI Agent,Cộng tác xây dựng,Câu lệnh,nocobase-portal-manage,Skills"
---

# Cộng tác cùng AI Agent để xây dựng

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã chạy được Portal đầu tiên theo [Bắt đầu nhanh với AI Portal](./index.md).

:::

Việc phát triển AI Portal hằng ngày chính là nói chuyện với AI Agent — bạn mô tả trang mình muốn, nó viết code, bạn xem kết quả trên trình duyệt.

## Làm việc ngay trong thư mục Portal

Trước khi bắt đầu, khuyến nghị vào thư mục mã nguồn của Portal rồi mở AI Agent ngay tại đó. Như vậy Agent bắt đầu là đã ở đúng ngữ cảnh, đọc được `AGENTS.md` và code hiện có.

Trước hết tra xem thư mục nằm ở đâu:

```bash
nb portal info main
```

Đường dẫn phát triển trong output chính là nơi chứa mã nguồn Portal. `cd` sang đó, rồi mở AI Agent của bạn:

```bash
cd <thư mục workspace phát triển>
```

Sau đó chỉ cần mô tả nhu cầu:

```
Thêm giúp tôi một trang danh sách đơn hàng vào main portal của nocobase
```

## Để AI đọc trước rồi mới viết

Thư mục gốc của template có một file `AGENTS.md`, ghi rõ các quy ước phát triển của dự án này: ưu tiên tái sử dụng những gì đã có trong `src/extensions`, tùy chỉnh component UI thì dùng cách kết hợp chứ đừng sửa thẳng component nền, và đừng đưa Ant Design vào. Các AI Agent có đọc file này sẽ tự động tuân theo những quy ước đó.

Bạn cũng có thể bổ sung quy ước riêng của dự án mình vào `AGENTS.md`, ví dụ thói quen đặt tên, thuật ngữ nghiệp vụ, những thư mục không được đụng vào. Viết vào đó rồi thì mọi cuộc hội thoại đều có hiệu lực, không phải dặn đi dặn lại.

Dưới `src/extensions` có sẵn vài extension tích hợp, trong đó `nocobase-users-example` là một trang CRUD hoàn chỉnh với đủ danh sách, tạo, chỉnh sửa, chi tiết. Cho AI viết trang mới theo mẫu đó sẽ đỡ hơn nhiều so với mô tả lại từ đầu:

```
Tham khảo cách viết của nocobase-users-example, làm một trang quản lý sản phẩm
```

## Ví dụ câu lệnh

### Tình huống A: Tạo một trang nghiệp vụ mới

Mô tả rõ ba việc là đủ — trong trang có gì, dữ liệu lấy từ đâu, tương tác thế nào:

```
Thêm một trang quản lý khách hàng:
bảng hiển thị tên, số điện thoại, email, thời gian tạo, hỗ trợ tìm kiếm theo tên,
click vào một dòng thì mở drawer chi tiết, trong drawer chỉnh sửa và lưu được luôn
```

<!-- 需要一张 AI 生成的客户管理页面效果截图，展示表格、搜索框和详情抽屉 -->

### Tình huống B: Cải tạo trang đã có

Với các nhu cầu dạng chỉnh sửa, hãy nói cụ thể chỗ cần sửa, không cần mô tả lại cả trang:

```
Thêm một bộ lọc trạng thái vào danh sách khách hàng,
các tùy chọn là "Đang theo dõi", "Đã chốt", "Đã mất", mặc định không lọc
```

<!-- 需要一张添加状态筛选后的页面截图 -->

### Tình huống C: Tích hợp một bảng dữ liệu mới

Sau khi bảng dữ liệu đã được tạo, hãy để AI sinh trang tương ứng. Nó sẽ đọc định nghĩa Field và dựa vào đó để quyết định control của biểu mẫu cùng các cột trong danh sách:

```
Tôi vừa tạo một bảng contracts, làm giúp tôi một bộ trang CRUD tương ứng
```

Nếu bảng chưa được tạo, bạn có thể dùng [Mô hình hóa dữ liệu](../data-modeling.md) để AI thiết kế cấu trúc dữ liệu trước, rồi quay lại làm trang.

<!-- 需要一张根据数据表自动生成的增删改查页面截图 -->

### Tình huống D: Dựng lại giao diện từ nguyên mẫu

Khi có bản thiết kế hoặc nguyên mẫu HTML sẵn, cứ đưa thẳng cho AI:

```
Làm trang chủ theo bản nguyên mẫu này,
giữ nguyên màu sắc và bố cục, dữ liệu nối vào bảng orders
```

<!-- 需要一个视频，展示给出原型图后 AI 复刻出页面的过程 -->

### Tình huống E: Thêm một phương thức xác thực

Sau khi phía server đã bật một phương thức xác thực nào đó, trang đăng nhập cần phần hỗ trợ tương ứng ở frontend:

```
NocoBase đã bật đăng nhập DingTalk, thêm giúp trang đăng nhập nút đăng nhập DingTalk
```

<!-- 需要一张登录页出现第三方登录按钮的截图 -->

## Mẹo cộng tác

**Lặp từng bước nhỏ.** Mỗi lần chỉ để AI làm một trang hoặc một thay đổi, thấy kết quả rồi mới đi tiếp. Mô tả một hơi năm trang thì lúc có vấn đề rất khó biết bước nào đã đi chệch.

**Cứ để dịch vụ phát triển chạy suốt.** `nb portal dev main` chạy lên là có hot reload, AI sửa xong lần nào bạn thấy kết quả ngay lần đó, vòng phản hồi ngắn nhất có thể.

**Cung cấp lỗi rõ ràng.** Trang trắng, build thất bại, API trả 403 — hãy dán đầy đủ thông báo lỗi, ảnh chụp màn hình cho AI, đừng để AI tự đoán, thường vài lượt hội thoại là xong. Bạn không cần tự xác định vấn đề nằm ở tầng nào trước.

![error](https://static-docs.nocobase.com/20260803204308.png)

## Câu hỏi thường gặp

**AI sửa sai thì quay lui thế nào?**

Nếu mã nguồn Portal được quản lý bằng Git, chỉ cần `git checkout` để quay lui là xong. Khi dùng source storage `nocobase` mặc định, bạn có thể kéo lại một bản từ source storage để ghi đè lên bản cục bộ:

```bash
nb portal pull main --force
```

`--force` sẽ xóa workspace phát triển rồi kéo lại, nên trước khi chạy hãy xác nhận không còn thay đổi nào bạn muốn giữ. Muốn tránh sự đánh đổi này, khuyến nghị chuyển mã nguồn sang Git từ sớm, cách làm cụ thể xem [Triển khai và quản lý mã nguồn](./deploy.md).

**Build thất bại thì chẩn đoán thế nào?**

Trước hết chạy build ở máy cục bộ một lần để xem lỗi đầy đủ:

```bash
nb portal deploy main
```

Lỗi kiểu TypeScript và thiếu dependency là hai loại thường gặp nhất, cứ dán lỗi cho AI để nó sửa là được.

**Tự sửa code và AI sửa code có xung đột không?**

Không. Mã nguồn Portal chỉ là một dự án frontend bình thường, bạn có thể tự sửa bất cứ lúc nào, cũng có thể để AI sửa tiếp. Chỉ cần không cùng lúc sửa cùng một file thì đều không sao.

## Liên kết liên quan

- [Bắt đầu nhanh với AI Portal](./index.md) — Chạy được entry frontend đầu tiên do AI viết
- [Triển khai và quản lý mã nguồn](./deploy.md) — Đưa mã nguồn Portal vào Git, và quy trình triển khai
- [Cấu trúc dự án và công nghệ sử dụng](./project-structure.md) — Quy ước thư mục của template, giúp bạn đánh giá AI viết đúng hay chưa
- [Component chuẩn và mở rộng](./components.md) — Nền component shadcn/ui và cơ chế mở rộng
- [Mô hình hóa dữ liệu](../data-modeling.md) — Để AI thiết kế bảng dữ liệu trước rồi mới làm trang
- [`nb portal info`](../../api/cli/portal/info.md) — Xem vị trí workspace phát triển của Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — Kéo lại mã nguồn từ source storage
