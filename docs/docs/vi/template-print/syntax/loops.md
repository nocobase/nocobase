:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


## Xử lý vòng lặp

Xử lý vòng lặp được dùng để hiển thị lặp lại dữ liệu từ các mảng hoặc đối tượng. Chúng ta xác định nội dung cần lặp bằng cách định nghĩa các điểm đánh dấu bắt đầu và kết thúc vòng lặp. Dưới đây là một số trường hợp phổ biến.

### Lặp qua mảng

#### 1. Mô tả cú pháp

- Sử dụng thẻ `{d.array[i].thuộc_tính}` để định nghĩa mục lặp hiện tại, và dùng `{d.array[i+1].thuộc_tính}` để chỉ định mục tiếp theo nhằm đánh dấu vùng lặp.
- Khi thực hiện vòng lặp, dòng đầu tiên (phần `[i]`) sẽ tự động được sử dụng làm mẫu để lặp lại; bạn chỉ cần viết ví dụ vòng lặp một lần trong mẫu.

Định dạng cú pháp ví dụ:
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

##### Mẫu
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

Phù hợp cho các trường hợp mảng chứa mảng lồng nhau; có thể lồng nhau không giới hạn cấp độ.

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

##### Mẫu
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

Vòng lặp hai chiều cho phép lặp đồng thời trên cả hàng và cột, phù hợp để tạo các bảng so sánh và các bố cục phức tạp khác (lưu ý: hiện tại, một số định dạng chỉ được hỗ trợ chính thức trong các mẫu DOCX, HTML và MD).

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

##### Mẫu
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

#### 5. Ví dụ: Truy cập giá trị bộ lặp vòng lặp (v4.0.0+)

Trong một vòng lặp, bạn có thể trực tiếp truy cập giá trị chỉ mục của lần lặp hiện tại, điều này giúp đáp ứng các yêu cầu định dạng đặc biệt.

##### Ví dụ mẫu
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Lưu ý: Số lượng dấu chấm dùng để biểu thị các cấp độ chỉ mục khác nhau (ví dụ, `.i` biểu thị cấp độ hiện tại, trong khi `..i` biểu thị cấp độ trước đó). Hiện tại đang có vấn đề về thứ tự ngược; vui lòng tham khảo tài liệu chính thức để biết chi tiết.

### Lặp qua đối tượng

#### 1. Mô tả cú pháp

- Đối với các thuộc tính trong một đối tượng, bạn có thể sử dụng `.att` để lấy tên thuộc tính và `.val` để lấy giá trị thuộc tính.
- Khi lặp, mỗi lần sẽ duyệt qua một mục thuộc tính.

Định dạng cú pháp ví dụ:
```
{d.tên_đối_tượng[i].att}  // Tên thuộc tính
{d.tên_đối_tượng[i].val}  // Giá trị thuộc tính
```

#### 2. Ví dụ: Lặp qua thuộc tính đối tượng

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

##### Mẫu
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

Sử dụng tính năng sắp xếp, bạn có thể trực tiếp sắp xếp dữ liệu mảng trong mẫu.

#### 1. Mô tả cú pháp: Sắp xếp tăng dần

- Sử dụng một thuộc tính làm tiêu chí sắp xếp trong thẻ vòng lặp. Định dạng cú pháp là:
  ```
  {d.mảng[thuộc_tính_sắp_xếp, i].thuộc_tính}
  {d.mảng[thuộc_tính_sắp_xếp+1, i+1].thuộc_tính}
  ```
- Nếu cần nhiều tiêu chí sắp xếp, hãy phân tách các thuộc tính bằng dấu phẩy bên trong dấu ngoặc vuông.

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

##### Mẫu
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

#### 3. Ví dụ: Sắp xếp đa thuộc tính

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

##### Mẫu
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

Xử lý lọc được dùng để lọc các hàng dữ liệu trong một vòng lặp dựa trên các điều kiện cụ thể.

#### 1. Mô tả cú pháp: Lọc số

- Thêm điều kiện vào thẻ vòng lặp (ví dụ: `age > 19`). Định dạng cú pháp là:
  ```
  {d.mảng[i, điều_kiện].thuộc_tính}
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

##### Mẫu
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

- Chỉ định điều kiện chuỗi bằng cách sử dụng dấu nháy đơn. Ví dụ định dạng:
  ```
  {d.mảng[i, type='rocket'].name}
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

##### Mẫu
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

#### 5. Mô tả cú pháp: Lọc N mục đầu tiên

- Bạn có thể sử dụng chỉ mục vòng lặp `i` để lọc ra N phần tử đầu tiên. Ví dụ cú pháp:
  ```
  {d.mảng[i, i < N].thuộc_tính}
  ```

#### 6. Ví dụ: Lọc hai mục đầu tiên

##### Dữ liệu
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Mẫu
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

#### 7. Mô tả cú pháp: Loại trừ N mục cuối cùng

- Sử dụng chỉ mục âm `i` để biểu thị các mục từ cuối. Ví dụ:
  - `{d.mảng[i=-1].thuộc_tính}` lấy mục cuối cùng
  - `{d.mảng[i, i!=-1].thuộc_tính}` loại trừ mục cuối cùng

#### 8. Ví dụ: Loại trừ mục cuối cùng và hai mục cuối cùng

##### Dữ liệu
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Mẫu
```
Mục cuối cùng: {d[i=-1].name}

Loại trừ mục cuối cùng:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Loại trừ hai mục cuối cùng:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Kết quả
```
Mục cuối cùng: Falcon Heavy

Loại trừ mục cuối cùng:
Falcon 9
Model S
Model 3

Loại trừ hai mục cuối cùng:
Falcon 9
Model S
```

#### 9. Mô tả cú pháp: Lọc thông minh

- Sử dụng các khối điều kiện thông minh, bạn có thể ẩn toàn bộ hàng dựa trên các điều kiện phức tạp. Ví dụ định dạng:
  ```
  {d.mảng[i].thuộc_tính:ifIN('từ_khóa'):drop(row)}
  ```

#### 10. Ví dụ: Lọc thông minh

##### Dữ liệu
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Mẫu
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Kết quả
```
People
Model S
Model 3
```
(Lưu ý: Các hàng chứa "Falcon" trong mẫu đã bị xóa bởi điều kiện lọc thông minh.)

### Xử lý loại bỏ trùng lặp

#### 1. Mô tả cú pháp

- Sử dụng một bộ lặp tùy chỉnh, bạn có thể lấy các mục duy nhất (không trùng lặp) dựa trên giá trị của một thuộc tính. Cú pháp tương tự như vòng lặp thông thường nhưng sẽ tự động bỏ qua các mục trùng lặp.

Ví dụ định dạng:
```
{d.mảng[thuộc_tính].thuộc_tính}
{d.mảng[thuộc_tính+1].thuộc_tính}
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

##### Mẫu
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