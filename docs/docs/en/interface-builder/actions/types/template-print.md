# Template Print

:::tip Tip
This feature is provided by the commercial plugin `plugin-action-template-print`. Please check the commercial license for details.
:::

<style>
.markdown h4 {
    font-size: 18px;
    font-weight: 500;
}
</style>

## Introduction

The Template Print plugin supports using Word, Excel, and PowerPoint to edit template files (supporting `.docx`, `.xlsx`, `.pptx` formats). By setting placeholders and logical structures in the template, you can dynamically generate files in a predetermined format, such as `.docx`, `.xlsx`, `.pptx`, and PDF files. It can be widely used to generate various business documents, such as quotations, invoices, contracts, etc.

### Key Features

- **Multi-format Support**: Compatible with Word, Excel, and PowerPoint templates to meet different document generation needs.
- **Dynamic Data Filling**: Automatically fills and generates document content through placeholders and logical structures.
- **Flexible Template Management**: Supports adding, editing, deleting, and categorizing templates for easy maintenance and use.
- **Rich Template Syntax**: Supports various template syntaxes such as basic replacement, array access, loops, and conditional output to meet complex document generation needs.
- **Formatter Support**: Provides functions like conditional output, date formatting, and number formatting to enhance document readability and professionalism.
- **Efficient Output Formats**: Supports direct generation of PDF files for easy sharing and printing.

## Installation

<embed src="./install.md"></embed>

## Configuration Instructions

### Activating the Template Print Feature
Template Print currently supports Details blocks and Table blocks. The configuration methods for these two types of blocks are introduced separately below.

#### Details Block

1. **Open the Details Block**:
- In the application, go to the Details block where you want to use the template print feature.

2. **Enter the Configure Actions Menu**:
- At the top of the interface, click the "Configure Actions" menu.

3. **Select "Template Print"**:
- In the dropdown menu, click the "Template Print" option to activate the plugin feature.


![激活模板打印](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)


### Configure Template

1. **Enter the Template Configuration Page**:
- In the configuration menu of the "Template Print" button, select the "Configure template" option.


![模板配置选项](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)


2. **Add a New Template**:
- Click the "Add template" button to go to the template adding page.


![添加模板按钮](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)


3. **Fill in Template Information**:
- In the template form, fill in the template name and select the template type (Word, Excel, PowerPoint).
- Upload the corresponding template file (supports `.docx`, `.xlsx`, `.pptx` formats).


![配置模板名称和文件](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)


4. **Edit and Save the Template**:
- Go to the "Field List" page, copy the fields, and fill them into the template
  
