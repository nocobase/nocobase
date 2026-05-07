---
title: "Luồng sự kiện FlowEngine"
description: "Luồng sự kiện FlowEngine: điều phối logic được điều khiển bởi sự kiện trong Flow, Step thực thi tuần tự, quản lý thay đổi thuộc tính và phản hồi sự kiện."
keywords: "Luồng sự kiện,Event Flow,Step,Điều phối Flow,Thay đổi thuộc tính,Phản hồi sự kiện,FlowEngine,NocoBase"
---

# Luồng sự kiện

Trong FlowEngine, tất cả component trên giao diện đều **được điều khiển bởi sự kiện (Event-driven)**.  
Hành vi, tương tác và thay đổi dữ liệu của component đều được kích hoạt bởi sự kiện (Event) và thực thi qua Flow.

## Luồng tĩnh và luồng động

Trong FlowEngine, Flow có thể chia làm hai loại:

### **1. Luồng tĩnh (Static Flow)**

- Được nhà phát triển định nghĩa trong code;
- Tác động lên **tất cả các instance của một class Model**;
- Thường được dùng để xử lý logic chung của một class Model;

### **2. Luồng động (Dynamic Flow)**

- Được người dùng cấu hình trên giao diện;
- Chỉ có hiệu lực với một instance cụ thể;
- Thường được dùng cho hành vi cá nhân hóa cho ngữ cảnh cụ thể;

Nói ngắn gọn: **Luồng tĩnh là template logic được định nghĩa trên class, luồng động là logic cá nhân hóa được định nghĩa trên instance.**

## Quy tắc liên động vs Luồng động

Trong hệ thống cấu hình của FlowEngine, có hai cách triển khai logic sự kiện:

### **1. Quy tắc liên động (Linkage Rules)**

- Là **bao đóng Step luồng sự kiện tích hợp sẵn**;
- Cấu hình đơn giản hơn, ngữ nghĩa rõ ràng hơn;
- Về bản chất vẫn là một dạng đơn giản hóa của **luồng sự kiện (Flow)**.

### **2. Luồng động (Dynamic Flow)**

- Khả năng cấu hình Flow đầy đủ;
- Có thể tùy chỉnh:
  - **Trigger (on)**: định nghĩa khi nào kích hoạt;
  - **Bước thực thi (steps)**: định nghĩa logic thực thi;
- Áp dụng cho logic nghiệp vụ phức tạp và linh hoạt hơn.

Vì vậy, **quy tắc liên động ≈ luồng sự kiện đơn giản hóa**, cơ chế cốt lõi của hai cái nhất quán.

## Tính nhất quán của FlowAction

Cho dù là **quy tắc liên động** hay **luồng sự kiện**, đều nên dùng cùng một bộ **FlowAction**.  
Tức là:

- **FlowAction** định nghĩa các thao tác có thể được Flow gọi;
- Cả hai dùng chung một hệ thống action, không phải triển khai hai bộ riêng;
- Như vậy có thể đảm bảo tái sử dụng logic, mở rộng nhất quán.

## Cấp độ khái niệm

Về mặt khái niệm, mối quan hệ trừu tượng cốt lõi của FlowModel như sau:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Sự kiện toàn cục (Global Events)
      │     └── Sự kiện cục bộ (Local Events)
      └── FlowActionDefinition
            ├── Thao tác toàn cục (Global Actions)
            └── Thao tác cục bộ (Local Actions)
```

### Mô tả các cấp

- **FlowModel**  
  Biểu thị một thực thể model có thể cấu hình, có thể thực thi logic luồng.

- **FlowDefinition**  
  Định nghĩa một bộ logic luồng đầy đủ (bao gồm điều kiện kích hoạt và các bước thực thi).

- **FlowEventDefinition**  
  Định nghĩa nguồn kích hoạt của Flow, bao gồm:
  - **Sự kiện toàn cục**: như ứng dụng khởi động, dữ liệu tải xong;
  - **Sự kiện cục bộ**: như Field thay đổi, click nút.

- **FlowActionDefinition**  
  Định nghĩa các action mà Flow có thể thực thi, bao gồm:
  - **Thao tác toàn cục**: như làm mới trang, thông báo toàn cục;
  - **Thao tác cục bộ**: như sửa giá trị Field, chuyển đổi trạng thái component.

## Tóm tắt

| Khái niệm | Tác dụng | Phạm vi hiệu lực |
|------|------|-----------|
| **Luồng tĩnh (Static Flow)** | Logic luồng được định nghĩa trong code | Tất cả các instance của XXModel |
| **Luồng động (Dynamic Flow)** | Logic luồng được định nghĩa trên giao diện | Một instance FlowModel | 
| **FlowEvent** | Định nghĩa trigger (khi nào kích hoạt) | Toàn cục hoặc cục bộ | 
| **FlowAction** | Định nghĩa logic thực thi | Toàn cục hoặc cục bộ |
| **Quy tắc liên động (Linkage Rule)** | Bao đóng Step luồng sự kiện đơn giản hóa | Cấp Block, Action | 
