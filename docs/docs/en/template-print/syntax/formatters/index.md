## Formatters

Formatters are used to convert raw data into text that is easy to read. They are applied to data using a colon (`:`) and can be chained so that the output of each formatter becomes the input for the next. Some formatters support constant parameters or dynamic parameters.


### Overview

#### 1. Syntax Explanation
The basic invocation of a formatter is as follows:
```
{d.property:formatter1:formatter2(...)}
```  
For example, in the case of converting the string `"JOHN"` to `"John"`, the formatter `lowerCase` is used first to convert all letters to lower case, and then `ucFirst` is used to capitalize the first letter.

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

After rendering, the output is:
```
My name is John. I was born on January 31, 2000.
```


### Constant Parameters

#### 1. Syntax Explanation
Many formatters support one or more constant parameters, which are separated by commas and enclosed in parentheses to modify the output. For example, `:prepend(myPrefix)` will add "myPrefix" in front of the text.  
**Note:** If the parameter contains commas or spaces, it must be enclosed in single quotes, for example: `prepend('my prefix')`.

#### 2. Example

Template example (see the specific formatter usage for details).

#### 3. Result

The output will have the specified prefix added in front of the text.


### Dynamic Parameters

#### 1. Syntax Explanation
Formatters also support dynamic parameters. These parameters start with a dot (`.`) and are not enclosed in quotes.  
There are two methods to specify dynamic parameters:
- **Absolute JSON Path:** Begins with `d.` or `c.` (referring to root data or supplemental data).
- **Relative JSON Path:** Begins with a single dot (`.`), indicating that the property is looked up from the current parent object.

For example:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
It can also be written as a relative path:
```
{d.subObject.qtyB:add(.qtyC)}
```
If you need to access data from a higher level (parent or above), you can use multiple dots:
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

Usage in Template:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Result: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Result: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Result: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Result: 6 (3 + 3)
```

#### 3. Result

The examples yield 8, 8, 28, and 6 respectively.

> **Note:** Using custom iterators or array filters as dynamic parameters is not allowed, for example:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```