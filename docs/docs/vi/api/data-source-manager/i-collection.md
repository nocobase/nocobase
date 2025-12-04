:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# ICollection

`ICollection` là một giao diện (interface) cho mô hình dữ liệu, chứa các thông tin như tên, trường (field) và các liên kết (association) của mô hình.

```typescript
export interface ICollection {
  repository: IRepository;

  updateOptions(options: any): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  [key: string]: any;
}
```

## Thành phần

### repository

Đây là thể hiện (instance) của `Repository` mà `ICollection` thuộc về.

## API

### updateOptions()

Cập nhật các thuộc tính của `Collection`.

#### Chữ ký

- `updateOptions(options: any): void`

### setField()

Đặt một trường cho `Collection`.

#### Chữ ký

- `setField(name: string, options: any): IField`

### removeField()

Xóa một trường khỏi `Collection`.

#### Chữ ký

- `removeField(name: string): void`

### getFields()

Lấy tất cả các trường của `Collection`.

#### Chữ ký

- `getFields(): Array<IField>`

### getField()

Lấy một trường của `Collection` theo tên của nó.

#### Chữ ký

- `getField(name: string): IField`