![字段列表](https://static-docs.nocobase.com/20250107141010.png)

  
![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)

- After filling it out, click the "Save" button to complete adding the template.

5. **Template Management**:
- Click the "Use" button on the right side of the template list to activate the template.
- Click the "Edit" button to modify the template name or replace the template file.
- Click the "Download" button to download the configured template file.
- Click the "Delete" button to remove templates that are no longer needed. The system will prompt for confirmation to avoid accidental deletion.
  
![模板管理](https://static-docs.nocobase.com/20250107140436.png)


#### Table Block

The usage for the Table block is basically the same as for the Details block, with the following differences:
1. Supports printing multiple data records: You need to check the records to be printed first, with a maximum of 100 records at a time.
   

![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)


2. Isolated template management: Templates for Table blocks and Details blocks are not interchangeable—because their data structures are different (one is an object, the other is an array).


## Basic Usage

The Template Print plugin provides various syntaxes to flexibly insert dynamic data and logical structures into templates. Below are detailed syntax explanations and usage examples.

### Basic Replacement

Use placeholders in the format `{d.xxx}` for data replacement. For example:

- `{d.title}`: Reads the `title` field from the dataset.
- `{d.date}`: Reads the `date` field from the dataset.

**Example**:

Template content:
```
Dear Customer,

Thank you for purchasing our product: {d.productName}.
Order ID: {d.orderId}
Order Date: {d.orderDate}

We hope you enjoy it!
```

Dataset:
```json
{
  "productName": "Smart Watch",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Rendered result:
```
Dear Customer,

Thank you for purchasing our product: Smart Watch.
Order ID: A123456789
Order Date: 2025-01-01

We hope you enjoy it!
```

### Accessing Child Objects

If the dataset contains child objects, you can access their properties using dot notation.

**Syntax**: `{d.parent.child}`

**Example**:

Dataset:
```json
{
  "customer": {
    "name": "Li Lei",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

Template content:
```
Customer Name: {d.customer.name}
Email Address: {d.customer.contact.email}
Phone Number: {d.customer.contact.phone}
```

Rendered result:
```
Customer Name: Li Lei
Email Address: lilei@example.com
Phone Number: 13800138000
```

### Accessing Arrays

If the dataset contains an array, you can use the reserved keyword `i` to access elements in the array.

**Syntax**: `{d.arrayName[i].field}`

**Example**:

Dataset:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Template content:
```
The first employee's last name is {d.staffs[i=0].lastname}, and first name is {d.staffs[i=0].firstname}
```

Rendered result:
```
The first employee's last name is Anderson, and first name is James
```

---

## Loop Processing

Loop processing is used for repetitive rendering of data in arrays or objects. It identifies the content to be repeated by defining loop start and end markers. Here are some common scenarios.

---

### Traversing Arrays

#### 1. Syntax

- Use the tag `{d.array[i].property}` to define the current loop item, and `{d.array[i+1].property}` to specify the next item to identify the loop area.
- During the loop, the first row (the `[i]` part) is automatically used as a template for repetition; you only need to write the loop example once in the template.

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

---

#### 3. Example: Nested Array Loop

Suitable for cases where arrays are nested within arrays, with unlimited levels of nesting.

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

---

#### 4. Example: Bidirectional Loop (Advanced feature, v4.8.0+)

A bidirectional loop can iterate over both rows and columns simultaneously, suitable for generating complex layouts like comparison tables (Note: some formats are currently officially supported only for DOCX, HTML, MD templates).

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

---

#### 5. Example: Accessing Loop Iterator Values (v4.0.0+)

You can directly access the index value of the current iteration within a loop, which is useful for implementing special formatting requirements.

##### Template Example
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Note: The number of dots indicates the index value of different levels (e.g., `.i` for the current level, `..i` for the parent level). There is currently a reverse order issue, please refer to the official documentation for details.

---

### Traversing Objects

#### 1. Syntax

- For properties in an object, you can use `.att` to get the property name and `.val` to get the property value.
- During iteration, one property item is traversed at a time.

Example syntax format:
```
{d.objectName[i].att}  // Property name
{d.objectName[i].val}  // Property value
```

#### 2. Example: Object Property Traversal

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

---

### Sorting

The sorting feature allows you to sort array data directly within the template.

#### 1. Syntax: Ascending Sort

- Use a property as the sorting basis in the loop tag, with the syntax format:
  ```
  {d.array[sortProperty, i].property}
  {d.array[sortProperty+1, i+1].property}
  ```
- For multi-level sorting, you can separate multiple sorting properties with commas inside the square brackets.

#### 2. Example: Sorting by a Numeric Property

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

#### 3. Example: Multi-property Sorting

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

---

### Filtering

Filtering is used to filter data rows in a loop based on specific conditions.

#### 1. Syntax: Numeric Filtering

- Add a condition (e.g., `age > 19`) in the loop tag, with the syntax format:
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

---

#### 3. Syntax: String Filtering

- Use single quotes to specify string conditions, for example:
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

---

#### 5. Syntax: Filtering the First N Items

- You can use the loop index `i` to filter the first N elements, for example:
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

---

#### 7. Syntax: Excluding the Last N Items

- Use a negative index `i` to represent items from the end, for example:
  - `{d.array[i=-1].property}` gets the last item
  - `{d.array[i, i!=-1].property}` excludes the last item

#### 8. Example: Excluding the Last Item and the Last Two Items

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

---

#### 9. Syntax: Smart Filtering

- A smart condition block can hide an entire row based on complex conditions, for example:
  ```
  {d.array[i].property:ifIN('keyword'):drop(row)}
  ```

#### 10. Example: Smart Filtering

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
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Result
```
People
Model S
Model 3
```
(Note: Rows containing "Falcon" in the template are deleted by the smart filter condition.)

---

### Deduplication

#### 1. Syntax

- By using a custom iterator, you can get unique (non-repeating) items based on the value of a certain property. The syntax is similar to a normal loop, but it automatically ignores duplicate items.

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

---

## Formatters

Formatters are used to convert raw data into easy-to-read text. Formatters are applied to data using a colon (:) and can be chained. The output of each formatter becomes the input for the next. Some formatters support constant or dynamic parameters.

---

### Overview

#### 1. Syntax
The basic form of calling a formatter is:
```
{d.property:formatter1:formatter2(...)}
```  
For example, to convert the string `"JOHN"` to `"John"`, first use `lowerCase` to convert all letters to lowercase, then use `ucFirst` to capitalize the first letter.

#### 2. Example
Data:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Template:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Result
The rendered output is:
```
My name is John. I was born on January 31, 2000.
```

---

### Constant Parameters

#### 1. Syntax
Many formatters support one or more constant parameters, separated by commas and placed in parentheses to modify the output. For example, `:prepend(myPrefix)` will add "myPrefix" before the text.  
Note: If a parameter contains a comma or a space, it must be enclosed in single quotes, like `prepend('my prefix')`.

#### 2. Example
Template example (see usage of specific formatters).

#### 3. Result
The output will have the specified prefix added to the text.

---

### Dynamic Parameters

#### 1. Syntax
Formatters support dynamic parameters, which start with a dot (.) and are not quoted.  
Two methods can be used:
- **Absolute JSON path**: Starts with `d.` or `c.` (root data or complementary data).
- **Relative JSON path**: Starts with a single dot (.), indicating a property lookup from the current parent object.

For example:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
This can also be written as a relative path:
```
{d.subObject.qtyB:add(.qtyC)}
```
To access data at a higher level, use multiple dots:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Example
Data:
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
Usage in template:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Result: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Result: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Result: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Result: 6 (3 + 3)
```

#### 3. Result
The examples yield 8, 8, 28, and 6, respectively.

> **Note:** Using custom iterators or array filters as dynamic parameters is not allowed, such as:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```

---

### Text Formatting

Various formatters are provided for text data. The syntax, examples, and results for each formatter are introduced below.

#### 1. :lowerCase

##### Syntax
Converts all letters to lowercase.

##### Example
```
'My Car':lowerCase()   // Outputs "my car"
'my car':lowerCase()   // Outputs "my car"
null:lowerCase()       // Outputs null
1203:lowerCase()       // Outputs 1203
```

##### Result
The output for each example is as shown in the comments.

---

#### 2. :upperCase

##### Syntax
Converts all letters to uppercase.

##### Example
```
'My Car':upperCase()   // Outputs "MY CAR"
'my car':upperCase()   // Outputs "MY CAR"
null:upperCase()       // Outputs null
1203:upperCase()       // Outputs 1203
```

##### Result
The output for each example is as shown in the comments.

---

#### 3. :ucFirst

##### Syntax
Converts only the first letter of a string to uppercase, leaving the rest unchanged.

##### Example
```
'My Car':ucFirst()     // Outputs "My Car"
'my car':ucFirst()     // Outputs "My car"
null:ucFirst()         // Outputs null
undefined:ucFirst()    // Outputs undefined
1203:ucFirst()         // Outputs 1203
```

##### Result
See the comments for the output results.

---

#### 4. :ucWords

##### Syntax
Converts the first letter of each word in a string to uppercase.

##### Example
```
'my car':ucWords()     // Outputs "My Car"
'My cAR':ucWords()     // Outputs "My CAR"
null:ucWords()         // Outputs null
undefined:ucWords()    // Outputs undefined
1203:ucWords()         // Outputs 1203
```

##### Result
The output results are as shown in the examples.

---

#### 5. :print(message)

##### Syntax
Always returns the specified message, regardless of the original data, used as a fallback formatter.  
Parameter:
- message: The text to be printed

##### Example
```
'My Car':print('hello!')   // Outputs "hello!"
'my car':print('hello!')   // Outputs "hello!"
null:print('hello!')       // Outputs "hello!"
1203:print('hello!')       // Outputs "hello!"
```

##### Result
All examples return the specified string "hello!".

---

#### 6. :printJSON

##### Syntax
Converts an object or array into a JSON formatted string.

##### Example
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Outputs "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Outputs ""my car""
```

##### Result
The output in the example is the converted JSON string.

---

#### 7. :unaccent

##### Syntax
Removes accent marks from text, converting it to an unaccented format.

##### Example
```
'crÃ¨me brulÃ©e':unaccent()   // Outputs "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Outputs "CREME BRULEE"
'Ãªtre':unaccent()           // Outputs "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Outputs "euieea"
```

##### Result
The output of each example has the accent marks removed.

---

#### 8. :convCRLF

##### Syntax
Converts carriage return and line feed characters (`
` or `
`) in text to line break markers in the document, suitable for formats like DOCX, PPTX, ODT, ODP, and ODS.  
Note: When `:html` is used before the `:convCRLF` formatter, `
` is converted to a `<br>` tag.

##### Example
```
// For ODT format:
'my blue 
 car':convCRLF()    // Outputs "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Outputs "my blue <text:line-break/> car"

// For DOCX format:
'my blue 
 car':convCRLF()    // Outputs "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Outputs "my blue </w:t><w:br/><w:t> car"
```

##### Result
The output shows line break markers according to the document format.

---

#### 9. :substr(begin, end, wordMode)

##### Syntax
Performs a substring operation on a string, starting from the `begin` index (0-based) and ending before the `end` index.  
The optional parameter `wordMode` (boolean or `last`) controls whether to keep words intact and not break in the middle of a word.

##### Example
```
'foobar':substr(0, 3)            // Outputs "foo"
'foobar':substr(1)               // Outputs "oobar"
'foobar':substr(-2)              // Outputs "ar"
'foobar':substr(2, -1)           // Outputs "oba"
'abcd efg hijklm':substr(0, 11, true)  // Outputs "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Outputs "abcd efg "
```

##### Result
The output is the corresponding string fragment based on the parameters.

---

#### 10. :split(delimiter)

##### Syntax
Splits a string into an array using the specified `delimiter`.  
Parameter:
- delimiter: The delimiter string

##### Example
```
'abcdefc12':split('c')    // Outputs ["ab", "def", "12"]
1222.1:split('.')         // Outputs ["1222", "1"]
'ab/cd/ef':split('/')      // Outputs ["ab", "cd", "ef"]
```

##### Result
The example results are the arrays after splitting.

---

#### 11. :padl(targetLength, padString)

##### Syntax
Pads the left side of a string with a specified character until the final string reaches `targetLength`.  
If the target length is less than the original string length, the original string is returned.  
Parameters:
- targetLength: The target total length
- padString: The string to pad with, defaults to a space

##### Example
```
'abc':padl(10)              // Outputs "       abc"
'abc':padl(10, 'foo')       // Outputs "foofoofabc"
'abc':padl(6, '123465')     // Outputs "123abc"
'abc':padl(8, '0')          // Outputs "00000abc"
'abc':padl(1)               // Outputs "abc"
```

##### Result
The output of each example is the padded string.

---

#### 12. :padr(targetLength, padString)

##### Syntax
Pads the right side of a string with a specified character until the final string reaches `targetLength`.  
Parameters are the same as above.

##### Example
```
'abc':padr(10)              // Outputs "abc       "
'abc':padr(10, 'foo')       // Outputs "abcfoofoof"
'abc':padr(6, '123465')     // Outputs "abc123"
'abc':padr(8, '0')          // Outputs "abc00000"
'abc':padr(1)               // Outputs "abc"
```

##### Result
The output is the right-padded string.

---

#### 13. :ellipsis(maximum)

##### Syntax
If the text exceeds the specified number of characters, an ellipsis "..." is added at the end.  
Parameter:
- maximum: The maximum number of characters allowed

##### Example
```
'abcdef':ellipsis(3)      // Outputs "abc..."
'abcdef':ellipsis(6)      // Outputs "abcdef"
'abcdef':ellipsis(10)     // Outputs "abcdef"
```

##### Result
The example results are the truncated text with an ellipsis.

---

#### 14. :prepend(textToPrepend)

##### Syntax
Adds a specified prefix to the text.  
Parameter:
- textToPrepend: The prefix text

##### Example
```
'abcdef':prepend('123')     // Outputs "123abcdef"
```

##### Result
The output is the string with the added prefix.

---

#### 15. :append(textToAppend)

##### Syntax
Adds a specified suffix to the text.  
Parameter:
- textToAppend: The suffix text

##### Example
```
'abcdef':append('123')      // Outputs "abcdef123"
```

##### Result
The output is the string with the added suffix.

---

#### 16. :replace(oldText, newText)

##### Syntax
Replaces all occurrences of `oldText` in the text with `newText`.  
Parameters:
- oldText: The old text to be replaced
- newText: The new text to replace with  
  Note: If newText is null, it means the matched items will be deleted.

##### Example
```
'abcdef abcde':replace('cd', 'OK')    // Outputs "abOKef abOKe"
'abcdef abcde':replace('cd')          // Outputs "abef abe"
'abcdef abcde':replace('cd', null)      // Outputs "abef abe"
'abcdef abcde':replace('cd', 1000)      // Outputs "ab1000ef ab1000e"
```

##### Result
The output is the string after replacement.

---

#### 17. :len

##### Syntax
Returns the length of a string or an array.

##### Example
```
'Hello World':len()     // Outputs 11
'':len()                // Outputs 0
[1,2,3,4,5]:len()       // Outputs 5
[1,'Hello']:len()       // Outputs 2
```

##### Result
The output is the corresponding length value.

---

#### 18. :t

##### Syntax
Translates text according to a translation dictionary.  
Examples and results depend on the actual translation dictionary configuration.

---

#### 19. :preserveCharRef

##### Syntax
By default, certain illegal characters in XML (like &, >, <, etc.) are removed. This formatter preserves character references (e.g., `&#xa7;` remains unchanged), suitable for specific XML generation scenarios.  
Examples and results depend on the specific use case.

---

### Number Formatting

#### 1. :formatN(precision)

##### Syntax
Formats a number according to localization settings.  
Parameter:
- precision: The number of decimal places  
  For ODS/XLSX formats, the number of decimal places displayed is determined by the text editor; other formats depend on this parameter.

##### Example
```
// Example environment: API options { "lang": "en-us" }
'10':formatN()         // Outputs "10.000"
'1000.456':formatN()   // Outputs "1,000.456"
```

##### Result
The number is outputted according to the specified precision and localization format.

---

#### 2. :round(precision)

##### Syntax
Rounds a number to the specified number of decimal places.

##### Example
```
10.05123:round(2)      // Outputs 10.05
1.05:round(1)          // Outputs 1.1
```

##### Result
The output is the rounded number.

---

#### 3. :add(value)

##### Syntax
Adds the specified value to the current number.  
Parameter:
- value: The number to add

##### Example
```
1000.4:add(2)         // Outputs 1002.4
'1000.4':add('2')      // Outputs 1002.4
```

##### Result
The output is the number after addition.

---

#### 4. :sub(value)

##### Syntax
Subtracts the specified value from the current number.  
Parameter:
- value: The number to subtract

##### Example
```
1000.4:sub(2)         // Outputs 998.4
'1000.4':sub('2')      // Outputs 998.4
```

##### Result
The output is the number after subtraction.

---

#### 5. :mul(value)

##### Syntax
Multiplies the current number by the specified value.  
Parameter:
- value: The multiplier

##### Example
```
1000.4:mul(2)         // Outputs 2000.8
'1000.4':mul('2')      // Outputs 2000.8
```

##### Result
The output is the number after multiplication.

---

#### 6. :div(value)

##### Syntax
Divides the current number by the specified value.  
Parameter:
- value: The divisor

##### Example
```
1000.4:div(2)         // Outputs 500.2
'1000.4':div('2')      // Outputs 500.2
```

##### Result
The output is the number after division.

---

#### 7. :mod(value)

##### Syntax
Calculates the modulus (remainder) of the current number with respect to the specified value.  
Parameter:
- value: The modulus

##### Example
```
4:mod(2)              // Outputs 0
3:mod(2)              // Outputs 1
```

##### Result
The output is the result of the modulo operation.

---

#### 8. :abs

##### Syntax
Returns the absolute value of a number.

##### Example
```
-10:abs()             // Outputs 10
-10.54:abs()          // Outputs 10.54
10.54:abs()           // Outputs 10.54
'-200':abs()          // Outputs 200
```

##### Result
The output is the absolute value.

---

#### 9. :ceil

##### Syntax
Rounds up to the nearest integer, i.e., returns the smallest integer greater than or equal to the current number.

##### Example
```
10.05123:ceil()       // Outputs 11
1.05:ceil()           // Outputs 2
-1.05:ceil()          // Outputs -1
```

##### Result
The output is the rounded-up integer.

---

#### 10. :floor

##### Syntax
Rounds down to the nearest integer, i.e., returns the largest integer less than or equal to the current number.

##### Example
```
10.05123:floor()      // Outputs 10
1.05:floor()          // Outputs 1
-1.05:floor()         // Outputs -2
```

##### Result
The output is the rounded-down integer.

---

#### 11. :int

##### Syntax
Converts a number to an integer (not recommended).

##### Example & Result
Depends on the specific conversion.

---

#### 12. :toEN

##### Syntax
Converts a number to English format (decimal point is '.'), not recommended.

##### Example & Result
Depends on the specific conversion.

---

#### 13. :toFixed

##### Syntax
Converts a number to a string, keeping only the specified number of decimal places, not recommended.

##### Example & Result
Depends on the specific conversion.

---

#### 14. :toFR

##### Syntax
Converts a number to French format (decimal point is ','), not recommended.

##### Example & Result
Depends on the specific conversion.

---

### Currency Formatting

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Syntax
Formats a currency number, allowing specification of decimal places or a specific output format.  
Parameters:
- precisionOrFormat: Optional parameter, can be a number (specifying decimal places) or a specific format identifier:
  - Integer: Changes the default decimal precision
  - `'M'`: Outputs only the main currency name
  - `'L'`: Outputs the number with the currency symbol (default)
  - `'LL'`: Outputs the number with the main currency name
- targetCurrency: Optional, target currency code (uppercase, e.g., USD, EUR), overrides global settings

##### Example
```
// Example environment: API options { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Outputs "$2,000.91"
'1000.456':formatC('M')    // Outputs "dollars"
'1':formatC('M')           // Outputs "dollar"
'1000':formatC('L')        // Outputs "$2,000.00"
'1000':formatC('LL')       // Outputs "2,000.00 dollars"

// French example (with different environment settings):
'1000.456':formatC()      // Outputs "2 000,91 ..."  
'1000.456':formatC()      // Outputs "1 000,46 €" when source and target currencies are the same
```

##### Result
The output result depends on the API options and exchange rate settings.

---

#### 2. :convCurr(target, source)

##### Syntax
Converts a number from one currency to another. Exchange rates can be passed via API options or set globally.  
If no parameters are specified, it automatically converts from `options.currencySource` to `options.currencyTarget`.  
Parameters:
- target: Optional, target currency code (defaults to `options.currencyTarget`)
- source: Optional, source currency code (defaults to `options.currencySource`)

##### Example
```
// Example environment: API options { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Outputs 20
1000:convCurr()            // Outputs 2000
1000:convCurr('EUR')        // Outputs 1000
1000:convCurr('USD')        // Outputs 2000
1000:convCurr('USD', 'USD') // Outputs 1000
```

##### Result
The output is the converted currency value.

---

### Date Formatting

#### 1. :formatD(patternOut, patternIn)

##### Syntax
Formats a date, accepting an output format pattern `patternOut` and an input format pattern `patternIn` (defaults to ISO 8601).  
Timezone and language can be adjusted via `options.timezone` and `options.lang`.

##### Example
```
// Example environment: API options { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Outputs 01/31/2016
'20160131':formatD(LL)     // Outputs January 31, 2016
'20160131':formatD(LLLL)   // Outputs Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Outputs Sunday

// French example:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Outputs mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Outputs dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Outputs dimanche 14 septembre 2014 19:27
```

##### Result
The output is a date string in the specified format.

---

#### 2. :addD(amount, unit, patternIn)

##### Syntax
Adds a specified amount of time to a date. Supported units: day, week, month, quarter, year, hour, minute, second, millisecond.  
Parameters:
- amount: The amount to add
- unit: The time unit (case-insensitive)
- patternIn: Optional, input format, defaults to ISO8601

##### Example
```
// Example environment: API options { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Outputs "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Outputs "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Outputs "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Outputs "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Outputs "2016-04-30T00:00:00.000Z"
```

##### Result
The output is the new date after adding the time.

---

#### 3. :subD(amount, unit, patternIn)

##### Syntax
Subtracts a specified amount of time from a date. Parameters are the same as `addD`.

##### Example
```
// Example environment: API options { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Outputs "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Outputs "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Outputs "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Outputs "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Outputs "2015-10-31T00:00:00.000Z"
```

##### Result
The output is the new date after subtracting the time.

---

#### 4. :startOfD(unit, patternIn)

##### Syntax
Sets the date to the beginning of a specified time unit.  
Parameters:
- unit: The time unit
- patternIn: Optional, input format

##### Example
```
// Example environment: API options { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Outputs "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Outputs "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Outputs "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Outputs "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Outputs "2016-01-01T00:00:00.000Z"
```

##### Result
The output is a date string at the start of the specified time unit.

---

#### 5. :endOfD(unit, patternIn)

##### Syntax
Sets the date to the end of a specified time unit.  
Parameters are the same as above.

##### Example
```
// Example environment: API options { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Outputs "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Outputs "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Outputs "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Outputs "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Outputs "2016-01-31T23:59:59.999Z"
```

##### Result
The output is a date string at the end of the specified time unit.

---

#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Syntax
Calculates the difference between two dates and outputs it in the specified unit. Supported output units include:
- `day(s)` or `d`
- `week(s)` or `w`
- `quarter(s)` or `Q`
- `month(s)` or `M`
- `year(s)` or `y`
- `hour(s)` or `h`
- `minute(s)` or `m`
- `second(s)` or `s`
- `millisecond(s)` or `ms` (default unit)

Parameters:
- toDate: The target date
- unit: The output unit
- patternFromDate: Optional, start date format
- patternToDate: Optional, target date format

##### Example
```
'20101001':diffD('20101201')              // Outputs 5270400000
'20101001':diffD('20101201', 'second')      // Outputs 5270400
'20101001':diffD('20101201', 's')           // Outputs 5270400
'20101001':diffD('20101201', 'm')           // Outputs 87840
'20101001':diffD('20101201', 'h')           // Outputs 1464
'20101001':diffD('20101201', 'weeks')       // Outputs 8
'20101001':diffD('20101201', 'days')        // Outputs 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Outputs 5270400000
```

##### Result
The output is the time difference between the two dates, converted to the specified unit.

---

#### 7. :convDate(patternIn, patternOut)

##### Syntax
Converts a date from one format to another. (Not recommended)  
Parameters:
- patternIn: Input date format
- patternOut: Output date format

##### Example
```
// Example environment: API options { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Outputs "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Outputs "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Outputs "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Outputs "Sunday"
1410715640:convDate('X', 'LLLL')          // Outputs "Sunday, September 14, 2014 7:27 PM"
// French example:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Outputs "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Outputs "dimanche"
```

##### Result
The output is the converted date string.

---

#### 8. Date Format Patterns
Common date format descriptions (refer to DayJS documentation):
- `X`: Unix timestamp (seconds), e.g., 1360013296
- `x`: Unix millisecond timestamp, e.g., 1360013296123
- `YY`: Two-digit year, e.g., 18
- `YYYY`: Four-digit year, e.g., 2018
- `M`, `MM`, `MMM`, `MMMM`: Month (number, two-digit, abbreviation, full name)
- `D`, `DD`: Day of the month (number, two-digit)
- `d`, `dd`, `ddd`, `dddd`: Day of the week (number, minimal, short, full name)
- `H`, `HH`, `h`, `hh`: Hour (24-hour or 12-hour format)
- `m`, `mm`: Minute
- `s`, `ss`: Second
- `SSS`: Millisecond (3 digits)
- `Z`, `ZZ`: UTC offset, e.g., +05:00 or +0500
- `A`, `a`: AM/PM
- `Q`: Quarter (1-4)
- `Do`: Day of month with ordinal, e.g., 1st, 2nd, ...
- For other formats, see the full documentation.  
  Additionally, there are language-based localized formats: e.g., `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, etc.

---

### Interval Formatting

#### 1. :formatI(patternOut, patternIn)

##### Syntax
Formats a duration or interval. Supported output formats include:
- `human+`, `human` (suitable for human-readable display)
- And units like `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (or their abbreviations).

Parameters:
- patternOut: Output format (e.g., `'second'`, `'human+'`)
- patternIn: Optional, input unit (e.g., `'milliseconds'`, `'s'`)

##### Example
```
// Example environment: API options { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Outputs 2
2000:formatI('seconds')      // Outputs 2
2000:formatI('s')            // Outputs 2
3600000:formatI('minute')    // Outputs 60
3600000:formatI('hour')      // Outputs 1
2419200000:formatI('days')   // Outputs 28

// French example:
2000:formatI('human')        // Outputs "quelques secondes"
2000:formatI('human+')       // Outputs "dans quelques secondes"
-2000:formatI('human+')      // Outputs "il y a quelques secondes"

// English example:
2000:formatI('human')        // Outputs "a few seconds"
2000:formatI('human+')       // Outputs "in a few seconds"
-2000:formatI('human+')      // Outputs "a few seconds ago"

// Unit conversion example:
60:formatI('ms', 'minute')   // Outputs 3600000
4:formatI('ms', 'weeks')      // Outputs 2419200000
'P1M':formatI('ms')          // Outputs 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Outputs 10296.085
```

##### Result
The output is displayed as the corresponding duration or interval based on the input value and unit conversion.

---

### Array Formatting

#### 1. :arrayJoin(separator, index, count)

##### Syntax
Joins an array of strings or numbers into a single string.  
Parameters:
- separator: The separator (defaults to a comma `,`)
- index: Optional, starts joining from this index
- count: Optional, the number of items to join starting from `index` (can be negative, indicating counting from the end)

##### Example
```
['homer','bart','lisa']:arrayJoin()              // Outputs "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Outputs "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Outputs "homerbartlisa"
[10,50]:arrayJoin()                               // Outputs "10, 50"
[]:arrayJoin()                                    // Outputs ""
null:arrayJoin()                                  // Outputs null
{}:arrayJoin()                                    // Outputs {}
20:arrayJoin()                                    // Outputs 20
undefined:arrayJoin()                             // Outputs undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Outputs "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Outputs "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Outputs "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Outputs "homerbart"
```

##### Result
The output is the joined string based on the parameters.

---

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Syntax
Converts an array of objects into a string, without handling nested objects or arrays.  
Parameters:
- objSeparator: Separator between objects (defaults to `, `)
- attSeparator: Separator between object attributes (defaults to `:`)
- attributes: Optional, a list of object attributes to output

##### Example
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Outputs "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Outputs "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Outputs "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Outputs "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Outputs "2:homer"

['homer','bart','lisa']:arrayMap()    // Outputs "homer, bart, lisa"
[10,50]:arrayMap()                    // Outputs "10, 50"
[]:arrayMap()                         // Outputs ""
null:arrayMap()                       // Outputs null
{}:arrayMap()                         // Outputs {}
20:arrayMap()                         // Outputs 20
undefined:arrayMap()                  // Outputs undefined
```

##### Result
The output is the joined string, ignoring nested content within objects.

---

#### 3. :count(start)

##### Syntax
Counts the row number in an array and outputs the current row number.  
For example:
```
{d[i].id:count()}
```  
Regardless of the value of `id`, it outputs the current row count.  
Since v4.0.0, this formatter has been internally replaced with `:cumCount`.

Parameter:
- start: Optional, the starting value for the count

##### Example & Result
When used, the output row number will be displayed according to the order of elements in the array.

---

## Conditional Logic

Conditional logic allows you to dynamically control the display or hiding of content in a document based on data values. Three main types of conditional syntax are provided:

- **Inline Conditions**: Directly output text (or replace it with other text).
- **Conditional Blocks**: Show or hide a section of the document, suitable for multiple tags, paragraphs, tables, etc.
- **Smart Conditions**: Remove or keep a target element (like a row, paragraph, image, etc.) with a single tag, offering a more concise syntax.

All conditions start with a logical evaluation formatter (e.g., ifEQ, ifGT, etc.), followed by an action formatter (e.g., show, elseShow, drop, keep, etc.).

---

### Overview

The logical operators and action formatters supported in conditional logic include:

- **Logical Operators**
  - **ifEQ(value)**: Checks if the data is equal to the specified value
  - **ifNE(value)**: Checks if the data is not equal to the specified value
  - **ifGT(value)**: Checks if the data is greater than the specified value
  - **ifGTE(value)**: Checks if the data is greater than or equal to the specified value
  - **ifLT(value)**: Checks if the data is less than the specified value
  - **ifLTE(value)**: Checks if the data is less than or equal to the specified value
  - **ifIN(value)**: Checks if the data is included in an array or string
  - **ifNIN(value)**: Checks if the data is not included in an array or string
  - **ifEM()**: Checks if the data is empty (e.g., null, undefined, empty string, empty array, or empty object)
  - **ifNEM()**: Checks if the data is not empty
  - **ifTE(type)**: Checks if the data type is equal to the specified type (e.g., "string", "number", "boolean", etc.)
  - **and(value)**: Logical "AND", used to connect multiple conditions
  - **or(value)**: Logical "OR", used to connect multiple conditions

- **Action Formatters**
  - **:show(text) / :elseShow(text)**: Used for inline conditions, directly outputs the specified text
  - **:hideBegin / :hideEnd** and **:showBegin / :showEnd**: Used for conditional blocks, to hide or show a block of the document
  - **:drop(element) / :keep(element)**: Used for smart conditions, to remove or keep a specified document element

The detailed syntax, examples, and results for each usage are introduced below.

---

### Inline Conditions

#### 1. :show(text) / :elseShow(text)

##### Syntax
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternativeText)}
```

##### Example
Assuming the data is:
```json
{
  "val2": 2,
  "val5": 5
}
```
The template is as follows:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Result
```
val2 = 2
val2 = low
val5 = high
```

---

#### 2. Switch Case (Multiple Conditional Checks)

##### Syntax
Construct a switch-case-like structure using consecutive conditional formatters:
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(defaultResult)}
```
Or achieve it with the `or` operator:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(defaultResult)}
```

##### Example
Data:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Template:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Result
```
val1 = A
val2 = B
val3 = C
```

---

#### 3. Multi-variable Conditional Checks

##### Syntax
Use the logical operators `and`/`or` to test multiple variables:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternativeResult)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternativeResult)}
```

##### Example
Data:
```json
{
  "val2": 2,
  "val5": 5
}
```
Template:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Result
```
and = KO
or = OK
```

---

### Logical Operators and Formatters

The formatters introduced in the following sections all use the inline condition form, with the syntax format:
```
{data:formatter(parameter):show(text):elseShow(alternativeText)}
```

#### 1. :and(value)

##### Syntax
```
{data:ifEQ(value):and(newDataOrCondition):ifGT(otherValue):show(text):elseShow(alternativeText)}
```

##### Example
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Result
If `d.car` is equal to `'delorean'` and `d.speed` is greater than 80, it outputs `TravelInTime`; otherwise, it outputs `StayHere`.

---

#### 2. :or(value)

##### Syntax
```
{data:ifEQ(value):or(newDataOrCondition):ifGT(otherValue):show(text):elseShow(alternativeText)}
```

##### Example
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Result
If `d.car` is equal to `'delorean'` or `d.speed` is greater than 80, it outputs `TravelInTime`; otherwise, it outputs `StayHere`.

---

#### 3. :ifEM()

##### Syntax
```
{data:ifEM():show(text):elseShow(alternativeText)}
```

##### Example
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Result
For `null` or an empty array, it outputs `Result true`; otherwise, it outputs `Result false`.

---

#### 4. :ifNEM()

##### Syntax
```
{data:ifNEM():show(text):elseShow(alternativeText)}
```

##### Example
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Result
For non-empty data (like the number 0 or the string 'homer'), it outputs `Result true`; for empty data, it outputs `Result false`.

---

#### 5. :ifEQ(value)

##### Syntax
```
{data:ifEQ(value):show(text):elseShow(alternativeText)}
```

##### Example
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Result
If the data is equal to the specified value, it outputs `Result true`, otherwise `Result false`.

---

#### 6. :ifNE(value)

##### Syntax
```
{data:ifNE(value):show(text):elseShow(alternativeText)}
```

##### Example
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result false`, the second outputs `Result true`.

