### Date Formatting

#### 1. :formatD(patternOut, patternIn)

##### Syntax Explanation
Formats a date by accepting an output format `patternOut` and an optional input format `patternIn` (defaults to ISO 8601).

##### Common Examples
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Outputs 2024-01-15
{d.createdAt:formatD(MMM D, YYYY)}          // Outputs Jan 15, 2024
{d.updatedAt:formatD(MMMM D, YYYY HH:mm)}   // Outputs January 15, 2024 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Outputs 2024/01/15 14:30:25
{d.birthday:formatD(MM/DD)}                 // Outputs 01/15
{d.meetingTime:formatD(HH:mm)}              // Outputs 14:30
{d.deadline:formatD(dddd, MMMM D, YYYY)}    // Outputs Monday, January 15, 2024
```

##### More Format Examples
```
'20160131':formatD(L)      // Outputs 01/31/2016
'20160131':formatD(LL)     // Outputs January 31, 2016
'20160131':formatD(LLLL)   // Outputs Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Outputs Sunday
```

##### Result
The output is the date formatted as specified.


#### 2. :addD(amount, unit, patternIn)

##### Syntax Explanation
Adds a specified amount of time to a date. Supported units include: day, week, month, quarter, year, hour, minute, second, millisecond.  
Parameters:
- **amount:** The quantity to add.
- **unit:** The time unit (case-insensitive).
- **patternIn:** Optional, the input format (defaults to ISO8601).

##### Example
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Outputs "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Outputs "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Outputs "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Outputs "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Outputs "2016-04-30T00:00:00.000Z"
```

##### Result
The output is the new date after the specified time has been added.


#### 3. :subD(amount, unit, patternIn)

##### Syntax Explanation
Subtracts a specified amount of time from a date. The parameters are the same as in `addD`.

##### Example
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Outputs "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Outputs "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Outputs "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Outputs "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Outputs "2015-10-31T00:00:00.000Z"
```

##### Result
The output is the new date after the specified time has been subtracted.


#### 4. :startOfD(unit, patternIn)

##### Syntax Explanation
Sets the date to the start of the specified time unit.  
Parameters:
- **unit:** The time unit.
- **patternIn:** Optional, the input format.

##### Example
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Outputs "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Outputs "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Outputs "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Outputs "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Outputs "2016-01-01T00:00:00.000Z"
```

##### Result
The output is the date set to the start of the specified unit.


#### 5. :endOfD(unit, patternIn)

##### Syntax Explanation
Sets the date to the end of the specified time unit.  
Parameters are the same as for `startOfD`.

##### Example
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Outputs "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Outputs "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Outputs "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Outputs "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Outputs "2016-01-31T23:59:59.999Z"
```

##### Result
The output is the date set to the end of the specified unit.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Syntax Explanation
Calculates the difference between two dates and outputs it in the specified unit. Supported units include:
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
- **toDate:** The target date.
- **unit:** The unit for output.
- **patternFromDate:** Optional, the format of the starting date.
- **patternToDate:** Optional, the format of the target date.

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
The output is the time difference between the two dates, converted into the specified unit.


#### 7. :convDate(patternIn, patternOut)

##### Syntax Explanation
Converts a date from one format to another (not recommended for use).  
Parameters:
- **patternIn:** The input date format.
- **patternOut:** The output date format.

##### Example
```
'20160131':convDate('YYYYMMDD', 'L')      // Outputs "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Outputs "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Outputs "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Outputs "Sunday"
1410715640:convDate('X', 'LLLL')          // Outputs "Sunday, September 14, 2014 7:27 PM"
```

##### Result
The output is the date converted to the specified format.


#### 8. Date Format Patterns

Common date format symbols (refer to the DayJS documentation):
- `X`: Unix timestamp (in seconds), e.g., 1360013296
- `x`: Unix timestamp in milliseconds, e.g., 1360013296123
- `YY`: Two-digit year, e.g., 18
- `YYYY`: Four-digit year, e.g., 2018
- `M`, `MM`, `MMM`, `MMMM`: Month (number, two-digit, abbreviated, full name)
- `D`, `DD`: Day (number, two-digit)
- `d`, `dd`, `ddd`, `dddd`: Day of the week (number, minimal, abbreviated, full name)
- `H`, `HH`, `h`, `hh`: Hour (24-hour or 12-hour clock)
- `m`, `mm`: Minute
- `s`, `ss`: Second
- `SSS`: Millisecond (3 digits)
- `Z`, `ZZ`: UTC offset, e.g., +05:00 or +0500
- `A`, `a`: AM/PM
- `Q`: Quarter (1-4)
- `Do`: Day of month with ordinal, e.g., 1st, 2nd, …
- For other formats, refer to the full documentation.  
  Additionally, there are localized formats based on language such as `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, etc.