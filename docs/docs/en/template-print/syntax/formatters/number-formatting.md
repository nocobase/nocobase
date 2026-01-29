### Number Formatting

#### 1. :formatN(precision)

##### Syntax Explanation
Formats a number according to localization settings.  
Parameter:
- **precision:** The number of decimal places.  
  For ODS/XLSX formats, the number of displayed decimals is determined by the text editor; for other formats, this parameter is used.

##### Example
```
'10':formatN()         // Outputs "10.000"
'1000.456':formatN()   // Outputs "1,000.456"
```

##### Result
The number is output according to the specified precision and localization format.


#### 2. :round(precision)

##### Syntax Explanation
Rounds the number to the specified number of decimal places.

##### Example
```
10.05123:round(2)      // Outputs 10.05
1.05:round(1)          // Outputs 1.1
```

##### Result
The output is the number rounded to the given precision.


#### 3. :add(value)

##### Syntax Explanation
Adds the specified value to the current number.  
Parameter:
- **value:** The number to add.

##### Example
```
1000.4:add(2)         // Outputs 1002.4
'1000.4':add('2')      // Outputs 1002.4
```

##### Result
The output is the sum of the current number and the specified value.


#### 4. :sub(value)

##### Syntax Explanation
Subtracts the specified value from the current number.  
Parameter:
- **value:** The number to subtract.

##### Example
```
1000.4:sub(2)         // Outputs 998.4
'1000.4':sub('2')      // Outputs 998.4
```

##### Result
The output is the current number minus the specified value.


#### 5. :mul(value)

##### Syntax Explanation
Multiplies the current number by the specified value.  
Parameter:
- **value:** The multiplier.

##### Example
```
1000.4:mul(2)         // Outputs 2000.8
'1000.4':mul('2')      // Outputs 2000.8
```

##### Result
The output is the product of the current number and the specified value.


#### 6. :div(value)

##### Syntax Explanation
Divides the current number by the specified value.  
Parameter:
- **value:** The divisor.

##### Example
```
1000.4:div(2)         // Outputs 500.2
'1000.4':div('2')      // Outputs 500.2
```

##### Result
The output is the result of the division.


#### 7. :mod(value)

##### Syntax Explanation
Computes the modulus (remainder) of the current number divided by the specified value.  
Parameter:
- **value:** The modulus divisor.

##### Example
```
4:mod(2)              // Outputs 0
3:mod(2)              // Outputs 1
```

##### Result
The output is the remainder from the modulus operation.


#### 8. :abs

##### Syntax Explanation
Returns the absolute value of the number.

##### Example
```
-10:abs()             // Outputs 10
-10.54:abs()          // Outputs 10.54
10.54:abs()           // Outputs 10.54
'-200':abs()          // Outputs 200
```

##### Result
The output is the absolute value of the input number.


#### 9. :ceil

##### Syntax Explanation
Rounds the number upward to the smallest integer that is greater than or equal to the current number.

##### Example
```
10.05123:ceil()       // Outputs 11
1.05:ceil()           // Outputs 2
-1.05:ceil()          // Outputs -1
```

##### Result
The output is the number rounded upward to the nearest integer.


#### 10. :floor

##### Syntax Explanation
Rounds the number downward to the largest integer that is less than or equal to the current number.

##### Example
```
10.05123:floor()      // Outputs 10
1.05:floor()          // Outputs 1
-1.05:floor()         // Outputs -2
```

##### Result
The output is the number rounded downward to the nearest integer.


#### 11. :int

##### Syntax Explanation
Converts the number to an integer (not recommended for use).

##### Example and Result
Depends on the specific conversion case.


#### 12. :toEN

##### Syntax Explanation
Converts the number to English format (using `.` as the decimal point). Not recommended for use.

##### Example and Result
Depends on the specific conversion case.


#### 13. :toFixed

##### Syntax Explanation
Converts the number to a string while keeping only the specified number of decimal places. Not recommended for use.

##### Example and Result
Depends on the specific conversion case.


#### 14. :toFR

##### Syntax Explanation
Converts the number to French format (using `,` as the decimal separator). Not recommended for use.

##### Example and Result
Depends on the specific conversion case.