---

#### 7. :ifGT(value)

##### Syntax
```
{data:ifGT(value):show(text):elseShow(alternativeText)}
```

##### Example
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result true`, the second outputs `Result false`.

---

#### 8. :ifGTE(value)

##### Syntax
```
{data:ifGTE(value):show(text):elseShow(alternativeText)}
```

##### Example
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result true`, the second outputs `Result false`.

---

#### 9. :ifLT(value)

##### Syntax
```
{data:ifLT(value):show(text):elseShow(alternativeText)}
```

##### Example
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result true`, the second outputs `Result false`.

---

#### 10. :ifLTE(value)

##### Syntax
```
{data:ifLTE(value):show(text):elseShow(alternativeText)}
```

##### Example
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result true`, the second outputs `Result false`.

---

#### 11. :ifIN(value)

##### Syntax
```
{data:ifIN(value):show(text):elseShow(alternativeText)}
```

##### Example
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Result
Both examples output `Result true` (because the string contains 'is', and the array contains 2).

---

#### 12. :ifNIN(value)

##### Syntax
```
{data:ifNIN(value):show(text):elseShow(alternativeText)}
```

##### Example
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result false` (because the string contains 'is'), and the second outputs `Result false` (because the array contains 2).

---

#### 13. :ifTE(type)

##### Syntax
```
{data:ifTE('type'):show(text):elseShow(alternativeText)}
```

##### Example
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result true` ('homer' is a string), and the second outputs `Result true` (10.5 is a number).

