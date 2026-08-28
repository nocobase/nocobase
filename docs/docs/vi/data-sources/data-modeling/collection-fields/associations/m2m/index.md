---
title: "Nhiều-nhiều"
description: "Trường quan hệ nhiều-nhiều (M2M), liên kết nhiều-nhiều giữa hai thực thể, thường cần bảng trung gian, chẳng hạn như sinh viên - môn học."
keywords: "nhiều-nhiều,M2M,BelongsToMany,bảng trung gian,trường liên kết,NocoBase"
---

# Nhiều-nhiều

Trong hệ thống đăng ký môn học, có hai thực thể là sinh viên và môn học. Một sinh viên có thể đăng ký nhiều môn học, đồng thời một môn học cũng có thể có nhiều sinh viên đăng ký. Đây chính là mối quan hệ nhiều-nhiều. Trong cơ sở dữ liệu quan hệ, để biểu diễn mối quan hệ nhiều-nhiều giữa sinh viên và môn học, thông thường sẽ sử dụng một bảng trung gian, chẳng hạn như bảng đăng ký môn học. Bảng này có thể ghi lại mỗi sinh viên đã chọn những môn học nào và mỗi môn học được những sinh viên nào đăng ký. Thiết kế này có thể biểu diễn tốt mối quan hệ nhiều-nhiều giữa sinh viên và môn học.

Sơ đồ quan hệ ER như sau

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Cấu hình trường

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Mô tả tham số

### Source collection

Bảng nguồn, tức là bảng chứa trường hiện tại.

### Target collection

Bảng đích, là bảng được liên kết.

### Through collection

Bảng trung gian. Khi tồn tại mối quan hệ nhiều-nhiều giữa hai thực thể, cần sử dụng bảng trung gian để lưu trữ mối quan hệ này. Bảng trung gian có hai khóa ngoại, dùng để lưu thông tin liên kết giữa hai thực thể.

### Source key

Trường được tham chiếu bởi ràng buộc khóa ngoại, bắt buộc phải có tính duy nhất.

### Foreign key 1

Trường trong bảng trung gian, dùng để thiết lập liên kết với bảng nguồn.

### Foreign key 2

Trường trong bảng trung gian, dùng để thiết lập liên kết với bảng đích.

### Target key

Trường được tham chiếu bởi ràng buộc khóa ngoại, bắt buộc phải có tính duy nhất.

### ON DELETE

ON DELETE là quy tắc thao tác đối với tham chiếu khóa ngoại trong bảng con khi xóa bản ghi trong bảng cha, được dùng như một tùy chọn khi định nghĩa ràng buộc khóa ngoại. Các tùy chọn ON DELETE thường gặp bao gồm:

- CASCADE: Khi xóa bản ghi trong bảng cha, tự động xóa tất cả bản ghi liên kết trong bảng con.
- SET NULL: Khi xóa bản ghi trong bảng cha, đặt giá trị khóa ngoại liên kết trong bảng con thành NULL.
- RESTRICT: Tùy chọn mặc định. Khi cố gắng xóa bản ghi trong bảng cha, nếu tồn tại bản ghi liên kết trong bảng con thì từ chối xóa bản ghi trong bảng cha.
- NO ACTION: Tương tự RESTRICT. Nếu tồn tại bản ghi liên kết trong bảng con thì từ chối xóa bản ghi trong bảng cha.