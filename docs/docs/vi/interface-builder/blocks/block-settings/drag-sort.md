---
title: "Sắp xếp bằng kéo thả"
description: "Cấu hình Block: Sắp xếp bằng kéo thả, điều chỉnh thứ tự hiển thị của Block hoặc Field bằng kéo thả."
keywords: "Sắp xếp bằng kéo thả,Sắp xếp Block,Sắp xếp Field,Interface Builder,NocoBase"
---

# Sắp xếp bằng kéo thả

## Giới thiệu

Sắp xếp bằng kéo thả phụ thuộc vào Field sắp xếp, dùng để Sắp xếp thủ công các bản ghi của Block.


:::info{title=Mẹo}
* Khi cùng một Field sắp xếp được dùng cho Sắp xếp bằng kéo thả, sử dụng kết hợp nhiều Block có thể phá vỡ thứ tự hiện có.
* Khi Sắp xếp bằng kéo thả Table, Field sắp xếp không thể cài đặt quy tắc nhóm.
* Table cây chỉ hỗ trợ Sắp xếp các node cùng cấp.

:::


## Cấu hình kéo thả

Thêm Field kiểu "Sắp xếp" mới. Khi tạo Table không tự động tạo Field sắp xếp nữa, cần tạo thủ công.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Khi Sắp xếp bằng kéo thả Table, cần chọn Field sắp xếp.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Sắp xếp bằng kéo thả hàng Table


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Giải thích quy tắc Sắp xếp

Giả sử thứ tự hiện tại là

```
[1,2,3,4,5,6,7,8,9]
```

Khi một phần tử nào đó (ví dụ 5) di chuyển về phía trước đến vị trí của 3, chỉ giá trị Sắp xếp của 3, 4, 5 sẽ thay đổi: 5 chiếm vị trí của 3, 3 và 4 mỗi cái di chuyển về phía sau một vị trí.

```
[1,2,5,3,4,6,7,8,9]
```

Lúc này tiếp tục di chuyển 6 về phía sau đến vị trí của 8, 6 chiếm vị trí của 8, 7 và 8 mỗi cái di chuyển về phía trước một vị trí.

```
[1,2,5,3,4,7,8,6,9]
```