---

### Conditional Blocks

Conditional blocks are used to show or hide a section of the document, often used to wrap multiple tags or entire paragraphs of text.

#### 1. :showBegin / :showEnd

##### Syntax
```
{data:ifEQ(condition):showBegin}
Document block content
{data:showEnd}
```

##### Example
Data:
```json
{
  "toBuy": true
}
```
Template:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Result
When the condition is true, the content in the middle is displayed:
```
Banana
Apple
Pineapple
Grapes
```

---

#### 2. :hideBegin / :hideEnd

##### Syntax
```
{data:ifEQ(condition):hideBegin}
Document block content
{data:hideEnd}
```

##### Example
Data:
```json
{
  "toBuy": true
}
```
Template:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Result
When the condition is true, the content in the middle is hidden, and the output is:
```
Banana
Grapes
```

---

## Calculations

## Advanced Features

### Pagination

#### 1. Page Number Update

##### Syntax
Insert it directly in the Office software.

##### Example
In Microsoft Word:
- Use "Insert → Page Number" feature  
  In LibreOffice:
- Use "Insert → Field → Page Number" feature

##### Result
In the generated report, the page numbers on each page will be updated automatically.

---

#### 2. Table of Contents Generation

##### Syntax
Insert it directly in the Office software.

##### Example
In Microsoft Word:
- Use "Insert → Index and Tables → Table of Contents" feature  
  In LibreOffice:
