---
pkg: '@nocobase/plugin-app-supervisor'
title: "Quản lý Multi-app NocoBase"
description: "Quản lý Multi-app AppSupervisor: ứng dụng đơn, multi-app shared memory, triển khai hỗn hợp đa môi trường, tình huống SaaS/multi-tenant, tạo, khởi động, dừng ứng dụng, quản lý vòng đời."
keywords: "Multi-app,Multi App,AppSupervisor,shared memory,triển khai đa môi trường,SaaS,multi-tenant,NocoBase"
---
# Quản lý Multi-app

## Tổng quan tính năng

Quản lý Multi-app là giải pháp quản lý ứng dụng thống nhất do NocoBase cung cấp, dùng để tạo và quản lý nhiều instance ứng dụng NocoBase được cô lập vật lý trong một hoặc nhiều môi trường runtime. Thông qua AppSupervisor, bạn có thể tạo và duy trì nhiều ứng dụng trong một entry thống nhất, đáp ứng nhu cầu của các nghiệp vụ và quy mô khác nhau.

## Ứng dụng đơn

Trong giai đoạn đầu của dự án, hầu hết người dùng sẽ bắt đầu từ ứng dụng đơn.

Trong chế độ này, hệ thống chỉ cần triển khai một instance NocoBase, tất cả các tính năng nghiệp vụ, dữ liệu và người dùng đều chạy trong cùng một ứng dụng. Triển khai đơn giản, chi phí cấu hình thấp, rất phù hợp cho POC nguyên mẫu, các dự án nhỏ hoặc công cụ nội bộ.

Nhưng khi nghiệp vụ dần trở nên phức tạp, ứng dụng đơn sẽ gặp phải một số hạn chế tự nhiên:

- Tính năng liên tục được thêm vào, hệ thống trở nên cồng kềnh
- Khó cô lập giữa các nghiệp vụ khác nhau
- Chi phí mở rộng và bảo trì ứng dụng tiếp tục tăng

Lúc này bạn sẽ muốn chia các nghiệp vụ khác nhau thành nhiều ứng dụng để nâng cao khả năng bảo trì và mở rộng của hệ thống.

## Multi-app shared memory

Khi bạn muốn chia nghiệp vụ nhưng không muốn đưa vào kiến trúc triển khai và vận hành phức tạp, có thể nâng cấp lên chế độ multi-app shared memory.

Trong chế độ này, một instance NocoBase có thể chạy nhiều ứng dụng cùng lúc. Mỗi ứng dụng là độc lập, có thể kết nối với database độc lập, có thể tạo, khởi động và dừng riêng, nhưng chúng chia sẻ cùng một process và memory space, bạn vẫn chỉ cần duy trì một instance NocoBase.

![](https://static-docs.nocobase.com/202512231055907.png)

Phương thức này mang lại những cải thiện rõ ràng:

- Nghiệp vụ có thể được chia theo chiều ứng dụng
- Tính năng và cấu hình giữa các ứng dụng rõ ràng hơn
- So với phương án multi-process hoặc multi-container, sử dụng tài nguyên thấp hơn

Tuy nhiên, vì tất cả các ứng dụng chạy trong cùng một process, chúng sẽ chia sẻ tài nguyên CPU, memory, các bất thường hoặc tải cao của một ứng dụng có thể ảnh hưởng đến tính ổn định của các ứng dụng khác.

Khi số lượng ứng dụng tiếp tục tăng hoặc đặt ra yêu cầu cao hơn về tính cô lập và ổn định, cần nâng cấp kiến trúc thêm.

## Triển khai hỗn hợp đa môi trường

Khi quy mô và độ phức tạp của nghiệp vụ đạt đến một mức độ nhất định, số lượng ứng dụng cần mở rộng quy mô, chế độ multi-app shared memory sẽ gặp các thách thức như cạnh tranh tài nguyên, ổn định và bảo mật. Trong giai đoạn quy mô hóa, bạn có thể xem xét sử dụng phương thức triển khai hỗn hợp đa môi trường để hỗ trợ các tình huống nghiệp vụ phức tạp hơn.

Cốt lõi của kiến trúc này là đưa vào một entry application, tức là triển khai một NocoBase làm trung tâm quản lý thống nhất, đồng thời triển khai nhiều NocoBase làm môi trường runtime ứng dụng để thực sự chạy các ứng dụng nghiệp vụ.

Entry application chịu trách nhiệm:

- Tạo, cấu hình và quản lý vòng đời ứng dụng
- Phát lệnh quản lý và tổng hợp trạng thái

Môi trường instance application chịu trách nhiệm:

- Thực sự chứa và chạy các ứng dụng nghiệp vụ thông qua chế độ multi-app shared memory

Đối với người dùng, nhiều ứng dụng vẫn có thể được tạo và quản lý qua một entry, nhưng bên trong:

- Các ứng dụng khác nhau có thể chạy trên các node hoặc cluster khác nhau
- Mỗi ứng dụng có thể sử dụng database và middleware độc lập
- Có thể mở rộng theo nhu cầu hoặc cô lập các ứng dụng tải cao

![](https://static-docs.nocobase.com/202512231215186.png)

Phương thức này phù hợp cho nền tảng SaaS, nhiều môi trường demo hoặc tình huống multi-tenant. Đảm bảo tính linh hoạt đồng thời nâng cao tính ổn định và khả năng vận hành của hệ thống.
