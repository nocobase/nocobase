:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


## Kiểu

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## Chi tiết

- `values`: Đối tượng dữ liệu cho bản ghi cần tạo.
- `whitelist`: Chỉ định các trường **có thể được ghi** trong đối tượng dữ liệu của bản ghi cần tạo. Nếu không truyền tham số này, mặc định tất cả các trường đều được phép ghi.
- `blacklist`: Chỉ định các trường **không được phép ghi** trong đối tượng dữ liệu của bản ghi cần tạo. Nếu không truyền tham số này, mặc định tất cả các trường đều được phép ghi.
- `transaction`: Đối tượng giao dịch. Nếu không truyền tham số giao dịch, phương thức này sẽ tự động tạo một giao dịch nội bộ.