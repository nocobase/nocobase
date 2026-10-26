---
title: 'Trung Tâm Công Việc'
description: 'Sao chép prompt cho Agent để kết nối phê duyệt, nhận thiết bị và các công việc cá nhân khác vào một lối vào duy nhất, bao gồm xử lý, số đếm và tác vụ cũ.'
keywords: 'trung tâm task, tác vụ cá nhân, Agent, phê duyệt, xây dựng ứng dụng'
---

# Trung Tâm Công Việc

## 1. Giới thiệu

### Khi công việc trải rộng trên nhiều nghiệp vụ

Một người quản lý cần xem tại một chỗ các đơn nghỉ phép và đơn thanh toán chi phí đang chờ duyệt. Một nhân viên cần nộp bổ sung chứng từ còn thiếu và xác nhận đã nhận thiết bị.

Hãy dùng Trung Tâm Công Việc khi công việc cá nhân nằm rải rác ở nhiều nghiệp vụ khác nhau.

### Tìm việc nhanh và theo dõi được

Mở một lối vào duy nhất để thấy những việc cần bạn xử lý và đi vào nghiệp vụ liên quan để xử lý.

Giảm việc chuyển qua lại và bỏ sót tác vụ. Trạng thái và số đếm được cập nhật cho thấy việc nào đã xong và việc nào còn lại.

## 2. Thử bốn bước trong dự án của bạn

Hoàn thành các bước 1–4, sau đó thử các kịch bản tùy chọn. Gửi từng prompt cho Agent trong dự án ứng dụng của bạn và kiểm tra kết quả.

### 1. Tạo lối vào

Gom công việc cá nhân về một nơi thay vì kiểm tra từng trang nghiệp vụ.

Ví dụ: Một người quản lý mở Việc của tôi từ thanh điều hướng.

```text
Managers handle leave requests, expenses and other applications every day. They want one place to see everything waiting for their attention without checking each business separately.
Add a My tasks page where each person sees only their own pending, completed and cancelled items, with a count for each.
```

Kiểm tra kết quả:

- Người dùng đã đăng nhập thấy công việc của chính mình và trạng thái trống.
- Tìm việc theo nghiệp vụ và trạng thái.

### 2. Kết nối phê duyệt

Cho người quản lý một nơi để tìm các đơn đang chờ họ quyết định.

Ví dụ: Các phê duyệt nghỉ phép và chi phí của một người quản lý hiển thị cùng nhau.

```text
Include existing leave and expense requests in My tasks, showing their type and number to the person responsible for approval. Keep the approval rules unchanged.
After a transfer, only the new approver needs to handle the request. Withdrawn requests no longer need approval. Do not show the same work twice.
```

Kiểm tra kết quả:

- Chuyển giao sẽ hủy việc của người nhận cũ và tạo việc chờ xử lý cho người nhận mới.
- Chỉ hiển thị các thao tác phê duyệt hiện đang được cung cấp.

### 3. Xử lý công việc

Mở một tác vụ, dùng các thao tác mà nghiệp vụ cho phép và làm mới sau khi xử lý.

Ví dụ: Phê duyệt một khoản chi phí sẽ chuyển nó sang đã hoàn tất và giảm số việc chờ xử lý.

```text
I want to open a task, read the application and approve it, or confirm receipt when collecting equipment.
After handling, move the item to completed and update the remaining count. Only people allowed to handle it may act. Explain withdrawn items and stop further handling.
```

Kiểm tra kết quả:

- Chỉ những người được phép xử lý mới xem được chi tiết và thao tác.
- Xử lý xong sẽ làm mới danh sách và mọi số đếm liên quan.

### 4. Kiểm tra kết quả

Yêu cầu Agent kiểm tra với công việc nghiệp vụ thực tế, sau đó tự mình thử.

Ví dụ: Alex xử lý việc của Alex; Jordan không thể đọc hay xử lý các mục cá nhân của Alex.

```text
Try the flow with two test accounts, Alex and Jordan: receive work, open details, handle it and check the remaining count.
Confirm neither can see or handle the other’s personal work, repeated clicks do not create duplicate work, and failed handling is not shown as complete. Tell me what was verified and give me a path to try myself.
```

