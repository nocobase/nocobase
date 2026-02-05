:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# ICollectionManager

Giao diện `ICollectionManager` được dùng để quản lý các thể hiện (instance) của `bộ sưu tập` thuộc một `nguồn dữ liệu`.

## API

### registerFieldTypes()

Đăng ký các loại trường (field type) trong một `bộ sưu tập`.

#### Chữ ký

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Đăng ký `Interface` của một `bộ sưu tập`.

#### Chữ ký

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Đăng ký một `Collection Template`.

#### Chữ ký

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Đăng ký một `Model`.

#### Chữ ký

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Đăng ký một `Repository`.

#### Chữ ký

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Lấy một thể hiện (instance) của `Repository` đã đăng ký.

#### Chữ ký

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Định nghĩa một `bộ sưu tập`.

#### Chữ ký

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Sửa đổi các thuộc tính của một `bộ sưu tập` hiện có.

#### Chữ ký

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Kiểm tra xem một `bộ sưu tập` có tồn tại hay không.

#### Chữ ký

- `hasCollection(name: string): boolean`

### getCollection()

Lấy một thể hiện (instance) của `bộ sưu tập`.

#### Chữ ký

- `getCollection(name: string): ICollection`

### getCollections()

Lấy tất cả các thể hiện (instance) của `bộ sưu tập`.

#### Chữ ký

- `getCollections(): Array<ICollection>`

### getRepository()

Lấy một thể hiện (instance) của `Repository`.

#### Chữ ký

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Đồng bộ hóa `nguồn dữ liệu`. Logic này được triển khai bởi các lớp con.

#### Chữ ký

- `sync(): Promise<void>`