- Use "Insert → Table of Contents and Index → Table of Contents, Index or Bibliography" feature

##### Result
The table of contents in the generated report will be automatically updated based on the document's content.

---

#### 3. Repeating Table Headers

##### Syntax
Insert it directly in the Office software.

##### Example
In Microsoft Word:
- Right-click the table header → Table Properties → Check "Repeat as header row at the top of each page"  
  In LibreOffice:
- Right-click the table header → Table Properties → Text Flow tab → Check "Repeat heading"

##### Result
When a table spans multiple pages, the header row will automatically repeat at the top of each page.

---

### Internationalization (i18n)

#### 1. Static Text Translation

##### Syntax
Use the `{t(text)}` tag for internationalization of static text:
```
{t(meeting)}
```

##### Example
In the template:
```
{t(meeting)} {t(apples)}
```
Provide the corresponding translations in JSON data or an external localization dictionary (e.g., for "fr-fr"), such as "meeting" → "rendez-vous", "apples" → "Pommes".

##### Result
When the report is generated, the text will be replaced with the corresponding translation based on the target language.

---

#### 2. Dynamic Text Translation

##### Syntax
For data content, you can use the `:t` formatter, for example:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Example
In the template:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
Provide the corresponding translations in the JSON data and localization dictionary.

##### Result
Based on the conditional logic, it will output "lundi" or "mardi" (using the target language as an example).