Kiểm tra kết quả:

- Đã kiểm tra việc tách biệt giữa hai tài khoản.
- Các kịch bản đã chạy và chưa chạy được báo cáo riêng.

### Nhận thiết bị

Nhận thiết bị, bổ sung chứng từ và xác nhận giao hàng có thể là tác vụ không có giai đoạn phê duyệt.

Ví dụ: Cấp EQ-001 cho Alex sẽ tạo một việc; xác nhận đã nhận sẽ hoàn tất việc đó.

```text
When equipment is ready for collection, show the collection record in the assigned employee’s My tasks. Let them open it, review the equipment and confirm receipt.
Successful collection completes the item; an administrator withdrawing the issue cancels it. Do not show the same record twice, and keep it pending if collection fails.
```

Kiểm tra kết quả:

- Cùng một việc không xuất hiện hai lần.
- Nhận thành công sẽ hoàn tất mục đó; nhận thất bại thì mục vẫn ở trạng thái chờ.

### Huy hiệu trên dashboard

Hiển thị số việc chờ xử lý mà không cần mở toàn bộ danh sách.

Ví dụ: Hai tác vụ chi phí và một tác vụ thiết bị cho huy hiệu tổng hợp mọi nguồn là 3.

```text
Show how many things I still need to handle on the home page. Clicking the number should open the matching task list.
Update the count and list after each item is handled. Show “No pending work” when there is none. After switching accounts, show only the new account’s work.
```

Kiểm tra kết quả:

- Số đếm trên dashboard khớp với danh sách tác vụ mà nó mở ra.
- Bộ lọc nghiệp vụ hiển thị đúng công việc tương ứng; đổi tài khoản thì chỉ thấy công việc của tài khoản đó.

### Phân công lại

Hủy mục chưa hoàn tất của người nhận cũ và tạo việc cho người nhận mới.

Ví dụ: Việc thiết bị chuyển từ Alex sang Jordan; chỉ Jordan có thể xác nhận đã nhận.

```text
An administrator needs to reassign equipment that Alex has not collected to Jordan. Alex should no longer need or be able to confirm receipt; Jordan should see and handle the collection record.
Keep completed collection history unchanged and avoid duplicate tasks if the reassignment is repeated.
```

Kiểm tra kết quả:

- Người nhận cũ không thể xử lý việc đã được phân công lại.
- Lịch sử đã hoàn tất được giữ lại; việc chưa hoàn tất bị hủy theo quy định.

### Công việc cũ

Hiển thị cả việc cũ và việc mới trong một ứng dụng đang được sử dụng.

Ví dụ: Một lần bổ sung dữ liệu cũ bị tạm dừng được chạy tiếp mà không khôi phục trạng thái chờ đè lên việc đã hoàn tất trực tuyến.

```text
There are already unfinished approvals and equipment collections in this application. Let the responsible people find these in the new My tasks page while retaining the original business records.
Do not miss new work, ask people to handle completed work again or show duplicate items. If preparation is interrupted, continue next time without starting over.
```

Kiểm tra kết quả:

- Các lô bị gián đoạn chạy tiếp mà không tạo mục trùng.
- Việc đã hoàn tất không bao giờ trở lại trạng thái chờ.

### Nhắc nhở

Thông báo báo hiệu có việc cần làm; việc hoàn tất vẫn diễn ra trong nghiệp vụ.

Ví dụ: Đọc nhắc nhở nhận thiết bị không làm hoàn tất tác vụ.

```text
When equipment is ready, remind the assigned employee inside the application and let them open the collection record from the reminder.
Remind them only once per issue. Reading the reminder does not mean equipment has been collected; complete the task only after the employee confirms receipt successfully. A missing reminder must not prevent collection.
```

Kiểm tra kết quả:

- Mỗi sự kiện nghiệp vụ và người nhận chỉ có một nhắc nhở.
- Đọc không làm hoàn tất tác vụ; gửi thất bại không hoàn tác các thao tác ghi nghiệp vụ.

## Năng lực liên quan

[Phê duyệt](./approval/index.md) · [Thông báo](./notification/usage.md)
