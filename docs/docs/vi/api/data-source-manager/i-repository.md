---
title: "IRepository"
description: "Interface IRepository của NocoBase: interface phương thức thao tác model của Repository, thích ứng CRUD trên nguồn dữ liệu."
keywords: "IRepository,interface,Repository,CRUD,NocoBase"
---

# IRepository

Interface `Repository` định nghĩa một loạt các phương thức thao tác model, dùng để thích ứng các thao tác CRUD trên nguồn dữ liệu.

## API 

### find()

Dựa vào tham số truy vấn, trả về danh sách model thỏa mãn điều kiện.

#### Chữ ký

- `find(options?: any): Promise<IModel[]>`

### findOne()

Dựa vào tham số truy vấn, trả về model thỏa mãn điều kiện. Nếu có nhiều model thỏa mãn, chỉ trả về model đầu tiên.

#### Chữ ký 

- `findOne(options?: any): Promise<IModel>`


### count()

Dựa vào tham số truy vấn, trả về số lượng model thỏa mãn điều kiện.

#### Chữ ký

- `count(options?: any): Promise<Number>`

### findAndCount()

Dựa vào tham số truy vấn, trả về danh sách và số lượng model thỏa mãn điều kiện.

#### Chữ ký

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Tạo một đối tượng dữ liệu model.

#### Chữ ký

- `create(options: any): void`

### update()

Dựa vào điều kiện truy vấn, cập nhật đối tượng dữ liệu model.

#### Chữ ký

- `update(options: any): void`

### destroy()

Dựa vào điều kiện truy vấn, xóa đối tượng dữ liệu model.

#### Chữ ký

- `destroy(options: any): void`
