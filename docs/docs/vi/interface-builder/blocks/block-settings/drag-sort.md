:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/blocks/block-settings/drag-sort).
:::

# Kéo và thả để sắp xếp

## Giới thiệu

Tính năng kéo và thả để sắp xếp dựa trên trường sắp xếp (sort field), được sử dụng để sắp xếp thủ công các bản ghi trong một khối (block).


:::info{title=Gợi ý}
* Khi sử dụng cùng một trường sắp xếp cho tính năng kéo và thả trên nhiều khối khác nhau, việc dùng chung này có thể làm xáo trộn thứ tự hiện có.
* Khi thực hiện kéo và thả để sắp xếp trong bảng, trường sắp xếp không được thiết lập các quy tắc nhóm (grouping rules).
* Bảng dạng cây (tree table) chỉ hỗ trợ sắp xếp các nút trong cùng một cấp độ.

:::


## Cấu hình kéo và thả

Thêm trường loại "Sắp xếp" (Sort). Khi tạo bảng (bộ sưu tập), trường sắp xếp sẽ không còn được tự động tạo ra mà cần phải tạo thủ công.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Khi kích hoạt tính năng kéo và thả để sắp xếp cho bảng, bạn cần chọn một trường sắp xếp.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Kéo và thả để sắp xếp các hàng trong bảng


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Giải thích quy tắc sắp xếp

Giả sử thứ tự hiện tại là:

```
[1,2,3,4,5,6,7,8,9]
```

Khi một phần tử (ví dụ: 5) được di chuyển lên trước tới vị trí của 3, chỉ có giá trị sắp xếp của 3, 4 và 5 thay đổi: 5 sẽ chiếm vị trí của 3, còn 3 và 4 mỗi số sẽ lùi lại một vị trí.

```
[1,2,5,3,4,6,7,8,9]
```

Lúc này, nếu tiếp tục di chuyển 6 xuống sau tới vị trí của 8, 6 sẽ chiếm vị trí của 8, còn 7 và 8 mỗi số sẽ tiến lên một vị trí.

```
[1,2,5,3,4,7,8,6,9]
```