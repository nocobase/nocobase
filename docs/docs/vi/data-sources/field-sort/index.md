---
pkg: "@nocobase/plugin-field-sort"
title: "Field Sort"
description: "Field sort sắp xếp bản ghi của Collection, hỗ trợ phân nhóm trước rồi sắp xếp (sort1), dùng để tùy chỉnh thứ tự hiển thị bản ghi."
keywords: "Field sort,Sort field,Phân nhóm sắp xếp,sort1,NocoBase"
---
# Field Sort

## Giới thiệu

Field sort dùng để sắp xếp các bản ghi trong Collection, hỗ trợ phân nhóm trước rồi sắp xếp (sort1).

:::warning
Vì field sort là field cùng bảng, nên khi phân nhóm sắp xếp, không hỗ trợ một bản ghi được phân vào nhiều nhóm.
:::

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt riêng.

## Hướng dẫn sử dụng

### Tạo field sort

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Khi tạo field sort, giá trị sort sẽ được khởi tạo:

- Nếu không chọn phân nhóm sắp xếp, sẽ khởi tạo dựa trên field khóa chính và field thời gian tạo.
- Nếu chọn phân nhóm sắp xếp, sẽ phân nhóm dữ liệu trước, rồi khởi tạo dựa trên field khóa chính và field thời gian tạo.

:::warning{title="Mô tả về tính nhất quán giao dịch"}
- Khi tạo field, nếu khởi tạo giá trị sort thất bại, thì sẽ không tạo field sort;
- Trong một phạm vi, một bản ghi di chuyển từ vị trí A sang vị trí B, giá trị sort của tất cả bản ghi trong khoảng AB đều sẽ thay đổi, nếu một bản ghi thất bại, di chuyển sẽ thất bại, giá trị sort của các bản ghi liên quan đều không thay đổi.
:::

#### Ví dụ 1: Tạo field sort1

Field sort1 không có phân nhóm

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Field sort của mỗi bản ghi sẽ được khởi tạo dựa trên field khóa chính và field thời gian tạo:

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Ví dụ 2: Tạo field sort2 phân nhóm dựa trên Class ID

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Lúc này sẽ phân nhóm tất cả bản ghi trong Collection trước (theo Class ID), rồi khởi tạo field sort (sort2), giá trị khởi tạo của các bản ghi:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Drag-and-drop sắp xếp

Field sort chủ yếu dùng cho việc drag-and-drop sắp xếp các bản ghi trong block, các block hiện hỗ trợ drag-and-drop sắp xếp gồm Table và Kanban.

:::warning
- Khi cùng một field sort được dùng làm drag-and-drop sắp xếp, việc dùng chung trong nhiều block có thể phá vỡ thứ tự sắp xếp đã có;
- Field drag-and-drop sắp xếp của Table không thể chọn field sort có quy tắc phân nhóm;
  - Ngoại lệ: Trong block Table quan hệ OneToMany, khóa ngoại có thể làm phân nhóm;
- Hiện chỉ block Kanban hỗ trợ drag-and-drop sắp xếp có phân nhóm.
:::

#### Drag-and-drop sắp xếp dòng Table

Block Table

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Block Table quan hệ

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
Trong block quan hệ OneToMany

- Nếu chọn field sort không phân nhóm, thì tất cả bản ghi đều có thể tham gia sắp xếp;
- Nếu phân nhóm trước dựa trên khóa ngoại rồi sắp xếp, thì quy tắc sắp xếp chỉ ảnh hưởng đến dữ liệu trong nhóm hiện tại.

Hiệu quả cuối cùng giống nhau, nhưng số bản ghi tham gia sắp xếp khác nhau, xem mô tả thêm tại [Mô tả quy tắc sắp xếp](#mô-tả-quy-tắc-sắp-xếp)
:::

#### Drag-and-drop sắp xếp card Kanban

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Mô tả quy tắc sắp xếp

#### Di chuyển giữa các phần tử không phân nhóm (hoặc cùng nhóm)

Giả sử có một mảng dữ liệu

```
[1,2,3,4,5,6,7,8,9]
```

Khi một phần tử, ví dụ 5 di chuyển về phía trước đến vị trí của 3, lúc này, chỉ có số thứ tự của 3,4,5 thay đổi, 5 chiếm vị trí của 3, 3,4 mỗi cái di chuyển lùi một vị trí.

```
[1,2,5,3,4,6,7,8,9]
```

Lúc này tiếp tục 6 di chuyển về phía sau đến vị trí của 8, 6 chiếm vị trí của 8, 7,8 mỗi cái di chuyển lên trước một vị trí.

```
[1,2,5,3,4,7,8,6,9]
```

#### Di chuyển phần tử giữa các nhóm khác nhau

Khi phân nhóm sắp xếp, khi một bản ghi di chuyển sang nhóm khác, nhóm của nó cũng sẽ thay đổi. Ví dụ như sau:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Khi 1 di chuyển đến 6 (mặc định ở phía sau), nhóm của 1 cũng sẽ chuyển từ A sang B

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Việc thay đổi sắp xếp không liên quan đến dữ liệu hiển thị trên giao diện

Ví dụ có một mảng dữ liệu

```
[1,2,3,4,5,6,7,8,9]
```

Giao diện chỉ hiển thị

```
[1,5,9]
```

Khi 1 di chuyển đến vị trí của 9, vị trí của 2,3,4,5,6,7,8 ở giữa đều sẽ thay đổi

```
[2,3,4,5,6,7,8,9,1]
```

Giao diện hiển thị

```
[5,9,1]
```
