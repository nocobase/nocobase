## Conditional Statements

Conditional statements allow you to dynamically control the display or hiding of content in the document based on data values. There are three main ways to write conditions:

- **Inline conditions**: Directly output text (or replace it with other text).
- **Conditional blocks**: Display or hide a section of the document, suitable for multiple tags, paragraphs, tables, etc.
- **Smart conditions**: Directly remove or keep target elements (like rows, paragraphs, images, etc.) with a single tag, for a more concise syntax.

All conditions begin with a logical evaluation formatter (e.g., ifEQ, ifGT, etc.), followed by action formatters (such as show, elseShow, drop, keep, etc.).


### Overview

The logical operators and action formatters supported in conditional statements include:

- **Logical Operators**
  - **ifEQ(value)**: Checks if the data is equal to the specified value.
  - **ifNE(value)**: Checks if the data is not equal to the specified value.
  - **ifGT(value)**: Checks if the data is greater than the specified value.
  - **ifGTE(value)**: Checks if the data is greater than or equal to the specified value.
  - **ifLT(value)**: Checks if the data is less than the specified value.
  - **ifLTE(value)**: Checks if the data is less than or equal to the specified value.
  - **ifIN(value)**: Checks if the data is contained in an array or string.
  - **ifNIN(value)**: Checks if the data is not contained in an array or string.
  - **ifEM()**: Checks if the data is empty (e.g., null, undefined, an empty string, an empty array, or an empty object).
  - **ifNEM()**: Checks if the data is non-empty.
  - **ifTE(type)**: Checks if the data type is equal to the specified type (for example, "string", "number", "boolean", etc.).
  - **and(value)**: Logical "and", used to connect multiple conditions.
  - **or(value)**: Logical "or", used to connect multiple conditions.

- **Action Formatters**
  - **:show(text) / :elseShow(text)**: Used in inline conditions to directly output the specified text.
  - **:hideBegin / :hideEnd** and **:showBegin / :showEnd**: Used in conditional blocks to hide or show sections of the document.
  - **:drop(element) / :keep(element)**: Used in smart conditions to remove or keep specified document elements.

The following sections introduce the detailed syntax, examples, and results for each usage.


### Inline Conditions

#### 1. :show(text) / :elseShow(text)

##### Syntax
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternative text)}
```

##### Example
Assume the data is:
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


#### 2. Switch Case (Multiple Conditionals)

##### Syntax
Use consecutive condition formatters to build a structure similar to a switch-case:
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(default result)}
```
Or achieve the same with the or operator:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(default result)}
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


#### 3. Multi-variable Conditionals

##### Syntax
Use the logical operators and/or to test multiple variables:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
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


### Logical Operators and Formatters

In the following sections, the described formatters use the inline condition syntax with the following format:
```
{data:formatter(parameter):show(text):elseShow(alternative text)}
```

#### 1. :and(value)

##### Syntax
```
{data:ifEQ(value):and(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Example
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Result
If `d.car` equals `'delorean'` and `d.speed` is greater than 80, the output is `TravelInTime`; otherwise, the output is `StayHere`.


#### 2. :or(value)

##### Syntax
```
{data:ifEQ(value):or(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Example
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Result
If `d.car` equals `'delorean'` or `d.speed` is greater than 80, the output is `TravelInTime`; otherwise, the output is `StayHere`.


#### 3. :ifEM()

##### Syntax
```
{data:ifEM():show(text):elseShow(alternative text)}
```

##### Example
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Result
For `null` or an empty array, the output is `Result true`; otherwise, it is `Result false`.


#### 4. :ifNEM()

##### Syntax
```
{data:ifNEM():show(text):elseShow(alternative text)}
```

##### Example
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Result
For non-empty data (such as the number 0 or the string 'homer'), the output is `Result true`; for empty data, the output is `Result false`.


#### 5. :ifEQ(value)

##### Syntax
```
{data:ifEQ(value):show(text):elseShow(alternative text)}
```

##### Example
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Result
If the data equals the specified value, the output is `Result true`; otherwise, it is `Result false`.


#### 6. :ifNE(value)

##### Syntax
```
{data:ifNE(value):show(text):elseShow(alternative text)}
```

##### Example
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result false`, while the second example outputs `Result true`.


#### 7. :ifGT(value)

##### Syntax
```
{data:ifGT(value):show(text):elseShow(alternative text)}
```

##### Example
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result true`, and the second outputs `Result false`.


#### 8. :ifGTE(value)

##### Syntax
```
{data:ifGTE(value):show(text):elseShow(alternative text)}
```

##### Example
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result true`, while the second outputs `Result false`.


#### 9. :ifLT(value)

##### Syntax
```
{data:ifLT(value):show(text):elseShow(alternative text)}
```

##### Example
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result true`, and the second outputs `Result false`.


#### 10. :ifLTE(value)

##### Syntax
```
{data:ifLTE(value):show(text):elseShow(alternative text)}
```

##### Example
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result true`, and the second outputs `Result false`.


#### 11. :ifIN(value)

##### Syntax
```
{data:ifIN(value):show(text):elseShow(alternative text)}
```

##### Example
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Result
Both examples output `Result true` (because the string contains 'is', and the array contains 2).


#### 12. :ifNIN(value)

##### Syntax
```
{data:ifNIN(value):show(text):elseShow(alternative text)}
```

##### Example
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result false` (because the string contains 'is'), and the second example outputs `Result false` (because the array contains 2).


#### 13. :ifTE(type)

##### Syntax
```
{data:ifTE('type'):show(text):elseShow(alternative text)}
```

##### Example
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Result
The first example outputs `Result true` (since 'homer' is a string), and the second outputs `Result true` (since 10.5 is a number).


### Conditional Blocks

Conditional blocks are used to display or hide a section of the document, typically to enclose multiple tags or an entire block of text.

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
When the condition is met, the content in between is displayed:
```
Banana
Apple
Pineapple
Grapes
```


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
When the condition is met, the content in between is hidden, resulting in:
```
Banana
Grapes
```