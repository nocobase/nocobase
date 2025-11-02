---
pkg: "@nocobase/plugin-action-template-print"
---
# 模板打印

<style>
.markdown h4 {
    font-size: 18px;
    font-weight: 500;
}
</style>

## 介绍

模板打印插件支持使用 Word、Excel 和 PowerPoint 编辑模板文件（支持 `.docx`、`.xlsx`、`.pptx` 格式），在模板中设置占位符和逻辑结构，从而动态生成预定格式的文件，如 `.docx`、`.xlsx`、`.pptx` 以及 PDF 文件。可以广泛应用于生成各类业务文档，例如报价单、发票、合同等。

### 主要功能

- **多格式支持**：兼容 Word、Excel 和 PowerPoint 模板，满足不同文档生成需求。
- **动态数据填充**：通过占位符和逻辑结构，自动填充和生成文档内容。
- **灵活的模板管理**：支持添加、编辑、删除和分类管理模板，便于维护和使用。
- **丰富的模板语法**：支持基本替换、数组访问、循环、条件输出等多种模板语法，满足复杂文档生成需求。
- **格式化器支持**：提供条件输出、日期格式化、数字格式化等功能，提升文档的可读性和专业性。
- **高效的输出格式**：支持直接生成 PDF 文件，方便分享和打印。

## 安装

### 安装插件

