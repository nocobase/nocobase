:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


**Kiểu dữ liệu**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Chi tiết**

- ``filter``: Điều kiện lọc để xóa các bản ghi. Để biết cách sử dụng chi tiết của Filter, vui lòng tham khảo phương thức [`find()`](#find).
- ``filterByTk``: Điều kiện lọc để xóa các bản ghi theo `TargetKey`.
- ``truncate``: Có xóa sạch dữ liệu của **bộ sưu tập** hay không. Tham số này chỉ có hiệu lực khi không truyền các tham số `filter` hoặc `filterByTk`.
- ``transaction``: Đối tượng giao dịch. Nếu không truyền tham số giao dịch, phương thức này sẽ tự động tạo một giao dịch nội bộ.