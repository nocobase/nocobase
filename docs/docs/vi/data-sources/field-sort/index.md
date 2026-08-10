---
pkg: "@nocobase/plugin-field-sort"
title: "Trường sắp xếp"
description: "Trường sắp xếp dùng để sắp xếp các bản ghi trong bảng dữ liệu, hỗ trợ nhóm trước rồi sắp xếp, dùng để tùy chỉnh thứ tự hiển thị bản ghi."
keywords: "Trường sắp xếp,Trường Sort,sắp xếp theo nhóm,sort,NocoBase"
---

# Trường sắp xếp

## Giới thiệu

Trong NocoBase, **trường sắp xếp (Sort)** dùng để ghi lại giá trị sắp xếp của các bản ghi trong bảng dữ liệu. Trường này thường được sử dụng để kéo thả sắp xếp trong các khối như bảng và kanban.

Trường sắp xếp hỗ trợ sắp xếp không theo nhóm, cũng như nhóm trước rồi sắp xếp. Sắp xếp theo nhóm phù hợp với các trường hợp “sắp xếp độc lập trong cùng một nhóm”, chẳng hạn như sắp xếp học sinh theo lớp hoặc sắp xếp nhiệm vụ theo trạng thái kanban.

:::warning Lưu ý

Vì trường sắp xếp là một trường trong cùng bảng, nên khi sắp xếp theo nhóm, không hỗ trợ việc cùng một bản ghi xuất hiện đồng thời trong nhiều nhóm.

:::

## Cài đặt

Trường sắp xếp được cung cấp bởi plugin tích hợp sẵn, không cần cài đặt riêng.

## Tạo trường sắp xếp

Trong trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「排序」 để tạo trường sắp xếp.

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Khi tạo trường sắp xếp, NocoBase sẽ khởi tạo giá trị sắp xếp:

- Nếu không chọn sắp xếp theo nhóm, hệ thống sẽ khởi tạo dựa trên trường khóa chính và trường ngày tạo
- Nếu chọn sắp xếp theo nhóm, hệ thống sẽ nhóm dữ liệu trước, sau đó khởi tạo dựa trên trường khóa chính và trường ngày tạo

:::warning Lưu ý

Khi tạo trường, nếu khởi tạo giá trị sắp xếp thất bại thì trường sắp xếp sẽ không được tạo. Trong một phạm vi nhất định, nếu một bản ghi được di chuyển từ vị trí A đến vị trí B, giá trị sắp xếp của tất cả bản ghi trong khoảng AB sẽ thay đổi; nếu một bản ghi trong đó bị lỗi, thao tác di chuyển sẽ thất bại và giá trị sắp xếp của các bản ghi liên quan sẽ không thay đổi.

:::

### Tạo trường sắp xếp không theo nhóm

Dưới đây là ví dụ tạo trường `sort1`, trường này không sử dụng sắp xếp theo nhóm.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Trường sắp xếp của mỗi bản ghi sẽ được khởi tạo dựa trên trường khóa chính và trường ngày tạo.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

### Tạo trường sắp xếp theo nhóm

Dưới đây là ví dụ tạo trường dựa trên nhóm `Class ID` là `sort2`.

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Lúc này, tất cả bản ghi trong bảng dữ liệu sẽ được nhóm theo `Class ID` trước, sau đó khởi tạo trường sắp xếp.

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

## Sắp xếp bằng cách kéo thả

Trường sắp xếp chủ yếu được sử dụng để kéo thả sắp xếp bản ghi trong nhiều loại khối. Hiện tại, các khối hỗ trợ kéo thả sắp xếp gồm bảng và kanban.

:::warning Lưu ý

- Sử dụng cùng một trường sắp xếp để kéo thả sắp xếp ở nhiều khối có thể làm hỏng thứ tự sắp xếp hiện có
- Trường dùng để kéo thả sắp xếp trong bảng không thể là trường sắp xếp có quy tắc nhóm
- Trong khối bảng quan hệ một-nhiều, khóa ngoại có thể được dùng làm nhóm
- Hiện tại chỉ khối kanban hỗ trợ kéo thả sắp xếp theo nhóm

:::

### Sắp xếp bằng cách kéo thả các hàng trong bảng

Khối bảng có thể sử dụng trường sắp xếp để kéo thả điều chỉnh thứ tự bản ghi.

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Khối bảng quan hệ cũng có thể sử dụng trường sắp xếp để kéo thả sắp xếp.

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Kéo thả sắp xếp trong khối bảng quan hệ"></video>

:::warning Lưu ý

Trong khối quan hệ một-nhiều, nếu chọn trường sắp xếp không theo nhóm thì tất cả bản ghi đều có thể tham gia sắp xếp; nếu nhóm theo khóa ngoại trước rồi sắp xếp, quy tắc sắp xếp chỉ ảnh hưởng đến dữ liệu trong nhóm hiện tại. Hiệu quả cuối cùng có thể trông giống nhau, nhưng phạm vi bản ghi tham gia sắp xếp khác nhau.

:::

### Sắp xếp bằng cách kéo thả các thẻ kanban

Khối kanban có thể sử dụng trường sắp xếp để kéo thả điều chỉnh thứ tự thẻ.

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

## Mô tả quy tắc sắp xếp

### Di chuyển giữa các bản ghi không theo nhóm

Giả sử có một nhóm dữ liệu:

```text
[1,2,3,4,5,6,7,8,9]
```

Khi di chuyển 5 lên vị trí của 3, chỉ số thứ tự của 3, 4, 5 thay đổi. 5 chiếm vị trí của 3, còn 3 và 4 lần lượt lùi lại một vị trí.

```text
[1,2,5,3,4,6,7,8,9]
```

Tiếp tục di chuyển 6 lùi đến vị trí của 8, 6 chiếm vị trí của 8, còn 7 và 8 lần lượt tiến lên một vị trí.

```text
[1,2,5,3,4,7,8,6,9]
```

### Di chuyển giữa các nhóm khác nhau

Khi sắp xếp theo nhóm, nếu một bản ghi được di chuyển sang nhóm khác thì nhóm chứa bản ghi đó cũng sẽ thay đổi. Giả sử có hai nhóm dữ liệu:

```text
A: [1,2,3,4]
B: [5,6,7,8]
```

Khi di chuyển 1 đến phía sau 6, nhóm chứa 1 cũng sẽ thay đổi từ A thành B.

```text
A: [2,3,4]
B: [5,6,1,7,8]
```

### Thay đổi thứ tự không liên quan đến dữ liệu hiển thị trên giao diện

Giả sử có một nhóm dữ liệu:

```text
[1,2,3,4,5,6,7,8,9]
```

Giao diện chỉ hiển thị:

```text
[1,5,9]
```

Khi di chuyển 1 đến vị trí của 9, vị trí của các bản ghi 2, 3, 4, 5, 6, 7, 8 ở giữa cũng sẽ thay đổi.

```text
[2,3,4,5,6,7,8,9,1]
```

Giao diện cuối cùng hiển thị:

```text
[5,9,1]
```

## Liên kết liên quan

- [Các trường của bảng dữ liệu](../index.md) — Xem mô tả về loại trường và ánh xạ trường
- [Khối bảng](../../interface-builder/blocks/data-blocks/table.md) — Sử dụng kéo thả sắp xếp trong bảng
- [Khối kanban](../../interface-builder/blocks/data-blocks/kanban.md) — Sử dụng kéo thả sắp xếp trong kanban
