:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Luồng Sự Kiện

Trong FlowEngine, tất cả các thành phần giao diện đều được **điều khiển bởi sự kiện (event-driven)**.
Hành vi, tương tác và thay đổi dữ liệu của các thành phần đều được kích hoạt bởi các sự kiện và thực thi thông qua một luồng.

## Luồng Tĩnh và Luồng Động

Trong FlowEngine, các luồng có thể được chia thành hai loại:

### **1. Luồng Tĩnh (Static Flow)**

- Được định nghĩa bởi nhà phát triển trong mã nguồn;
- Tác động lên **tất cả các thể hiện của một lớp Model**;
- Thường được sử dụng để xử lý logic chung của một lớp Model;

### **2. Luồng Động (Dynamic Flow)**

- Được người dùng cấu hình trên giao diện;
- Chỉ có hiệu lực đối với một thể hiện cụ thể;
- Thường được sử dụng cho các hành vi cá nhân hóa trong các kịch bản cụ thể;

Nói tóm lại: **Luồng tĩnh là một mẫu logic được định nghĩa trên một lớp, trong khi luồng động là logic cá nhân hóa được định nghĩa trên một thể hiện.**

## Quy Tắc Liên Kết so với Luồng Động

Trong hệ thống cấu hình của FlowEngine, có hai cách để triển khai logic sự kiện:

### **1. Quy Tắc Liên Kết (Linkage Rules)**

- Là **sự đóng gói các bước của luồng sự kiện tích hợp sẵn**;
- Cấu hình đơn giản hơn và mang tính ngữ nghĩa cao hơn;
- Về bản chất, chúng vẫn là một dạng đơn giản hóa của **luồng sự kiện (Flow)**.

### **2. Luồng Động (Dynamic Flow)**

- Khả năng cấu hình Flow đầy đủ;
- Có thể tùy chỉnh:
  - **Bộ kích hoạt (on)**: Định nghĩa thời điểm kích hoạt;
  - **Các bước thực thi (steps)**: Định nghĩa logic sẽ được thực thi;
- Phù hợp với các logic nghiệp vụ phức tạp và linh hoạt hơn.

Do đó, **Quy Tắc Liên Kết ≈ Luồng Sự Kiện Đơn Giản Hóa**, và cơ chế cốt lõi của cả hai là nhất quán.

## Tính Nhất Quán của FlowAction

Dù là **Quy Tắc Liên Kết** hay **Luồng Sự Kiện**, cả hai đều nên sử dụng cùng một tập hợp các **FlowAction**.
Điều đó có nghĩa là:

- **FlowAction** định nghĩa các hành động có thể được gọi bởi một Flow;
- Cả hai cùng chia sẻ một hệ thống hành động, thay vì triển khai hai hệ thống riêng biệt;
- Điều này đảm bảo khả năng tái sử dụng logic và mở rộng nhất quán.

## Phân Cấp Khái Niệm

Về mặt khái niệm, mối quan hệ trừu tượng cốt lõi của FlowModel như sau:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Sự kiện Toàn cục (Global Events)
      │     └── Sự kiện Cục bộ (Local Events)
      └── FlowActionDefinition
            ├── Thao tác Toàn cục (Global Actions)
            └── Thao tác Cục bộ (Local Actions)
```

### Mô Tả Phân Cấp

- **FlowModel**  
  Đại diện cho một thực thể mô hình với logic luồng có thể cấu hình và thực thi.

- **FlowDefinition**  
  Định nghĩa một tập hợp logic luồng hoàn chỉnh (bao gồm điều kiện kích hoạt và các bước thực thi).

- **FlowEventDefinition**  
  Định nghĩa nguồn kích hoạt của luồng, bao gồm:
  - **Sự kiện toàn cục**: như khởi động ứng dụng, hoàn tất tải dữ liệu;
  - **Sự kiện cục bộ**: như thay đổi trường, nhấp nút.

- **FlowActionDefinition**  
  Định nghĩa các hành động có thể thực thi của luồng, bao gồm:
  - **Thao tác toàn cục**: như làm mới trang, thông báo toàn cục;
  - **Thao tác cục bộ**: như sửa đổi giá trị trường, chuyển đổi trạng thái thành phần.

## Tóm Tắt

| Khái niệm | Mục đích | Phạm vi áp dụng |
|------|------|-----------|
| **Luồng Tĩnh (Static Flow)** | Logic luồng được định nghĩa trong mã nguồn | Tất cả các thể hiện của XXModel |
| **Luồng Động (Dynamic Flow)** | Logic luồng được định nghĩa trên giao diện | Một thể hiện FlowModel duy nhất |
| **FlowEvent** | Định nghĩa bộ kích hoạt (thời điểm kích hoạt) | Toàn cục hoặc cục bộ |
| **FlowAction** | Định nghĩa logic thực thi | Toàn cục hoặc cục bộ |
| **Quy Tắc Liên Kết (Linkage Rule)** | Đóng gói các bước của luồng sự kiện được đơn giản hóa | Cấp khối, cấp thao tác |