---

### Key-Value Mapping

#### 1. Enum Conversion (:convEnum)

##### Syntax
```
{data:convEnum(enumName)}
```
For example:
```
0:convEnum('ORDER_STATUS')
```

##### Example
Passed in API options example:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
In the template:
```
0:convEnum('ORDER_STATUS')
```

##### Result
Outputs "pending"; if the index is out of the enum range, the original value is outputted.

---

### Dynamic Images
:::info
Currently supports XLSX, DOCX file types.
:::
You can insert "dynamic images" into your document templates, meaning that placeholder images in the template will be automatically replaced with real images based on the data during rendering. This process is very simple and only requires:

1. Inserting a temporary image as a placeholder

2. Editing the "Alt Text" of the image to set the field tag

3. Rendering the document, and the system will automatically replace it with the actual image

Below, we will explain the operations for DOCX and XLSX with specific examples.


#### Inserting Dynamic Images in DOCX Files
##### Single Image Replacement

1. Open your DOCX template and insert a temporary image (it can be any placeholder image, such as a [solid blue image](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png))

:::info
**Image Format Notes**

- Currently, placeholder images only support PNG type images. We recommend using our provided example image [solid blue image](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png).
- The target rendered images only support PNG, JPG, JPEG. Other image types may fail to render.

**Image Size Notes**