参考 [商业插件的安装与升级](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

### 安装 LibreOffice(可选)

生成 PDF 必须安装 LibreOffice,[请前往官网下载](
https://www.libreoffice.org/download/download-libreoffice)。Docker 版本,可以直接在 `./storage/scripts` 目录下,编写一段脚本。

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

`install-libreoffice.sh` 的内容如下:

```sh
#!/bin/bash

# Define variables
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Check if LibreOffice is already installed
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice is already installed, skipping installation."
    exit 0
fi

# Update APT sources
tee /etc/apt/sources.list > /dev/null <<EOF
deb http://mirrors.aliyun.com/debian/ bookworm main contrib non-free
deb-src http://mirrors.aliyun.com/debian/ bookworm main contrib non-free
deb http://mirrors.aliyun.com/debian-security/ bookworm-security main contrib non-free
deb-src http://mirrors.aliyun.com/debian-security/ bookworm-security main contrib non-free
deb http://mirrors.aliyun.com/debian/ bookworm-updates main contrib non-free
deb-src http://mirrors.aliyun.com/debian/ bookworm-updates main contrib non-free
deb http://mirrors.aliyun.com/debian/ bookworm-backports main contrib non-free
deb-src http://mirrors.aliyun.com/debian/ bookworm-backports main contrib non-free
EOF

# Update APT and install dependencies
apt-get update

apt-get install -y \
    libfreetype6 \
    fontconfig \
    libgssapi-krb5-2 \
    libxml2 \
    libnss3 \
    libdbus-1-3 \
    libcairo2 \
    libxslt1.1 \
    libglib2.0-0 \
    libcups2 \
    libx11-xcb1 \
    fonts-liberation \
    fonts-noto-cjk \
    wget

rm -rf /var/lib/apt/lists/*

cd /app/nocobase/storage/scripts

# Download and install LibreOffice if not already present
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Failed to download LibreOffice."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Failed to extract LibreOffice."
        exit 1
    fi
fi

# Install LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Failed to install LibreOffice."
    exit 1
fi

echo "LibreOffice installation completed successfully."
```

重启 app 容器

```bash
docker compose restart app
# 查看日志
docker compose logs app
```

检测是否安装成功

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```

## 配置说明

### 激活模板打印功能
模板打印目前支持详情区块和表格区块，下面分别介绍这两类区块的配置方式。

#### 详情区块

1. **打开详情区块**：
- 在应用中，进入需要使用模板打印功能的详情区块。

2. **进入配置操作菜单**：
- 在界面上方，点击“配置操作”菜单。

3. **选择“模板打印”**：
- 在下拉菜单中，点击“模板打印”选项以激活插件功能。

![激活模板打印](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### 配置模板

1. **进入模板配置页面**：
- 在“模板打印”按钮的配置菜单中，选择“模板配置”选项。

![模板配置选项](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2. **添加新模板**：
- 点击“添加模板”按钮，进入模板添加页面。

![添加模板按钮](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3. **填写模板信息**：
- 在模板表单中，填写模板名称，选择模板类型（Word、Excel、PowerPoint）。
- 上传相应的模板文件（支持 `.docx`、`.xlsx`、`.pptx` 格式）。

![配置模板名称和文件](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4. **编辑和保存模板**：
- 来到“字段列表”页面，复制字段，并填充到模板中
  ![字段列表](https://static-docs.nocobase.com/20250107141010.png)
  ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
- 填写完毕后，点击“保存”按钮完成模板的添加。

5. **模板管理**：
- 点击模板列表右侧的“使用”按钮，可以激活模板。
- 点击“编辑”按钮，可以修改模板名称或替换模板文件。
- 点击“下载”按钮，可以下载已经配置好的模板文件。
- 点击“删除”按钮，可以移除不再需要的模板。系统会提示确认操作以避免误删。
  ![模板管理](https://static-docs.nocobase.com/20250107140436.png)

#### 表格区块

表格区块的用法和详情区块基本相同，区别是：
1. 支持多条数据打印：需先勾选要打印的记录，最多可同时打印 100 条。
   
![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2. 模板隔离管理：表格区块与详情区块的模板互不通用 —— 因为数据结构不同（一个是对象，一个是数组）。


## 基础用法

模板打印插件提供了多种语法，可以在模板中灵活地插入动态数据和逻辑结构。以下是详细的语法说明和使用示例。

### 基本替换

使用 `{d.xxx}` 格式的占位符进行数据替换。例如：

- `{d.title}`：读取数据集中的 `title` 字段。
- `{d.date}`：读取数据集中的 `date` 字段。

**示例**：

模板内容：
```
尊敬的客户，您好！

感谢您购买我们的产品：{d.productName}。
订单编号：{d.orderId}
订单日期：{d.orderDate}

祝您使用愉快！
```

数据集：
```json
{
  "productName": "智能手表",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

渲染结果：
```
尊敬的客户，您好！

感谢您购买我们的产品：智能手表。
订单编号：A123456789
订单日期：2025-01-01

祝您使用愉快！
```

### 访问子对象

若数据集中包含子对象，可以通过点符号访问子对象的属性。

**语法**：`{d.parent.child}`

**示例**：

数据集：
```json
{
  "customer": {
    "name": "李雷",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

模板内容：
```
客户姓名：{d.customer.name}
邮箱地址：{d.customer.contact.email}
联系电话：{d.customer.contact.phone}
```

渲染结果：
```
客户姓名：李雷
邮箱地址：lilei@example.com
联系电话：13800138000
```

### 访问数组

若数据集中包含数组，可使用保留关键字 `i` 来访问数组中的元素。

**语法**：`{d.arrayName[i].field}`

**示例**：

数据集：
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

模板内容：
```
第一个员工姓是 {d.staffs[i=0].lastname}，名是 {d.staffs[i=0].firstname}
```

渲染结果：
```
第一个员工姓是 Anderson，名是 James
```

---

## 循环处理

循环处理用于对数组或对象中的数据进行重复渲染，通过定义循环起始和结束标记来识别需要重复的内容。下面介绍常见的几种情况。

---

### 遍历数组

#### 1. 语法说明

- 使用标签 `{d.array[i].属性}` 定义当前循环项，用 `{d.array[i+1].属性}` 指定下一项以标识循环区域。
- 循环时会自动以第一行（`[i]` 部分）作为模板进行重复；模板中只需写一次循环示例即可。

示例语法格式：
```
{d.数组名[i].属性}
{d.数组名[i+1].属性}
```

#### 2. 示例：简单数组循环

##### 数据
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

##### 模板
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### 结果
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

---

#### 3. 示例：嵌套数组循环

适用于数组内嵌套数组的情况，可以无限层级嵌套。

##### 数据
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

##### 模板
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### 结果
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

---

#### 4. 示例：双向循环（高级功能，v4.8.0+）

双向循环可同时在行和列上进行迭代，适用于生成对比表等复杂布局（注：部分格式目前仅 DOCX、HTML、MD 模板官方支持）。

##### 数据
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

##### 模板
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### 结果
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

---

#### 5. 示例：访问循环迭代器值（v4.0.0+）

在循环中可以直接访问当前迭代的索引值，便于实现特殊格式需求。

##### 模板示例
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> 注：点号的数量用于表示不同层级的索引值（例如，`.i` 表示当前层，`..i` 表示上一层），当前存在逆序问题，详情参阅官方说明。

---

### 遍历对象

#### 1. 语法说明

- 对于对象中的属性，可以使用 `.att` 获取属性名称，使用 `.val` 获取属性值。
- 迭代时，每次会遍历一个属性项。

示例语法格式：
```
{d.对象名[i].att}  // 属性名称
{d.对象名[i].val}  // 属性值
```

#### 2. 示例：对象属性遍历

##### 数据
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### 模板
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### 结果
```
People namePeople age
paul10
jack20
bob30
```

---

### 排序处理

利用排序功能可以在模板中直接对数组数据进行排序。

#### 1. 语法说明：升序排序

- 在循环标签中使用属性作为排序依据，语法格式为：
  ```
  {d.array[排序属性, i].属性}
  {d.array[排序属性+1, i+1].属性}
  ```
- 若需要多重排序，可在方括号内以逗号分隔多个排序属性。

#### 2. 示例：按数字属性排序

##### 数据
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

##### 模板
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### 结果
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. 示例：多属性排序

##### 数据
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

##### 模板
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### 结果
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

---

### 筛选处理

筛选处理用于根据特定条件过滤循环中的数据行。

#### 1. 语法说明：数字筛选

- 在循环标签中增加条件（例如 `age > 19`），语法格式：
  ```
  {d.array[i, 条件].属性}
  ```

#### 2. 示例：数字筛选

##### 数据
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### 模板
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### 结果
```
People
John
Bob
```

---

#### 3. 语法说明：字符串筛选

- 使用单引号标明字符串条件，格式示例：
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. 示例：字符串筛选

##### 数据
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### 模板
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### 结果
```
People
Falcon 9
Falcon Heavy
```

---

#### 5. 语法说明：筛选前 N 项

- 可利用循环索引 `i` 过滤出前 N 个元素，语法示例：
  ```
  {d.array[i, i < N].属性}
  ```

#### 6. 示例：筛选前两项

##### 数据
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### 模板
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### 结果
```
People
Falcon 9
Model S
```

---

#### 7. 语法说明：排除最后 N 项

- 通过负索引 `i` 表示倒数项，例如：
  - `{d.array[i=-1].属性}` 获取最后一项
  - `{d.array[i, i!=-1].属性}` 排除最后一项

#### 8. 示例：排除最后一项和最后两项

##### 数据
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### 模板
```
最后一项: {d[i=-1].name}

排除最后一项:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

排除最后两项:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### 结果
```
最后一项: Falcon Heavy

排除最后一项:
Falcon 9
Model S
Model 3

排除最后两项:
Falcon 9
Model S
```

---

#### 9. 语法说明：智能筛选

- 通过智能条件块可根据复杂条件隐藏整行，示例格式：
  ```
  {d.array[i].属性:ifIN('关键字'):drop(row)}
  ```

#### 10. 示例：智能筛选

##### 数据
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### 模板
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### 结果
```
People
Model S
Model 3
```
（注：模板中含 “Falcon” 的行被智能筛选条件删除。）

---

### 去重处理

#### 1. 语法说明

- 通过自定义迭代器，可根据某个属性的值获取唯一（不重复）的项。语法与普通循环类似，但会自动忽略重复的项。

示例格式：
```
{d.array[属性].属性}
{d.array[属性+1].属性}
```

#### 2. 示例：选择唯一数据

##### 数据
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### 模板
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### 结果
```
Vehicles
Hyundai
Airbus
```

---

## 格式化工具

格式化器用于将原始数据转换成便于阅读的文本。格式化器通过冒号（:）应用于数据，可以链式调用，每个格式化器的输出会作为下一个的输入。有些格式化器支持常量参数或动态参数。

---

### 概览

#### 1. 语法说明
格式化器的基本调用形式为：
```
{d.属性:formatter1:formatter2(...)}
```  
例如，将字符串 `"JOHN"` 转换为 `"John"` 的示例中，先用 `lowerCase` 将所有字母转为小写，再用 `ucFirst` 将首字母大写。

#### 2. 示例
数据：
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
模板：
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. 结果
渲染后输出：
```
My name is John. I was born on January 31, 2000.
```

---

### 常量参数

#### 1. 语法说明
许多格式化器支持一个或多个常量参数，用逗号分隔，并放在圆括号中以修改输出。例如，`:prepend(myPrefix)` 会在文本前添加 “myPrefix”。  
注意：如果参数中包含逗号或空格，必须用单引号包裹，如 `prepend('my prefix')`。

#### 2. 示例
模板示例（见具体格式化器的用法）。

#### 3. 结果
输出会在文本前添加指定的前缀。

---

### 动态参数

#### 1. 语法说明
格式化器支持动态参数，参数以点号（.）开头且不加引号。  
可使用两种方式：
- **绝对 JSON 路径**：以 `d.` 或 `c.` 开头（根数据或补充数据）。
- **相对 JSON 路径**：以单个点（.）开头，表示从当前父级对象中查找属性。

例如：
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
也可写为相对路径：
```
{d.subObject.qtyB:add(.qtyC)}
```
若需访问上一级或更高层数据，可使用多个点：
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. 示例
数据：
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
模板中使用：
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // 结果：8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // 结果：8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // 结果：28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // 结果：6 (3 + 3)
```

#### 3. 结果
各示例分别得到 8、8、28、6。

> **注意：** 使用自定义迭代器或数组过滤器作为动态参数是不允许的，如：
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```

---

### 文本格式化

针对文本数据提供多种格式化器，下文依次介绍各格式化器的语法、示例和结果。

#### 1. :lowerCase

##### 语法说明
将所有字母转换为小写。

##### 示例
```
'My Car':lowerCase()   // 输出 "my car"
'my car':lowerCase()   // 输出 "my car"
null:lowerCase()       // 输出 null
1203:lowerCase()       // 输出 1203
```

##### 结果
各示例的输出结果如注释中所示。

---

#### 2. :upperCase

##### 语法说明
将所有字母转换为大写。

##### 示例
```
'My Car':upperCase()   // 输出 "MY CAR"
'my car':upperCase()   // 输出 "MY CAR"
null:upperCase()       // 输出 null
1203:upperCase()       // 输出 1203
```

##### 结果
各示例的输出结果如注释中所示。

---

#### 3. :ucFirst

##### 语法说明
仅将字符串的首字母转换为大写，其余保持不变。

##### 示例
```
'My Car':ucFirst()     // 输出 "My Car"
'my car':ucFirst()     // 输出 "My car"
null:ucFirst()         // 输出 null
undefined:ucFirst()    // 输出 undefined
1203:ucFirst()         // 输出 1203
```

##### 结果
输出结果见注释说明。

---

#### 4. :ucWords

##### 语法说明
将字符串中每个单词的首字母转换为大写。

##### 示例
```
'my car':ucWords()     // 输出 "My Car"
'My cAR':ucWords()     // 输出 "My CAR"
null:ucWords()         // 输出 null
undefined:ucWords()    // 输出 undefined
1203:ucWords()         // 输出 1203
```

##### 结果
输出结果如示例所示。

---

#### 5. :print(message)

##### 语法说明
始终返回指定的消息，无论原数据为何，用作兜底格式化器。  
参数：
- message：要打印的文本

##### 示例
```
'My Car':print('hello!')   // 输出 "hello!"
'my car':print('hello!')   // 输出 "hello!"
null:print('hello!')       // 输出 "hello!"
1203:print('hello!')       // 输出 "hello!"
```

##### 结果
均返回指定的 "hello!" 字符串。

---

#### 6. :printJSON

##### 语法说明
将对象或数组转化为 JSON 格式的字符串输出。

##### 示例
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// 输出 "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // 输出 ""my car""
```

##### 结果
示例中的输出结果即为转换后的 JSON 字符串。

---

#### 7. :unaccent

##### 语法说明
去除文本中的重音符号，使文本变为无重音格式。

##### 示例
```
'crÃ¨me brulÃ©e':unaccent()   // 输出 "creme brulee"
'CRÃME BRULÃE':unaccent()   // 输出 "CREME BRULEE"
'Ãªtre':unaccent()           // 输出 "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // 输出 "euieea"
```

##### 结果
各示例输出均去除了重音符号。

---

#### 8. :convCRLF

##### 语法说明
将文本中的回车换行符（`
` 或 `
`）转换为文档中的换行标记，适用于 DOCX、PPTX、ODT、ODP 和 ODS 等格式。  
注意：在 `:convCRLF` 格式化器之前使用 `:html` 时，`
` 会转换为 `<br>` 标签。

##### 示例
```
// 针对 ODT 格式：
'my blue 
 car':convCRLF()    // 输出 "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // 输出 "my blue <text:line-break/> car"

// 针对 DOCX 格式：
'my blue 
 car':convCRLF()    // 输出 "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // 输出 "my blue </w:t><w:br/><w:t> car"
```

##### 结果
输出结果根据不同文档格式显示换行标记。

---

#### 9. :substr(begin, end, wordMode)

##### 语法说明
对字符串进行切割操作，从 `begin` 索引开始（基于 0），到 `end` 索引前结束。  
可选参数 `wordMode`（布尔值或 `last`）用于控制是否保持单词完整，不在单词中间断开。

##### 示例
```
'foobar':substr(0, 3)            // 输出 "foo"
'foobar':substr(1)               // 输出 "oobar"
'foobar':substr(-2)              // 输出 "ar"
'foobar':substr(2, -1)           // 输出 "oba"
'abcd efg hijklm':substr(0, 11, true)  // 输出 "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // 输出 "abcd efg "
```

##### 结果
根据参数不同，输出相应的字符串片段。

---

#### 10. :split(delimiter)

##### 语法说明
用指定分隔符 `delimiter` 将字符串拆分为数组。  
参数：
- delimiter：分隔符字符串

##### 示例
```
'abcdefc12':split('c')    // 输出 ["ab", "def", "12"]
1222.1:split('.')         // 输出 ["1222", "1"]
'ab/cd/ef':split('/')      // 输出 ["ab", "cd", "ef"]
```

##### 结果
示例结果为拆分后的数组。

---

#### 11. :padl(targetLength, padString)

##### 语法说明
从字符串左侧填充指定字符，使最终字符串长度达到 `targetLength`。  
若目标长度小于原字符串长度，则返回原字符串。  
参数：
- targetLength：目标总长度
- padString：用于填充的字符串，默认为空格

##### 示例
```
'abc':padl(10)              // 输出 "       abc"
'abc':padl(10, 'foo')       // 输出 "foofoofabc"
'abc':padl(6, '123465')     // 输出 "123abc"
'abc':padl(8, '0')          // 输出 "00000abc"
'abc':padl(1)               // 输出 "abc"
```

##### 结果
各示例输出为填充后的字符串。

---

#### 12. :padr(targetLength, padString)

##### 语法说明
从字符串右侧填充指定字符，使最终字符串长度达到 `targetLength`。  
参数同上。

##### 示例
```
'abc':padr(10)              // 输出 "abc       "
'abc':padr(10, 'foo')       // 输出 "abcfoofoof"
'abc':padr(6, '123465')     // 输出 "abc123"
'abc':padr(8, '0')          // 输出 "abc00000"
'abc':padr(1)               // 输出 "abc"
```

##### 结果
输出为右侧填充后的字符串。

---

#### 13. :ellipsis(maximum)

##### 语法说明
如果文本超过指定字符数，则在末尾添加省略号 “...”。  
参数：
- maximum：允许的最大字符数

##### 示例
```
'abcdef':ellipsis(3)      // 输出 "abc..."
'abcdef':ellipsis(6)      // 输出 "abcdef"
'abcdef':ellipsis(10)     // 输出 "abcdef"
```

##### 结果
示例结果为截断并添加省略号的文本。

---

#### 14. :prepend(textToPrepend)

##### 语法说明
在文本前面添加指定前缀。  
参数：
- textToPrepend：前缀文本

##### 示例
```
'abcdef':prepend('123')     // 输出 "123abcdef"
```

##### 结果
输出为添加前缀后的字符串。

---

#### 15. :append(textToAppend)

##### 语法说明
在文本后面添加指定后缀。  
参数：
- textToAppend：后缀文本

##### 示例
```
'abcdef':append('123')      // 输出 "abcdef123"
```

##### 结果
输出为添加后缀后的字符串。

---

#### 16. :replace(oldText, newText)

##### 语法说明
将文本中所有匹配的 `oldText` 替换为 `newText`。  
参数：
- oldText：要替换的旧文本
- newText：替换成的新文本  
  注意：如果 newText 为 null，则表示删除匹配项。

##### 示例
```
'abcdef abcde':replace('cd', 'OK')    // 输出 "abOKef abOKe"
'abcdef abcde':replace('cd')          // 输出 "abef abe"
'abcdef abcde':replace('cd', null)      // 输出 "abef abe"
'abcdef abcde':replace('cd', 1000)      // 输出 "ab1000ef ab1000e"
```

##### 结果
输出结果为替换后的字符串。

---

#### 17. :len

##### 语法说明
返回字符串或数组的长度。

##### 示例
```
'Hello World':len()     // 输出 11
'':len()                // 输出 0
[1,2,3,4,5]:len()       // 输出 5
[1,'Hello']:len()       // 输出 2
```

##### 结果
输出为对应的长度数值。

---

#### 18. :t

##### 语法说明
根据翻译词典对文本进行翻译。  
示例和结果依据实际翻译词典配置而定。

---

#### 19. :preserveCharRef

##### 语法说明
默认情况下，会移除 XML 中的某些非法字符（如 &、>、< 等），此格式化器可保留字符引用（例如 `&#xa7;` 保持不变），适用于特定的 XML 生成场景。  
示例和结果依据具体使用场景而定。

---

### 数字格式化

#### 1. :formatN(precision)

##### 语法说明
根据本地化设置格式化数字。  
参数：
- precision：小数位数  
  对于 ODS/XLSX 格式，显示的小数位数由文本编辑器决定；其他格式则依赖此参数。

##### 示例
```
// 示例环境：API 选项 { "lang": "en-us" }
'10':formatN()         // 输出 "10.000"
'1000.456':formatN()   // 输出 "1,000.456"
```

##### 结果
数字按照指定精度和本地化格式输出。

---

#### 2. :round(precision)

##### 语法说明
对数字进行四舍五入处理，参数指定小数位数。

##### 示例
```
10.05123:round(2)      // 输出 10.05
1.05:round(1)          // 输出 1.1
```

##### 结果
输出为四舍五入后的数值。

---

#### 3. :add(value)

##### 语法说明
将当前数字与指定值相加。  
参数：
- value：待加数

##### 示例
```
1000.4:add(2)         // 输出 1002.4
'1000.4':add('2')      // 输出 1002.4
```

##### 结果
输出为相加后的数值。

---

#### 4. :sub(value)

##### 语法说明
将当前数字与指定值相减。  
参数：
- value：减数

##### 示例
```
1000.4:sub(2)         // 输出 998.4
'1000.4':sub('2')      // 输出 998.4
```

##### 结果
输出为相减后的数值。

---

#### 5. :mul(value)

##### 语法说明
将当前数字与指定值相乘。  
参数：
- value：乘数

##### 示例
```
1000.4:mul(2)         // 输出 2000.8
'1000.4':mul('2')      // 输出 2000.8
```

##### 结果
输出为相乘后的数值。

---

#### 6. :div(value)

##### 语法说明
将当前数字与指定值相除。  
参数：
- value：除数

##### 示例
```
1000.4:div(2)         // 输出 500.2
'1000.4':div('2')      // 输出 500.2
```

##### 结果
输出为相除后的数值。

---

#### 7. :mod(value)

##### 语法说明
计算当前数字对指定值的模（取余）。  
参数：
- value：模数

##### 示例
```
4:mod(2)              // 输出 0
3:mod(2)              // 输出 1
```

##### 结果
输出为模运算的结果。

---

#### 8. :abs

##### 语法说明
返回数字的绝对值。

##### 示例
```
-10:abs()             // 输出 10
-10.54:abs()          // 输出 10.54
10.54:abs()           // 输出 10.54
'-200':abs()          // 输出 200
```

##### 结果
输出为绝对值。

---

#### 9. :ceil

##### 语法说明
向上取整，即返回大于等于当前数字的最小整数。

##### 示例
```
10.05123:ceil()       // 输出 11
1.05:ceil()           // 输出 2
-1.05:ceil()          // 输出 -1
```

##### 结果
输出为取整后的整数。

---

#### 10. :floor

##### 语法说明
向下取整，即返回小于等于当前数字的最大整数。

##### 示例
```
10.05123:floor()      // 输出 10
1.05:floor()          // 输出 1
-1.05:floor()         // 输出 -2
```

##### 结果
输出为取整后的整数。

---

#### 11. :int

##### 语法说明
将数字转换为整数（不推荐使用）。

##### 示例与结果
依据具体转换情况。

---

#### 12. :toEN

##### 语法说明
将数字转换为英文格式（小数点为 '.'），不推荐使用。

##### 示例与结果
依据具体转换情况。

---

#### 13. :toFixed

##### 语法说明
将数字转换为字符串，仅保留指定小数位数，不推荐使用。

##### 示例与结果
依据具体转换情况。

---

#### 14. :toFR

##### 语法说明
将数字转换为法文格式（小数点为 ','），不推荐使用。

##### 示例与结果
依据具体转换情况。

---

### 货币格式化

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### 语法说明
格式化货币数字，可指定小数位数或特定输出格式。  
参数：
- precisionOrFormat：可选参数，既可以是数字（指定小数位数），也可以是特定格式标识：
  - 整数：改变默认小数精度
  - `'M'`：仅输出主要货币名称
  - `'L'`：输出数字并附带货币符号（默认）
  - `'LL'`：输出数字并附带主要货币名称
- targetCurrency：可选，目标货币代码（大写，如 USD、EUR），会覆盖全局设置

##### 示例
```
// 示例环境：API 选项 { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // 输出 "$2,000.91"
'1000.456':formatC('M')    // 输出 "dollars"
'1':formatC('M')           // 输出 "dollar"
'1000':formatC('L')        // 输出 "$2,000.00"
'1000':formatC('LL')       // 输出 "2,000.00 dollars"

// 法语示例（环境设置不同时）：
'1000.456':formatC()      // 输出 "2 000,91 ..."  
'1000.456':formatC()      // 当源货币与目标货币相同时输出 "1 000,46 €"
```

##### 结果
输出结果依据 API 选项及汇率设置。

---

#### 2. :convCurr(target, source)

##### 语法说明
将数字从一种货币转换为另一种货币。汇率可通过 API 选项传入或全局设置。  
若不指定参数，则自动从 `options.currencySource` 转换到 `options.currencyTarget`。  
参数：
- target：可选，目标货币代码（默认等于 `options.currencyTarget`）
- source：可选，源货币代码（默认等于 `options.currencySource`）

##### 示例
```
// 示例环境：API 选项 { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // 输出 20
1000:convCurr()            // 输出 2000
1000:convCurr('EUR')        // 输出 1000
1000:convCurr('USD')        // 输出 2000
1000:convCurr('USD', 'USD') // 输出 1000
```

##### 结果
输出为转换后的货币数值。

---

### 日期格式化

#### 1. :formatD(patternOut, patternIn)

##### 语法说明
格式化日期，接受输出格式模式 `patternOut`，输入格式模式 `patternIn`（默认为 ISO 8601）。  
可通过 `options.timezone` 和 `options.lang` 调整时区和语言。

##### 示例
```
// 示例环境：API 选项 { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // 输出 01/31/2016
'20160131':formatD(LL)     // 输出 January 31, 2016
'20160131':formatD(LLLL)   // 输出 Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // 输出 Sunday

// 法语示例：
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // 输出 mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // 输出 dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // 输出 dimanche 14 septembre 2014 19:27
```

##### 结果
输出为指定格式的日期字符串。

---

#### 2. :addD(amount, unit, patternIn)

##### 语法说明
在日期上添加指定的时间量。支持单位：day、week、month、quarter、year、hour、minute、second、millisecond。  
参数：
- amount：添加的数量
- unit：时间单位（不区分大小写）
- patternIn：可选，输入格式，默认为 ISO8601

##### 示例
```
// 示例环境：API 选项 { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // 输出 "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // 输出 "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // 输出 "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // 输出 "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // 输出 "2016-04-30T00:00:00.000Z"
```

##### 结果
输出为添加时间后的新日期。

---

#### 3. :subD(amount, unit, patternIn)

##### 语法说明
从日期中减去指定的时间量。参数同 `addD`。

##### 示例
```
// 示例环境：API 选项 { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // 输出 "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // 输出 "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // 输出 "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // 输出 "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // 输出 "2015-10-31T00:00:00.000Z"
```

##### 结果
输出为减去时间后的新日期。

---

#### 4. :startOfD(unit, patternIn)

##### 语法说明
将日期设置为指定时间单位的起始时刻。  
参数：
- unit：时间单位
- patternIn：可选，输入格式

##### 示例
```
// 示例环境：API 选项 { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // 输出 "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // 输出 "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // 输出 "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // 输出 "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // 输出 "2016-01-01T00:00:00.000Z"
```

##### 结果
输出为起始时刻的日期字符串。

---

#### 5. :endOfD(unit, patternIn)

##### 语法说明
将日期设置为指定时间单位的结束时刻。  
参数同上。

##### 示例
```
// 示例环境：API 选项 { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // 输出 "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // 输出 "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // 输出 "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // 输出 "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // 输出 "2016-01-31T23:59:59.999Z"
```

##### 结果
输出为结束时刻的日期字符串。

---

#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### 语法说明
计算两个日期之间的差值，并以指定单位输出。支持的输出单位包括：
- `day(s)` 或 `d`
- `week(s)` 或 `w`
- `quarter(s)` 或 `Q`
- `month(s)` 或 `M`
- `year(s)` 或 `y`
- `hour(s)` 或 `h`
- `minute(s)` 或 `m`
- `second(s)` 或 `s`
- `millisecond(s)` 或 `ms`（默认单位）

参数：
- toDate：目标日期
- unit：输出单位
- patternFromDate：可选，起始日期格式
- patternToDate：可选，目标日期格式

##### 示例
```
'20101001':diffD('20101201')              // 输出 5270400000
'20101001':diffD('20101201', 'second')      // 输出 5270400
'20101001':diffD('20101201', 's')           // 输出 5270400
'20101001':diffD('20101201', 'm')           // 输出 87840
'20101001':diffD('20101201', 'h')           // 输出 1464
'20101001':diffD('20101201', 'weeks')       // 输出 8
'20101001':diffD('20101201', 'days')        // 输出 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // 输出 5270400000
```

##### 结果
输出为两个日期之间的时间差，单位按指定转换。

---

#### 7. :convDate(patternIn, patternOut)

##### 语法说明
将日期从一种格式转换为另一种格式。（不推荐使用）  
参数：
- patternIn：输入日期格式
- patternOut：输出日期格式

##### 示例
```
// 示例环境：API 选项 { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // 输出 "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // 输出 "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // 输出 "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // 输出 "Sunday"
1410715640:convDate('X', 'LLLL')          // 输出 "Sunday, September 14, 2014 7:27 PM"
// 法语示例：
'20160131':convDate('YYYYMMDD', 'LLLL')   // 输出 "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // 输出 "dimanche"
```

##### 结果
输出为转换后的日期字符串。

---

#### 8. 日期格式模式
常用日期格式说明（参照 DayJS 说明）：
- `X`：Unix 时间戳（秒），如 1360013296
- `x`：Unix 毫秒时间戳，如 1360013296123
- `YY`：两位年份，如 18
- `YYYY`：四位年份，如 2018
- `M`、`MM`、`MMM`、`MMMM`：月份（数字、两位、缩写、全称）
- `D`、`DD`：日（数字、两位）
- `d`、`dd`、`ddd`、`dddd`：星期（数字、最简、简写、全称）
- `H`、`HH`、`h`、`hh`：小时（24 小时制或 12 小时制）
- `m`、`mm`：分钟
- `s`、`ss`：秒
- `SSS`：毫秒（3 位）
- `Z`、`ZZ`：UTC 偏移，如 +05:00 或 +0500
- `A`、`a`：AM/PM
- `Q`：季度（1-4）
- `Do`：带序号的日期，如 1st, 2nd, …
- 其它格式参见完整文档。  
  此外，还有基于语言的本地化格式：如 `LT`、`LTS`、`L`、`LL`、`LLL`、`LLLL` 等。

---

### 时间间隔格式化

#### 1. :formatI(patternOut, patternIn)

##### 语法说明
格式化时长或间隔，支持的输出格式包括：
- `human+`、`human`（适合人性化显示）
- 以及 `millisecond(s)`、`second(s)`、`minute(s)`、`hour(s)`、`year(s)`、`month(s)`、`week(s)`、`day(s)` 等单位（或其简写）。

参数：
- patternOut：输出格式（例如 `'second'`、`'human+'` 等）
- patternIn：可选，输入单位（例如 `'milliseconds'`、`'s'` 等）

##### 示例
```
// 示例环境：API 选项 { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // 输出 2
2000:formatI('seconds')      // 输出 2
2000:formatI('s')            // 输出 2
3600000:formatI('minute')    // 输出 60
3600000:formatI('hour')      // 输出 1
2419200000:formatI('days')   // 输出 28

// 法语示例：
2000:formatI('human')        // 输出 "quelques secondes"
2000:formatI('human+')       // 输出 "dans quelques secondes"
-2000:formatI('human+')      // 输出 "il y a quelques secondes"

// 英语示例：
2000:formatI('human')        // 输出 "a few seconds"
2000:formatI('human+')       // 输出 "in a few seconds"
-2000:formatI('human+')      // 输出 "a few seconds ago"

// 单位转换示例：
60:formatI('ms', 'minute')   // 输出 3600000
4:formatI('ms', 'weeks')      // 输出 2419200000
'P1M':formatI('ms')          // 输出 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // 输出 10296.085
```

##### 结果
输出结果根据输入值和单位转换显示为相应的时长或间隔。

---

### 数组格式化

#### 1. :arrayJoin(separator, index, count)

##### 语法说明
将一个字符串或数字数组拼接为一个字符串。  
参数：
- separator：分隔符（默认为逗号 `,`）
- index：可选，从该索引开始拼接
- count：可选，从 index 开始拼接的项数（可以为负数，表示从末尾开始计数）

##### 示例
```
['homer','bart','lisa']:arrayJoin()              // 输出 "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // 输出 "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // 输出 "homerbartlisa"
[10,50]:arrayJoin()                               // 输出 "10, 50"
[]:arrayJoin()                                    // 输出 ""
null:arrayJoin()                                  // 输出 null
{}:arrayJoin()                                    // 输出 {}
20:arrayJoin()                                    // 输出 20
undefined:arrayJoin()                             // 输出 undefined
['homer','bart','lisa']:arrayJoin('', 1)          // 输出 "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // 输出 "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // 输出 "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // 输出 "homerbart"
```

##### 结果
输出为根据参数拼接后的字符串。

---

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### 语法说明
将对象数组转化为字符串，不处理嵌套对象或数组。  
参数：
- objSeparator：对象间的分隔符（默认为 `, `）
- attSeparator：对象属性间的分隔符（默认为 `:`）
- attributes：可选，指定要输出的对象属性列表

##### 示例
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// 输出 "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// 输出 "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// 输出 "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// 输出 "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// 输出 "2:homer"

['homer','bart','lisa']:arrayMap()    // 输出 "homer, bart, lisa"
[10,50]:arrayMap()                    // 输出 "10, 50"
[]:arrayMap()                         // 输出 ""
null:arrayMap()                       // 输出 null
{}:arrayMap()                         // 输出 {}
20:arrayMap()                         // 输出 20
undefined:arrayMap()                  // 输出 undefined
```

##### 结果
输出为拼接后的字符串，忽略对象中嵌套的内容。

---

#### 3. :count(start)

##### 语法说明
统计数组中的行号，并输出当前行号。  
例如：
```
{d[i].id:count()}
```  
不论 `id` 的值如何，均输出当前行计数。  
自 v4.0.0 起，该格式化器内部已替换为 `:cumCount`。

参数：
- start：可选，计数的起始值

##### 示例与结果
具体使用时，输出的行号将依照数组元素顺序显示。

---

## 条件判断

条件判断允许根据数据的值来动态控制文档中内容的显示或隐藏。提供了三种主要的条件写法：

- **内联条件**：直接输出文本（或替换为其他文本）。
- **条件块**：对文档中一段区域进行显示或隐藏，适用于多个 标签、段落、表格等。
- **智能条件**：通过一条标签直接移除或保留目标元素（如行、段落、图片等），语法更简洁。

所有条件均以一个逻辑判断格式器开始（例如 ifEQ、ifGT 等），后续跟随执行动作的格式器（如 show、elseShow、drop、keep 等）。

---

### 概览

条件判断中支持的逻辑操作符及动作格式器包括：

- **逻辑操作符**
  - **ifEQ(value)**：判断数据是否等于指定值
  - **ifNE(value)**：判断数据是否不等于指定值
  - **ifGT(value)**：判断数据是否大于指定值
  - **ifGTE(value)**：判断数据是否大于或等于指定值
  - **ifLT(value)**：判断数据是否小于指定值
  - **ifLTE(value)**：判断数据是否小于或等于指定值
  - **ifIN(value)**：判断数据是否包含在数组或字符串中
  - **ifNIN(value)**：判断数据是否不包含在数组或字符串中
  - **ifEM()**：判断数据是否为空（如 null、undefined、空字符串、空数组或空对象）
  - **ifNEM()**：判断数据是否非空
  - **ifTE(type)**：判断数据的类型是否等于指定类型（例如 "string"、"number"、"boolean" 等）
  - **and(value)**：逻辑“与”，用于连接多个条件
  - **or(value)**：逻辑“或”，用于连接多个条件

- **动作格式器**
  - **:show(text) / :elseShow(text)**：用于内联条件，直接输出指定文本
  - **:hideBegin / :hideEnd** 与 **:showBegin / :showEnd**：用于条件块，隐藏或显示文档块
  - **:drop(element) / :keep(element)**：用于智能条件，移除或保留指定文档元素

接下来分别介绍各个用法的详细语法、示例与结果。

---

### 内联条件

#### 1. :show(text) / :elseShow(text)

##### 语法
```
{数据:条件:show(文本)}
{数据:条件:show(文本):elseShow(替代文本)}
```

##### 示例
假设数据为：
```json
{
  "val2": 2,
  "val5": 5
}
```
模板如下：
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### 结果
```
val2 = 2
val2 = low
val5 = high
```

---

#### 2. Switch Case（多重条件判断）

##### 语法
使用连续的条件格式器构建类似 switch-case 的结构：
```
{数据:ifEQ(值1):show(结果1):ifEQ(值2):show(结果2):elseShow(默认结果)}
```
或用 or 操作符实现：
```
{数据:ifEQ(值1):show(结果1):or(数据):ifEQ(值2):show(结果2):elseShow(默认结果)}
```

##### 示例
数据：
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
模板：
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### 结果
```
val1 = A
val2 = B
val3 = C
```

---

#### 3. 多变量条件判断

##### 语法
使用逻辑操作符 and/or 可以测试多个变量：
```
{数据1:ifEQ(条件1):and(.数据2):ifEQ(条件2):show(结果):elseShow(替代结果)}
{数据1:ifEQ(条件1):or(.数据2):ifEQ(条件2):show(结果):elseShow(替代结果)}
```

##### 示例
数据：
```json
{
  "val2": 2,
  "val5": 5
}
```
模板：
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### 结果
```
and = KO
or = OK
```

---

### 逻辑操作符及格式器

以下各节中介绍的格式器均采用内联条件形式，语法格式为：
```
{数据:格式器(参数):show(文本):elseShow(替代文本)}
```

#### 1. :and(value)

##### 语法
```
{数据:ifEQ(值):and(新的数据或条件):ifGT(其他值):show(文本):elseShow(替代文本)}
```

##### 示例
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### 结果
如果 `d.car` 等于 `'delorean'` 且 `d.speed` 大于 80，则输出 `TravelInTime`；否则输出 `StayHere`。

---

#### 2. :or(value)

##### 语法
```
{数据:ifEQ(值):or(新的数据或条件):ifGT(其他值):show(文本):elseShow(替代文本)}
```

##### 示例
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### 结果
如果 `d.car` 等于 `'delorean'` 或 `d.speed` 大于 80，则输出 `TravelInTime`；否则输出 `StayHere`。

---

#### 3. :ifEM()

##### 语法
```
{数据:ifEM():show(文本):elseShow(替代文本)}
```

##### 示例
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### 结果
对于 `null` 或空数组，输出 `Result true`；否则输出 `Result false`。

---

#### 4. :ifNEM()

##### 语法
```
{数据:ifNEM():show(文本):elseShow(替代文本)}
```

##### 示例
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### 结果
对于非空数据（如数字 0 或字符串 'homer'），输出 `Result true`；空数据则输出 `Result false`。

---

#### 5. :ifEQ(value)

##### 语法
```
{数据:ifEQ(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### 结果
若数据等于指定值则输出 `Result true`，否则输出 `Result false`。

---

#### 6. :ifNE(value)

##### 语法
```
{数据:ifNE(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result false`，第二个例子输出 `Result true`。

---

#### 7. :ifGT(value)

##### 语法
```
{数据:ifGT(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result true`，第二个例子输出 `Result false`。

---

#### 8. :ifGTE(value)

##### 语法
```
{数据:ifGTE(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result true`，第二个例子输出 `Result false`。

---

#### 9. :ifLT(value)

##### 语法
```
{数据:ifLT(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result true`，第二个例子输出 `Result false`。

---

#### 10. :ifLTE(value)

##### 语法
```
{数据:ifLTE(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result true`，第二个例子输出 `Result false`。

---

#### 11. :ifIN(value)

##### 语法
```
{数据:ifIN(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### 结果
两个例子均输出 `Result true`（因为字符串中包含 'is'，数组中包含 2）。

---

#### 12. :ifNIN(value)

##### 语法
```
{数据:ifNIN(值):show(文本):elseShow(替代文本)}
```

##### 示例
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result false`（因为字符串中包含 'is'），第二个例子输出 `Result false`（因为数组中包含 2）。

---

#### 13. :ifTE(type)

##### 语法
```
{数据:ifTE('类型'):show(文本):elseShow(替代文本)}
```

##### 示例
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### 结果
第一个例子输出 `Result true`（'homer' 为字符串），第二个例子输出 `Result true`（10.5 为数字）。

---

### 条件块

条件块用于对文档中一段区域进行显示或隐藏，常用于包裹多个标签或整段文本。

#### 1. :showBegin / :showEnd

##### 语法
```
{数据:ifEQ(条件):showBegin}
文档块内容
{数据:showEnd}
```

##### 示例
数据：
```json
{
  "toBuy": true
}
```
模板：
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### 结果
条件成立时，中间的内容显示：
```
Banana
Apple
Pineapple
Grapes
```

---

#### 2. :hideBegin / :hideEnd

##### 语法
```
{数据:ifEQ(条件):hideBegin}
文档块内容
{数据:hideEnd}
```

##### 示例
数据：
```json
{
  "toBuy": true
}
```
模板：
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### 结果
条件成立时，中间的内容被隐藏，输出：
```
Banana
Grapes
```

---

## 计算

## 高级功能

### 分页

#### 1. 页码更新

##### 语法
在 Office 软件中插入即可。

##### 示例
在 Microsoft Word 中：
- 使用 “插入 → 页码” 功能  
  在 LibreOffice 中：
- 使用 “插入 → 字段 → 页码” 功能

##### 结果
生成的报告中，各页页码会自动更新。

---

#### 2. 目录生成

##### 语法
在 Office 软件中插入即可。

##### 示例
在 Microsoft Word 中：
- 使用 “插入 → 索引和目录 → 目录” 功能  
  在 LibreOffice 中：
- 使用 “插入 → 目录和索引 → 目录、索引或参考书目” 功能

##### 结果
生成的报告目录会根据文档内容自动更新。

---

#### 3. 表头重复

##### 语法
在 Office 软件中插入即可。

##### 示例
在 Microsoft Word 中：
- 右键点击表头 → 表格属性 → 勾选“在每页顶部重复作为标题行”  
  在 LibreOffice 中：
- 右键点击表头 → 表格属性 → 文本流选项卡 → 勾选“重复标题”

##### 结果
当表格跨页时，表头自动在每页顶部重复显示。

---

### 国际化（i18n）

#### 1. 静态文本翻译

##### 语法
使用 `{t(文本)}` 标签对静态文本进行国际化：
```
{t(meeting)}
```

##### 示例
模板中：
```
{t(meeting)} {t(apples)}
```
JSON 数据或外部本地化字典（例如针对 "fr-fr"）中提供对应翻译，如 "meeting" → "rendez-vous"、"apples" → "Pommes"。

##### 结果
生成报告时，文本将根据目标语言替换为相应翻译。

---

#### 2. 动态文本翻译

##### 语法
对于数据内容可使用 `:t` 格式器，例如：
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### 示例
模板中：
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
JSON 数据和本地化字典中提供相应翻译。

##### 结果
根据条件判断，输出 “lundi” 或 “mardi”（以目标语言为例）。

---

### 键值映射

#### 1. 枚举转换（:convEnum）

##### 语法
```
{数据:convEnum(枚举名称)}
```
例如：
```
0:convEnum('ORDER_STATUS')
```

##### 示例
API options 示例中传入：
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
模板中：
```
0:convEnum('ORDER_STATUS')
```

##### 结果
输出 “pending”；若索引超出枚举范围，则输出原始值。

---

### 动态图片
:::info
目前支持 XLSX, DOCX 类型的文件
:::
你可以在文档模板中插入“动态图片”，也就是说，模板中的占位图会在渲染时根据数据自动替换为真实图片。这个过程非常简单，只需要：

1. 插入一张临时图片作为占位符

2. 编辑该图片的“替代文字”来设置字段标签

3. 渲染文档，系统自动将其替换为实际图片

下面我们通过具体例子分别讲解 DOCX 和 XLSX 的操作方法。


#### 在 DOCX 文件中插入动态图片
##### 单张图片替换

1. 打开你的 DOCX 模板，插入一张临时图片（可以是任意一张占位图片，比如[纯蓝色图片](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)）

:::info
**图片格式说明**

- 目前占位符图片仅支持 PNG 类型的图片，推荐使用我们提供的示例图片[纯蓝色图片](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)
- 目标渲染图片仅支持 PNG, JPG, JPEG 的图片，其他类型图片可能会渲染失败。

**图片尺寸说明**

无论是 DOCX 还是 XLSX，最终渲染时的图片大小，将会沿用模板中临时图片的尺寸。也就是说，实际替换进去的图片会自动缩放为和您插入的占位图一致的大小。如果您希望渲染后的图片大小为 150×150，请在模板中使用一张临时图片并调整为该尺寸。
:::

2. 右键点击这张图片，编辑其 “替代文字（Alt Text）”，填入你希望插入的图片字段标签，例如 `{d.imageUrl}`：
   
![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. 使用如下示例数据进行渲染：
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. 渲染后的结果，临时图片会被替换为实际图片：

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### 多张图片循环替换

如果你想在模板中插入一组图片，例如商品列表，也可以通过循环方式实现，具体步骤如下：
1. 假设你的数据如下：
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg",
    },
  ]
}
```

2. 在 DOCX 模板中设置循环区域，并在每个循环项中插入临时图片，替代文字设置为 `{d.products[i].imageUrl}`，如下所示：

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. 渲染后，所有临时图片都会被各自的数据图片替换：
   
![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### 在 XLSX 文件中插入动态图片

在 Excel 模板（XLSX）中操作方式基本一致，只是注意以下几点：

1. 插入图片后，请确保选中的是“单元格内的图片”，而不是图片悬浮在单元格上方。

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. 选中单元格后点击查看“替代文字”来填入字段标签，比如 `{d.imageUrl}`。

### 条码
:::info
目前支持 XLSX, DOCX 类型的文件
:::

#### 生成条码（如二维码）

条形码的生成方式与动态图片相同，只需三步：

1. 在模板中插入一张临时图片，用于标记条码的位置

2. 编辑图片的"替代文字"，写入条码格式字段标签，例如 `{d.code:barcode(qrcode)}`，其中 `qrcode` 是条码的类型（详见下方支持列表）

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. 渲染后，该占位图将被自动替换为对应的条码图像：
   
![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### 支持的条码类型

| 条码名称 | 类型   |
| -------- | ------ |
| 二维码   | qrcode |



## 常见问题与解决方案

### 1. Excel 模板中的空列和空单元格在渲染结果中消失

**问题描述**：在 Excel 模板中，如果某个单元格没有内容或样式，渲染时可能会被去除，导致最终文档中缺失该单元格。

**解决方法**：

- **填充背景色**：为目标区域的空单元格填充背景色，确保单元格在渲染过程中保持可见。
- **插入空格**：在空单元格内插入一个空格字符，即使没有实际内容，也能保持单元格的结构。
- **设置边框**：为表格添加边框样式，增强单元格的边界感，避免渲染时单元格消失。

**示例**：

在 Excel 模板中，为所有目标单元格设置浅灰色背景，并在空单元格中插入空格。

### 2. 合并单元格在输出时无效

**问题描述**：在使用循环功能输出表格时，如果模板中存在合并单元格，可能会导致渲染结果异常，如合并效果丢失或数据错位。

**解决方法**：

- **避免使用合并单元格**：尽量避免在循环输出的表格中使用合并单元格，以确保数据的正确渲染。
- **使用跨列居中**：如果需要文本在多个单元格中横向居中，可以使用“跨列居中”功能，而不是合并单元格。
- **限制合并单元格的位置**：若必须使用合并单元格，请仅在表格的上方或右侧进行合并，避免在下方或左侧合并，以防渲染时合并效果丢失。



### 3. 循环渲染区域下方内容导致格式错乱

**问题描述**：在 Excel 模板中，如果在一个会根据数据条目动态增长的循环区域（例如，订单明细）下方，还存在其他内容（例如，订单汇总、备注），那么在渲染时，循环生成的数据行会向下扩展，直接覆盖或推挤下方的静态内容，导致最终文档的格式错乱、内容重叠。

**解决方法**：

  * **调整布局，将循环区域置于底部**：这是最推荐的方法。将需要循环渲染的表格区域放置在整个工作表的底部。将原本位于其下方的汇总、签名等信息全部移动到循环区域的上方。这样，循环数据就可以自由向下扩展，而不会影响任何其他元素。
  * **预留足够的空白行**：如果必须在循环区域下方放置内容，可以预估循环可能生成的最大行数，并在循环区域和下方内容之间手动插入足够多的空白行作为缓冲区。但这种方法存在风险，一旦实际数据超出预估行数，问题会再次出现。
  * **使用 Word 模板**：如果布局要求复杂，无法通过调整 Excel 结构来解决，可以考虑使用 Word 文档作为模板。Word 中的表格在行数增加时，会自动将下方内容向后推移，不会出现内容覆盖的问题，更适合此类动态文档的生成。

**示例**：

**错误的方式**：将“订单汇总”信息紧跟在循环的“订单明细”表格下方。
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**正确的方式 1（调整布局）**：将"订单汇总"信息移动到"订单明细"表格的上方，让循环区域成为页面底部的元素。
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**正确的方式 2（预留空行）**：在"订单明细"和"订单汇总"之间预留大量空行，确保循环内容有足够的扩展空间。
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**正确的方式 3**: 使用word模板。






### 4. 模板渲染时出现错误提示

**问题描述**：在模板渲染过程中，系统弹出错误提示，导致渲染失败。

**可能原因**：

- **占位符错误**：占位符名称与数据集字段不匹配或语法错误。
- **数据缺失**：数据集中缺少模板中引用的字段。
- **格式化器使用不当**：格式化器参数错误或不支持的格式化类型。

**解决方法**：

- **检查占位符**：确保模板中的占位符名称与数据集中的字段名称一致，且语法正确。
- **验证数据集**：确认数据集中包含所有模板中引用的字段，且数据格式符合要求。
- **调整格式化器**：检查格式化器的使用方法，确保参数正确，并使用支持的格式化类型。

**示例**：

**错误模板**：
```
订单编号：{d.orderId}
订单日期：{d.orderDate:format('YYYY/MM/DD')}
总金额：{d.totalAmount:format('0.00')}
```

**数据集**：
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // 缺少 totalAmount 字段
}
```

**解决方法**：在数据集中添加 `totalAmount` 字段，或从模板中移除对 `totalAmount` 的引用。