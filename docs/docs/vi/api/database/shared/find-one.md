:::tip Thông báo dịch AI
Tài liệu này đã được dịch tự động bằng AI.
:::


## Kiểu

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

## Tham số

Hầu hết các tham số tương tự như `find()`. Điểm khác biệt là `findOne()` chỉ trả về một bản ghi duy nhất, vì vậy tham số `limit` không cần thiết và giá trị này luôn là `1` trong quá trình truy vấn.