For both DOCX and XLSX, the size of the final rendered image will follow the dimensions of the temporary image in the template. This means the actual replaced image will automatically scale to the same size as the placeholder you inserted. If you want the rendered image to be 150×150, please use a temporary image in the template and adjust it to that size.
:::

2. Right-click on this image, edit its "Alt Text", and enter the image field tag you want to insert, for example, `{d.imageUrl}`:
   

![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)


3. Render with the following example data:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. After rendering, the temporary image will be replaced with the actual image:


![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)


##### Multiple Image Loop Replacement

If you want to insert a group of images in the template, such as a product list, you can also achieve this through a loop. The steps are as follows:
1. Assume your data is as follows:
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

2. In the DOCX template, set up a loop area, and insert a temporary image in each loop item with the alt text set to `{d.products[i].imageUrl}`, as shown below:


![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)


3. After rendering, all temporary images will be replaced by their respective data images:
   

![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)


#### Inserting Dynamic Images in XLSX Files

The operation in an Excel template (XLSX) is basically the same, just note the following points:

1. After inserting an image, make sure you have selected "Picture in Cell", not the image floating above the cell.


![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)


2. With the cell selected, click to view "Alt Text" to enter the field tag, such as `{d.imageUrl}`.

### Barcodes
:::info
Currently supports XLSX, DOCX file types.
:::

