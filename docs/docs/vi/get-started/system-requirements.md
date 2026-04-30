---
title: "Yêu cầu hệ thống NocoBase"
description: "Yêu cầu phần cứng triển khai NocoBase: node đơn tối thiểu 1 core 2GB, khuyến nghị 2 core 4GB, cấu hình chế độ cluster, khuyến nghị triển khai độc lập database/Redis và các dịch vụ bên thứ ba."
keywords: "yêu cầu hệ thống, yêu cầu phần cứng, CPU, bộ nhớ, triển khai node đơn, triển khai cluster, môi trường sản xuất, NocoBase"
---

# Yêu cầu hệ thống

Các yêu cầu hệ thống mô tả trong tài liệu này là yêu cầu vận hành cho **chính dịch vụ ứng dụng NocoBase**, chỉ bao gồm tài nguyên tính toán và bộ nhớ cần thiết cho tiến trình ứng dụng. **Không bao gồm các dịch vụ bên thứ ba phụ thuộc**, bao gồm nhưng không giới hạn:

- API Gateway / Reverse Proxy
- Dịch vụ database (như MySQL, PostgreSQL)
- Dịch vụ cache (như Redis)
- Message queue, object storage và các middleware khác

Ngoại trừ các tình huống chỉ dùng để xác minh tính năng hoặc thử nghiệm, **đặc biệt khuyến nghị triển khai độc lập các dịch vụ bên thứ ba nói trên** trên server hoặc container riêng, hoặc dùng trực tiếp các dịch vụ cloud tương ứng.

Cấu hình hệ thống và quy hoạch dung lượng cho các dịch vụ liên quan cần được đánh giá và tinh chỉnh riêng dựa trên **lượng dữ liệu thực tế, tải nghiệp vụ và quy mô đồng thời**.

## Chế độ triển khai node đơn

Chế độ triển khai node đơn là khi dịch vụ ứng dụng NocoBase chỉ chạy trên một server hoặc một container duy nhất.

### Yêu cầu phần cứng tối thiểu

| Tài nguyên | Yêu cầu |
|---|---|
| CPU | 1 core |
| Bộ nhớ | 2 GB |

**Tình huống áp dụng**:

- Nghiệp vụ siêu nhỏ
- Xác minh tính năng (POC)
- Môi trường phát triển / kiểm thử
- Tình huống gần như không có truy cập đồng thời

:::info{title=Mẹo}

- Cấu hình này chỉ đảm bảo hệ thống có thể chạy, không đảm bảo trải nghiệm hiệu năng.
- Khi lượng dữ liệu hoặc số request đồng thời tăng, tài nguyên hệ thống có thể nhanh chóng trở thành nút thắt cổ chai.
- Đối với các tình huống **phát triển từ mã nguồn, phát triển Plugin hoặc build và triển khai từ mã nguồn**, khuyến nghị dự trữ **trên 4 GB bộ nhớ trống** để đảm bảo việc cài đặt phụ thuộc, biên dịch và build diễn ra suôn sẻ.

:::

### Yêu cầu phần cứng khuyến nghị

| Tài nguyên | Cấu hình khuyến nghị |
|---|---|
| CPU | 2 core |
| Bộ nhớ | ≥ 4 GB |

**Tình huống áp dụng**:

Phù hợp với môi trường sản xuất nghiệp vụ vừa và nhỏ với lượng truy cập đồng thời ít.

:::info{title=Mẹo}

- Với cấu hình này, hệ thống có thể đáp ứng các thao tác quản trị thông thường và tải nghiệp vụ nhẹ.
- Khi độ phức tạp của nghiệp vụ, lượng truy cập đồng thời hoặc số tác vụ nền tăng, nên cân nhắc nâng cấp phần cứng hoặc chuyển sang chế độ cluster.

:::

## Chế độ cluster

Phù hợp với các tình huống nghiệp vụ quy mô vừa đến lớn và có nhiều truy cập đồng thời, có thể nâng cao tính sẵn sàng và thông lượng nghiệp vụ thông qua mở rộng theo chiều ngang (xem chi tiết: [Chế độ cluster](/cluster-mode)).

### Yêu cầu phần cứng cho node

Trong chế độ cluster, cấu hình phần cứng của mỗi node ứng dụng (Pod / instance) khuyến nghị giống với chế độ triển khai node đơn.

**Cấu hình tối thiểu cho mỗi node:**

- CPU: 1 core
- Bộ nhớ: 2 GB

**Cấu hình khuyến nghị cho mỗi node:**

- CPU: 2 core
- Bộ nhớ: 4 GB

### Quy hoạch số lượng node

- Số lượng node trong cluster có thể mở rộng theo nhu cầu (2-N)
- Số lượng node thực tế cần thiết phụ thuộc vào:
  - Lượng truy cập đồng thời
  - Độ phức tạp của logic nghiệp vụ
  - Tải tác vụ nền và xử lý bất đồng bộ
  - Khả năng phản hồi của các dịch vụ phụ thuộc bên ngoài

Khuyến nghị trong môi trường sản xuất:

- Điều chỉnh quy mô node động dựa trên các chỉ số giám sát (CPU, bộ nhớ, độ trễ request, v.v.)
- Dự trữ một lượng tài nguyên dư để xử lý các biến động lưu lượng
