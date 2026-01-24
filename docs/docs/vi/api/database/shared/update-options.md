:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


## Kiểu

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## Chi tiết

- `values`: Đối tượng dữ liệu của bản ghi cần cập nhật.
- `filter`: Chỉ định các điều kiện lọc cho các bản ghi cần cập nhật. Để biết cách sử dụng chi tiết của Filter, hãy tham khảo phương thức [`find()`](#find).
- `filterByTk`: Chỉ định các điều kiện lọc cho các bản ghi cần cập nhật theo `TargetKey`.
- `whitelist`: Danh sách trắng cho các trường của `values`. Chỉ các trường trong danh sách này mới được ghi.
- `blacklist`: Danh sách đen cho các trường của `values`. Các trường trong danh sách này sẽ không được ghi.
- `transaction`: Đối tượng giao dịch. Nếu không truyền tham số giao dịch, phương thức này sẽ tự động tạo một giao dịch nội bộ.

Bạn phải truyền ít nhất một trong hai tham số `filterByTk` hoặc `filter`.