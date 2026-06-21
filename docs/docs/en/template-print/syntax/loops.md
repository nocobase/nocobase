## Loop Handling

Loop handling is used to repeatedly render data from arrays or objects by defining start and end markers for the loop. Below, several common scenarios are described.


### Iterating over Arrays

#### 1. Syntax Description

- Use the tag `{d.array[i].property}` to define the current loop item, and use `{d.array[i+1].property}` to specify the next item to mark the loop area.
- During the loop, the first line (the `[i]` part) is automatically used as the template for repetition; you only need to write the loop example once in the template.

Example syntax format:
```
{d.arrayName[i].property}
{d.arrayName[i+1].property}
```

#### 2. Example: Simple Array Loop

##### Data
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

##### Result
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```


#### 3. Example: Nested Array Loop

Suitable for cases where an array contains nested arrays; nesting can be at an infinite level.

##### Data
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

##### Result
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```


#### 4. Example: Bidirectional Loop (Advanced Feature, v4.8.0+)

Bidirectional loops allow iteration over both rows and columns simultaneously, which is suitable for generating comparison tables and other complex layouts (note: currently, some formats are officially supported only in DOCX, HTML, and MD templates).

##### Data
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

##### Result
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```


#### 5. Example: Accessing Loop Iterator Values (v4.0.0+)

Within a loop, you can directly access the current iteration's index, which helps meet special formatting requirements.

##### Template Example
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Note: The number of dots indicates the index level (for example, `.i` represents the current level, while `..i` represents the previous level). There is currently an issue with reverse ordering; please refer to the official documentation for details.


### Iterating over Objects

#### 1. Syntax Description

- For properties in an object, use `.att` to obtain the property name and `.val` to obtain the property value.
- During iteration, each property item is traversed one by one.

Example syntax format:
```
{d.objectName[i].att}  // property name
{d.objectName[i].val}  // property value
```

#### 2. Example: Object Property Iteration

##### Data
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

##### Result
```
People namePeople age
paul10
jack20
bob30
```


### Sorting

Using the sorting feature, you can directly sort array data within the template.

#### 1. Syntax Description: Ascending Order Sorting

- Use an attribute as the sorting criterion in the loop tag. The syntax format is:
  ```
  {d.array[sortingAttribute, i].property}
  {d.array[sortingAttribute+1, i+1].property}
  ```
- For multiple sorting criteria, separate the attributes with commas within the brackets.

#### 2. Example: Sorting by Numeric Attribute

##### Data
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

##### Result
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Example: Multi-Attribute Sorting

##### Data
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

##### Result
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```


### Filtering

Filtering is used to filter out rows in a loop based on specific conditions.

#### 1. Syntax Description: Numeric Filtering

- Add conditions in the loop tag (for example, `age > 19`). The syntax format is:
  ```
  {d.array[i, condition].property}
  ```

#### 2. Example: Numeric Filtering

##### Data
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

##### Result
```
People
John
Bob
```


#### 3. Syntax Description: String Filtering

- Specify string conditions using single quotes. For example:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Example: String Filtering

##### Data
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

##### Result
```
People
Falcon 9
Falcon Heavy
```


#### 5. Syntax Description: Filter the First N Items

- You can use the loop index `i` to filter out the first N elements. For example:
  ```
  {d.array[i, i < N].property}
  ```

#### 6. Example: Filtering the First Two Items

##### Data
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

##### Result
```
People
Falcon 9
Model S
```


#### 7. Syntax Description: Exclude the Last N Items

- Use negative indexing `i` to represent items from the end. For example:
  - `{d.array[i=-1].property}` retrieves the last item.
  - `{d.array[i, i!=-1].property}` excludes the last item.

#### 8. Example: Excluding the Last One and Last Two Items

##### Data
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
Last item: {d[i=-1].name}

Excluding the last item:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Excluding the last two items:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Result
```
Last item: Falcon Heavy

Excluding the last item:
Falcon 9
Model S
Model 3

Excluding the last two items:
Falcon 9
Model S
```


### Deduplication

#### 1. Syntax Description

- Using a custom iterator, you can obtain unique (non-duplicate) items based on a property value. The syntax is similar to a normal loop but automatically ignores duplicate items.

Example format:
```
{d.array[property].property}
{d.array[property+1].property}
```

#### 2. Example: Selecting Unique Data

##### Data
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

##### Result
```
Vehicles
Hyundai
Airbus
```