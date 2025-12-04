---
pkg: "@nocobase/plugin-field-sort"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Trường Sắp Xếp

## Giới thiệu

Trường sắp xếp dùng để sắp xếp các bản ghi trong một bộ sưu tập, hỗ trợ sắp xếp theo nhóm.

:::warning
Vì trường sắp xếp là trường của cùng một bộ sưu tập, nên khi sắp xếp theo nhóm, một bản ghi không thể thuộc nhiều nhóm.
:::

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt riêng.

## Hướng dẫn sử dụng

### Tạo Trường Sắp Xếp

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Khi tạo trường sắp xếp, các giá trị sắp xếp sẽ được khởi tạo:

- Nếu không chọn sắp xếp theo nhóm, việc khởi tạo sẽ dựa trên trường khóa chính và trường ngày tạo.
- Nếu chọn sắp xếp theo nhóm, dữ liệu sẽ được nhóm trước, sau đó việc khởi tạo sẽ dựa trên trường khóa chính và trường ngày tạo.

:::warning{title="Giải thích về Tính nhất quán giao dịch"}
- Khi tạo trường, nếu việc khởi tạo giá trị sắp xếp thất bại, trường sắp xếp sẽ không được tạo.
- Trong một phạm vi nhất định, nếu một bản ghi di chuyển từ vị trí A đến vị trí B, các giá trị sắp xếp của tất cả các bản ghi giữa A và B sẽ thay đổi. Nếu bất kỳ phần nào của cập nhật này thất bại, toàn bộ thao tác di chuyển sẽ bị hủy bỏ, và các giá trị sắp xếp của các bản ghi liên quan sẽ không thay đổi.
:::

#### Ví dụ 1: Tạo trường sort1

Trường sort1 không được nhóm.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Các trường sắp xếp của mỗi bản ghi sẽ được khởi tạo dựa trên trường khóa chính và trường ngày tạo.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Ví dụ 2: Tạo trường sort2 dựa trên nhóm ID Lớp

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Lúc này, tất cả các bản ghi trong bộ sưu tập sẽ được nhóm trước (nhóm theo ID Lớp), sau đó trường sắp xếp (sort2) sẽ được khởi tạo. Các giá trị khởi tạo của mỗi bản ghi là:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Sắp xếp bằng cách kéo và thả

Trường sắp xếp chủ yếu được sử dụng để sắp xếp bằng cách kéo và thả các bản ghi trong các khối khác nhau. Các khối hiện hỗ trợ sắp xếp bằng cách kéo và thả bao gồm bảng và bảng điều khiển.

:::warning
- Khi cùng một trường sắp xếp được dùng để sắp xếp bằng cách kéo và thả, việc sử dụng nó trên nhiều khối có thể làm xáo trộn thứ tự hiện có;
- Trường dùng để sắp xếp bằng cách kéo và thả trong bảng không thể là trường sắp xếp có quy tắc nhóm;
  - Ngoại lệ: Trong một khối bảng quan hệ một-nhiều, khóa ngoại có thể đóng vai trò là một nhóm;
- Hiện tại, chỉ khối bảng điều khiển hỗ trợ sắp xếp bằng cách kéo và thả trong các nhóm.
:::

#### Sắp xếp bằng cách kéo và thả các hàng trong bảng

Khối bảng

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Khối bảng quan hệ

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
Trong một khối quan hệ một-nhiều:

- Nếu chọn trường sắp xếp chưa được nhóm, thì tất cả các bản ghi có thể tham gia vào quá trình sắp xếp.
- Nếu các bản ghi được nhóm trước theo khóa ngoại và sau đó sắp xếp, thì quy tắc sắp xếp sẽ chỉ ảnh hưởng đến dữ liệu trong nhóm hiện tại.

Hiệu quả cuối cùng là nhất quán, nhưng số lượng bản ghi tham gia sắp xếp là khác nhau. Để biết thêm chi tiết, xem [Giải thích Quy tắc Sắp xếp](#giai-thich-quy-tac-sap-xep).
:::

#### Sắp xếp bằng cách kéo và thả các thẻ trên bảng điều khiển

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Giải thích Quy tắc Sắp xếp

#### Di chuyển giữa các phần tử chưa được nhóm (hoặc cùng nhóm)

Giả sử có một tập hợp dữ liệu:

```
[1,2,3,4,5,6,7,8,9]
```

Khi một phần tử, chẳng hạn 5, di chuyển lên vị trí của 3, lúc này, chỉ có vị trí của các mục 3, 4 và 5 thay đổi. Mục 5 chiếm vị trí của 3, và các mục 3, 4 mỗi mục dịch chuyển lùi một vị trí.

```
[1,2,5,3,4,6,7,8,9]
```

Nếu sau đó chúng ta di chuyển mục 6 lùi về vị trí của 8, mục 6 chiếm vị trí của 8, và các mục 7, 8 mỗi mục dịch chuyển lên một vị trí.

```
[1,2,5,3,4,7,8,6,9]
```

#### Di chuyển các phần tử giữa các nhóm khác nhau

Khi sắp xếp theo nhóm, nếu một bản ghi được di chuyển sang nhóm khác, thì việc gán nhóm của nó cũng sẽ thay đổi. Ví dụ:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Khi mục 1 được di chuyển sau mục 6 (hành vi mặc định), nhóm của nó cũng sẽ thay đổi từ A thành B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Thay đổi sắp xếp không liên quan đến dữ liệu hiển thị trên giao diện

Ví dụ, hãy xem xét một tập hợp dữ liệu:

```
[1,2,3,4,5,6,7,8,9]
```

Giao diện chỉ hiển thị một chế độ xem đã lọc:

```
[1,5,9]
```

Khi mục 1 được di chuyển đến vị trí của mục 9, vị trí của tất cả các mục trung gian (2, 3, 4, 5, 6, 7, 8) cũng sẽ thay đổi, ngay cả khi chúng không hiển thị.

```
[2,3,4,5,6,7,8,9,1]
```

Giao diện hiện hiển thị thứ tự mới dựa trên các mục đã lọc:

```
[5,9,1]
```