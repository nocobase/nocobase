## 循环处理

循环处理用于对数组或对象中的数据进行重复渲染，通过定义循环起始和结束标记来识别需要重复的内容。下面介绍常见的几种情况。


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


#### 5. 示例：访问循环迭代器值（v4.0.0+）

在循环中可以直接访问当前迭代的索引值，便于实现特殊格式需求。

##### 模板示例
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> 注：点号的数量用于表示不同层级的索引值（例如，`.i` 表示当前层，`..i` 表示上一层），当前存在逆序问题，详情参阅官方说明。


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


