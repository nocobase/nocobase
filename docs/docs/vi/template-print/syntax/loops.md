---
title: "Template In ấn - Xử lý vòng lặp"
description: "Cú pháp vòng lặp Template In ấn: duyệt mảng hoặc object để render lặp lại, sử dụng {d.array[i]} và {d.array[i+1]} để đánh dấu vùng vòng lặp."
keywords: "Template In ấn,Vòng lặp,loops,Duyệt mảng,NocoBase"
---

## Xử lý vòng lặp

Xử lý vòng lặp dùng để render lặp lại dữ liệu trong mảng hoặc object, thông qua việc định nghĩa dấu bắt đầu và kết thúc vòng lặp để nhận diện nội dung cần lặp lại. Dưới đây giới thiệu một vài tình huống thường gặp.


### Duyệt mảng

#### 1. Mô tả cú pháp

- Sử dụng nhãn `{d.array[i].thuộc_tính}` để định nghĩa mục vòng lặp hiện tại, dùng `{d.array[i+1].thuộc_tính}` để chỉ định mục tiếp theo nhằm đánh dấu vùng vòng lặp.
- Khi vòng lặp, tự động lấy hàng đầu tiên (phần `[i]`) làm Template để lặp lại; trong Template chỉ cần viết một lần ví dụ vòng lặp.

Ví dụ định dạng cú pháp:
```
{d.tên_mảng[i].thuộc_tính}
{d.tên_mảng[i+1].thuộc_tính}
```

#### 2. Ví dụ: Vòng lặp mảng đơn giản

##### Dữ liệu
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### Template
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Kết quả
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```


#### 3. Ví dụ: Vòng lặp mảng lồng nhau

Áp dụng cho trường hợp mảng lồng mảng, có thể lồng nhau vô hạn.

##### Dữ liệu
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### Template
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Kết quả
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```


#### 4. Ví dụ: Vòng lặp hai chiều (Tính năng nâng cao, v4.8.0+)

Vòng lặp hai chiều có thể đồng thời lặp trên hàng và cột, áp dụng cho việc sinh các bố cục phức tạp như bảng so sánh (Lưu ý: Một số định dạng hiện tại chỉ Template DOCX, HTML, MD chính thức hỗ trợ).

##### Dữ liệu
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### Template
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Kết quả
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```


#### 5. Ví dụ: Truy cập giá trị iterator vòng lặp (v4.0.0+)

Trong vòng lặp có thể trực tiếp truy cập giá trị index của lần lặp hiện tại, để dễ dàng triển khai các yêu cầu định dạng đặc biệt.

##### Ví dụ Template
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Lưu ý: Số lượng dấu chấm dùng để biểu thị giá trị index của các cấp khác nhau (ví dụ, `.i` đại diện cho cấp hiện tại, `..i` đại diện cho cấp trên), hiện tại có vấn đề thứ tự ngược, chi tiết xem mô tả chính thức.


### Duyệt object

#### 1. Mô tả cú pháp

- Đối với thuộc tính trong object, có thể sử dụng `.att` để lấy tên thuộc tính, sử dụng `.val` để lấy giá trị thuộc tính.
- Khi lặp, mỗi lần sẽ duyệt một mục thuộc tính.

Ví dụ định dạng cú pháp:
```
{d.tên_object[i].att}  // Tên thuộc tính
{d.tên_object[i].val}  // Giá trị thuộc tính
```

#### 2. Ví dụ: Duyệt thuộc tính object

##### Dữ liệu
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Template
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Kết quả
```
People namePeople age
paul10
jack20
bob30
```


### Xử lý sắp xếp

Sử dụng tính năng sắp xếp có thể trực tiếp sắp xếp dữ liệu mảng trong Template.

#### 1. Mô tả cú pháp: Sắp xếp tăng dần

- Trong nhãn vòng lặp sử dụng thuộc tính làm cơ sở sắp xếp, định dạng cú pháp:
  ```
  {d.array[thuộc tính sắp xếp, i].thuộc_tính}
  {d.array[thuộc tính sắp xếp+1, i+1].thuộc_tính}
  ```
- Nếu cần sắp xếp nhiều lớp, có thể phân tách nhiều thuộc tính sắp xếp bằng dấu phẩy trong dấu ngoặc vuông.

#### 2. Ví dụ: Sắp xếp theo thuộc tính số

##### Dữ liệu
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### Template
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Kết quả
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Ví dụ: Sắp xếp nhiều thuộc tính

##### Dữ liệu
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### Template
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Kết quả
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```


### Xử lý lọc

Xử lý lọc dùng để lọc các hàng dữ liệu trong vòng lặp dựa trên điều kiện cụ thể.

#### 1. Mô tả cú pháp: Lọc số

- Trong nhãn vòng lặp thêm điều kiện (ví dụ `age > 19`), định dạng cú pháp:
  ```
  {d.array[i, điều kiện].thuộc_tính}
  ```

#### 2. Ví dụ: Lọc số

##### Dữ liệu
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Template
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Kết quả
```
People
John
Bob
```


#### 3. Mô tả cú pháp: Lọc chuỗi

- Sử dụng dấu nháy đơn để đánh dấu điều kiện chuỗi, ví dụ định dạng:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Ví dụ: Lọc chuỗi

##### Dữ liệu
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Template
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Kết quả
```
People
Falcon 9
Falcon Heavy
```


#### 5. Mô tả cú pháp: Lọc N mục đầu

- Có thể sử dụng index vòng lặp `i` để lọc ra N phần tử đầu, ví dụ cú pháp:
  ```
  {d.array[i, i < N].thuộc_tính}
  ```

#### 6. Ví dụ: Lọc hai mục đầu

##### Dữ liệu
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Template
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Kết quả
```
People
Falcon 9
Model S
```


#### 7. Mô tả cú pháp: Loại trừ N mục cuối

- Thông qua index âm `i` để biểu thị mục đếm ngược, ví dụ:
  - `{d.array[i=-1].thuộc_tính}` lấy mục cuối cùng
  - `{d.array[i, i!=-1].thuộc_tính}` loại trừ mục cuối

#### 8. Ví dụ: Loại trừ mục cuối và hai mục cuối

##### Dữ liệu
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Template
```
Mục cuối: {d[i=-1].name}

Loại trừ mục cuối:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Loại trừ hai mục cuối:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Kết quả
```
Mục cuối: Falcon Heavy

Loại trừ mục cuối:
Falcon 9
Model S
Model 3

Loại trừ hai mục cuối:
Falcon 9
Model S
```


### Xử lý loại trùng

#### 1. Mô tả cú pháp

- Thông qua iterator tùy chỉnh, có thể lấy các mục duy nhất (không trùng) dựa trên giá trị của một thuộc tính. Cú pháp tương tự vòng lặp thường, nhưng sẽ tự động bỏ qua các mục trùng.

Định dạng ví dụ:
```
{d.array[thuộc tính].thuộc_tính}
{d.array[thuộc tính+1].thuộc_tính}
```

#### 2. Ví dụ: Chọn dữ liệu duy nhất

##### Dữ liệu
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Template
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Kết quả
```
Vehicles
Hyundai
Airbus
```