#### Generating Barcodes (e.g., QR Codes)

The method for generating barcodes is the same as for dynamic images, requiring just three steps:

1. Insert a temporary image in the template to mark the position of the barcode

2. Edit the "Alt Text" of the image and write the barcode format field tag, for example, `{d.code:barcode(qrcode)}`, where `qrcode` is the type of barcode (see the supported list below)


![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)


3. After rendering, this placeholder image will be automatically replaced with the corresponding barcode image:
   

![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)


#### Supported Barcode Types

| Barcode Name | Type   |
| -------- | ------ |
| QR Code   | qrcode |



## FAQ and Solutions

### 1. Empty columns and cells in Excel templates disappear in the rendered result

**Problem Description**: In an Excel template, if a cell has no content or style, it may be removed during rendering, causing the final document to be missing that cell.

**Solution**:

- **Fill with background color**: Fill the empty cells in the target area with a background color to ensure the cells remain visible during the rendering process.
- **Insert a space**: Insert a space character into the empty cell. Even without actual content, this will maintain the cell's structure.
- **Set borders**: Add border styles to the table to enhance the boundaries of the cells and prevent them from disappearing during rendering.

**Example**:

In the Excel template, set a light gray background for all target cells and insert spaces in the empty cells.

### 2. Merged cells are invalid in the output

**Problem Description**: When using the loop feature to output a table, if the template contains merged cells, it may lead to abnormal rendering results, such as the loss of the merge effect or data misalignment.

**Solution**:

- **Avoid using merged cells**: Try to avoid using merged cells in tables that are outputted in a loop to ensure correct data rendering.
- **Use "Center Across Selection"**: If you need text to be centered horizontally across multiple cells, use the "Center Across Selection" feature instead of merging cells.
- **Limit the position of merged cells**: If you must use merged cells, only merge them at the top or right side of the table. Avoid merging at the bottom or left side to prevent the loss of the merge effect during rendering.



### 3. Content below a loop rendering area causes format corruption

**Problem Description**: In an Excel template, if there is other content (e.g., order summary, notes) below a looping area that grows dynamically based on data entries (e.g., order details), the rows generated by the loop will expand downwards during rendering, directly overwriting or pushing the static content below, leading to format corruption and content overlap in the final document.

**Solution**:

  * **Adjust the layout, place the looping area at the bottom**: This is the most recommended method. Place the table area that needs to be rendered in a loop at the bottom of the entire worksheet. Move all information that was originally below it, such as summaries and signatures, above the looping area. This way, the loop data can expand downwards freely without affecting any other elements.
  * **Reserve enough blank rows**: If content must be placed below the looping area, you can estimate the maximum number of rows the loop might generate and manually insert enough blank rows between the looping area and the content below as a buffer. However, this method has risks; if the actual data exceeds the estimated number of rows, the problem will reappear.
  * **Use a Word template**: If the layout requirements are complex and cannot be solved by adjusting the Excel structure, consider using a Word document as the template. In Word, when the number of rows in a table increases, it automatically pushes the content below it downwards, avoiding content overlap issues, making it more suitable for generating such dynamic documents.

**Example**:

**Incorrect way**: Placing the "Order Summary" information immediately below the looping "Order Details" table.

![20250820080712](https://static-docs.nocobase.com/20250820080712.png)


**Correct way 1 (Adjust layout)**: Move the "Order Summary" information above the "Order Details" table, making the looping area the bottom element of the page.

![20250820082226](https://static-docs.nocobase.com/20250820082226.png)


**Correct way 2 (Reserve blank rows)**: Reserve a large number of blank rows between "Order Details" and "Order Summary" to ensure there is enough space for the loop content to expand.

![20250820081510](https://static-docs.nocobase.com/20250820081510.png)


**Correct way 3**: Use a Word template.






### 4. Error message appears during template rendering

**Problem Description**: During the template rendering process, the system displays an error message, causing the rendering to fail.

**Possible Causes**:

- **Placeholder error**: The placeholder name does not match the dataset field or there is a syntax error.
- **Missing data**: The dataset is missing a field referenced in the template.
- **Improper use of formatters**: Incorrect formatter parameters or an unsupported formatter type.

**Solution**:

- **Check placeholders**: Ensure that the placeholder names in the template match the field names in the dataset and that the syntax is correct.
- **Validate the dataset**: Confirm that the dataset contains all the fields referenced in the template and that the data format is correct.
- **Adjust formatters**: Check the usage of formatters, ensure the parameters are correct, and use supported formatter types.

**Example**:

**Incorrect Template**:
```
Order ID: {d.orderId}
Order Date: {d.orderDate:format('YYYY/MM/DD')}
Total Amount: {d.totalAmount:format('0.00')}
```

**Dataset**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Missing totalAmount field
}
```

**Solution**: Add the `totalAmount` field to the dataset, or remove the reference to `totalAmount` from the template.