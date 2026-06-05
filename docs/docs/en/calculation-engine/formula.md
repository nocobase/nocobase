# Formula.js

[Formula.js](http://formulajs.info/) provides a large collection of Excel-compatible functions.

## Function Reference

### Dates

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Creates a date based on the supplied year, month, and day. | `DATE(2008, 7, 8)` | Year (integer), month (1-12), day (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Converts a date in text format to a date serial number. | `DATEVALUE('8/22/2011')` | Text string that represents a date. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Returns the day portion of a date. | `DAY('15-Apr-11')` | Date value or a date text string. | 15 |
| **DAYS** | Calculates the number of days between two dates. | `DAYS('3/15/11', '2/1/11')` | End date, start date. | 42 |
| **DAYS360** | Calculates the number of days between two dates based on a 360-day year. | `DAYS360('1-Jan-11', '31-Dec-11')` | Start date, end date. | 360 |
| **EDATE** | Returns the date that is a specified number of months before or after a date. | `EDATE('1/15/11', -1)` | Start date, number of months (positive for future, negative for past). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Returns the last day of the month before or after the specified number of months. | `EOMONTH('1/1/11', -3)` | Start date, number of months (positive for future, negative for past). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Returns the hour portion of a time value. | `HOUR('7/18/2011 7:45:00 AM')` | Time value or time text string. | 7 |
| **MINUTE** | Returns the minute portion of a time value. | `MINUTE('2/1/2011 12:45:00 PM')` | Time value or time text string. | 45 |
| **ISOWEEKNUM** | Returns the ISO week number of the year for a given date. | `ISOWEEKNUM('3/9/2012')` | Date value or a date text string. | 10 |
| **MONTH** | Returns the month portion of a date. | `MONTH('15-Apr-11')` | Date value or a date text string. | 4 |
| **NETWORKDAYS** | Counts the number of working days between two dates, excluding weekends and optional holidays. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Start date, end date, optional array of holidays. | 109 |
| **NETWORKDAYSINTL** | Counts working days between two dates, allowing custom weekends and optional holidays. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Start date, end date, weekend mode, optional array of holidays. | 23 |
| **NOW** | Returns the current date and time. | `NOW()` | No parameters. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Returns the seconds portion of a time value. | `SECOND('2/1/2011 4:48:18 PM')` | Time value or time text string. | 18 |
| **TIME** | Builds a time value from the supplied hour, minute, and second. | `TIME(16, 48, 10)` | Hour (0-23), minute (0-59), second (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Converts a time in text format to a time serial number. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Text string that represents a time. | 0.2743055555555556 |
| **TODAY** | Returns the current date. | `TODAY()` | No parameters. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Returns the number corresponding to the day of the week. | `WEEKDAY('2/14/2008', 3)` | Date value or a date text string, return type (1-3). | 3 |
| **YEAR** | Returns the year portion of a date. | `YEAR('7/5/2008')` | Date value or a date text string. | 2008 |
| **WEEKNUM** | Returns the week number in a year for a given date. | `WEEKNUM('3/9/2012', 2)` | Date value or a date text string, optional week starting day (1=Sunday, 2=Monday). | 11 |
| **WORKDAY** | Returns the date before or after a given number of working days, excluding weekends and optional holidays. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Start date, number of working days, optional array of holidays. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Returns the date before or after a number of working days with custom weekends and optional holidays. | `WORKDAYINTL('1/1/2012', 30, 17)` | Start date, number of working days, weekend mode. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Calculates the fractional number of years between two dates. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Start date, end date, optional basis (day-count basis). | 0.5780821917808219 |

### Financial

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Calculates accrued interest for a security that pays periodic interest. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Issue date, first interest date, settlement date, annual rate, par value, frequency, basis. | 350 |
| **CUMIPMT** | Calculates the cumulative interest paid on a series of payments. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Rate, total periods, present value, start period, end period, payment type (0=end, 1=beginning). | -9916.77251395708 |
| **CUMPRINC** | Calculates the cumulative principal paid on a series of payments. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Rate, total periods, present value, start period, end period, payment type (0=end, 1=beginning). | -614.0863271085149 |
| **DB** | Calculates depreciation using the fixed-declining balance method. | `DB(1000000, 100000, 6, 1, 6)` | Cost, salvage value, life, period, month. | 159500 |
| **DDB** | Calculates depreciation using double-declining balance or another specified method. | `DDB(1000000, 100000, 6, 1, 1.5)` | Cost, salvage value, life, period, factor. | 250000 |
| **DOLLARDE** | Converts a price expressed as a fraction to a decimal. | `DOLLARDE(1.1, 16)` | Price as a fractional dollar, denominator. | 1.625 |
| **DOLLARFR** | Converts a price expressed as a decimal to a fraction. | `DOLLARFR(1.625, 16)` | Price as a decimal dollar, denominator. | 1.1 |
| **EFFECT** | Calculates the effective annual interest rate. | `EFFECT(0.1, 4)` | Nominal annual rate, number of compounding periods per year. | 0.10381289062499977 |
| **FV** | Calculates the future value of an investment. | `FV(0.1/12, 10, -100, -1000, 0)` | Rate per period, number of periods, payment per period, present value, payment type (0=end, 1=beginning). | 2124.874409194097 |
| **FVSCHEDULE** | Calculates the future value of principal using a series of compounding rates. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Principal, array of rates. | 133.08900000000003 |
| **IPMT** | Calculates the interest payment for a specific period. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Rate per period, period, total periods, present value, future value, payment type (0=end, 1=beginning). | 928.8235718400465 |
| **IRR** | Calculates the internal rate of return. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Array of cash flows, guess. | 0.05715142887178447 |
| **ISPMT** | Calculates the interest paid during a specific period (for loans). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Rate per period, period, total periods, loan amount. | -625 |
| **MIRR** | Calculates the modified internal rate of return. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Array of cash flows, finance rate, reinvestment rate. | 0.07971710360838036 |
| **NOMINAL** | Calculates the nominal annual interest rate. | `NOMINAL(0.1, 4)` | Effective annual rate, number of compounding periods per year. | 0.09645475633778045 |
| **NPER** | Calculates the number of periods required to reach a target value. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Rate per period, payment per period, present value, future value, payment type (0=end, 1=beginning). | 63.39385422740764 |
| **NPV** | Calculates the net present value of a series of future cash flows. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Discount rate per period, array of cash flows. | 1031.3503176012546 |
| **PDURATION** | Calculates the time required to reach a desired value. | `PDURATION(0.1, 1000, 2000)` | Rate per period, present value, future value. | 7.272540897341714 |
| **PMT** | Calculates the periodic payment for a loan. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Rate per period, total periods, present value, future value, payment type (0=end, 1=beginning). | -42426.08563793503 |
| **PPMT** | Calculates the principal payment for a specific period. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Rate per period, period, total periods, present value, future value, payment type (0=end, 1=beginning). | -43354.909209775076 |
| **PV** | Calculates the present value of an investment. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Rate per period, number of periods, payment per period, future value, payment type (0=end, 1=beginning). | -29864.950264779152 |
| **RATE** | Calculates the interest rate per period. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Total periods, payment per period, present value, future value, payment type (0=end, 1=beginning), guess. | 0.06517891177181533 |

### Engineering

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Converts a binary number to decimal. | `BIN2DEC(101010)` | Binary number. | 42 |
| **BIN2HEX** | Converts a binary number to hexadecimal. | `BIN2HEX(101010)` | Binary number. | 2a |
| **BIN2OCT** | Converts a binary number to octal. | `BIN2OCT(101010)` | Binary number. | 52 |
| **BITAND** | Returns the bitwise AND of two numbers. | `BITAND(42, 24)` | Integer, integer. | 8 |
| **BITLSHIFT** | Performs a bitwise left shift. | `BITLSHIFT(42, 24)` | Integer, number of bits to shift. | 704643072 |
| **BITOR** | Returns the bitwise OR of two numbers. | `BITOR(42, 24)` | Integer, integer. | 58 |
| **BITRSHIFT** | Performs a bitwise right shift. | `BITRSHIFT(42, 2)` | Integer, number of bits to shift. | 10 |
| **BITXOR** | Returns the bitwise XOR of two numbers. | `BITXOR(42, 24)` | Integer, integer. | 50 |
| **COMPLEX** | Creates a complex number. | `COMPLEX(3, 4)` | Real part, imaginary part. | 3+4i |
| **CONVERT** | Converts a number from one measurement unit to another. | `CONVERT(64, 'kibyte', 'bit')` | Value, from unit, to unit. | 524288 |
| **DEC2BIN** | Converts a decimal number to binary. | `DEC2BIN(42)` | Decimal number. | 101010 |
| **DEC2HEX** | Converts a decimal number to hexadecimal. | `DEC2HEX(42)` | Decimal number. | 2a |
| **DEC2OCT** | Converts a decimal number to octal. | `DEC2OCT(42)` | Decimal number. | 52 |
| **DELTA** | Tests whether two values are equal. | `DELTA(42, 42)` | Number, number. | 1 |
| **ERF** | Returns the error function. | `ERF(1)` | Upper limit. | 0.8427007929497149 |
| **ERFC** | Returns the complementary error function. | `ERFC(1)` | Lower limit. | 0.1572992070502851 |
| **GESTEP** | Tests whether a number is greater than or equal to a threshold. | `GESTEP(42, 24)` | Number, threshold. | 1 |
| **HEX2BIN** | Converts a hexadecimal number to binary. | `HEX2BIN('2a')` | Hexadecimal number. | 101010 |
| **HEX2DEC** | Converts a hexadecimal number to decimal. | `HEX2DEC('2a')` | Hexadecimal number. | 42 |
| **HEX2OCT** | Converts a hexadecimal number to octal. | `HEX2OCT('2a')` | Hexadecimal number. | 52 |
| **IMABS** | Returns the absolute value (magnitude) of a complex number. | `IMABS('3+4i')` | Complex number. | 5 |
| **IMAGINARY** | Returns the imaginary part of a complex number. | `IMAGINARY('3+4i')` | Complex number. | 4 |
| **IMARGUMENT** | Returns the argument of a complex number. | `IMARGUMENT('3+4i')` | Complex number. | 0.9272952180016122 |
| **IMCONJUGATE** | Returns the complex conjugate. | `IMCONJUGATE('3+4i')` | Complex number. | 3-4i |
| **IMCOS** | Returns the cosine of a complex number. | `IMCOS('1+i')` | Complex number. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Returns the hyperbolic cosine of a complex number. | `IMCOSH('1+i')` | Complex number. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Returns the cotangent of a complex number. | `IMCOT('1+i')` | Complex number. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Returns the cosecant of a complex number. | `IMCSC('1+i')` | Complex number. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Returns the hyperbolic cosecant of a complex number. | `IMCSCH('1+i')` | Complex number. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Returns the quotient of two complex numbers. | `IMDIV('1+2i', '3+4i')` | Dividend complex number, divisor complex number. | 0.44+0.08i |
| **IMEXP** | Returns the exponential of a complex number. | `IMEXP('1+i')` | Complex number. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Returns the natural logarithm of a complex number. | `IMLN('1+i')` | Complex number. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Returns the base-10 logarithm of a complex number. | `IMLOG10('1+i')` | Complex number. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Returns the base-2 logarithm of a complex number. | `IMLOG2('1+i')` | Complex number. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Returns a complex number raised to a power. | `IMPOWER('1+i', 2)` | Complex number, exponent. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Returns the product of complex numbers. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Array of complex numbers. | -85+20i |
| **IMREAL** | Returns the real part of a complex number. | `IMREAL('3+4i')` | Complex number. | 3 |
| **IMSEC** | Returns the secant of a complex number. | `IMSEC('1+i')` | Complex number. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Returns the hyperbolic secant of a complex number. | `IMSECH('1+i')` | Complex number. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Returns the sine of a complex number. | `IMSIN('1+i')` | Complex number. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Returns the hyperbolic sine of a complex number. | `IMSINH('1+i')` | Complex number. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Returns the square root of a complex number. | `IMSQRT('1+i')` | Complex number. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Returns the difference between two complex numbers. | `IMSUB('3+4i', '1+2i')` | Minuend complex number, subtrahend complex number. | 2+2i |
| **IMSUM** | Returns the sum of complex numbers. | `IMSUM('1+2i', '3+4i', '5+6i')` | Array of complex numbers. | 9+12i |
| **IMTAN** | Returns the tangent of a complex number. | `IMTAN('1+i')` | Complex number. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Converts an octal number to binary. | `OCT2BIN('52')` | Octal number. | 101010 |
| **OCT2DEC** | Converts an octal number to decimal. | `OCT2DEC('52')` | Octal number. | 42 |
| **OCT2HEX** | Converts an octal number to hexadecimal. | `OCT2HEX('52')` | Octal number. | 2a |

### Logic

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Returns TRUE only when all arguments are TRUE, otherwise FALSE. | `AND(true, false, true)` | One or more logical values (Boolean); the function returns TRUE only when every argument is TRUE. | |
| **FALSE** | Returns the logical value FALSE. | `FALSE()` | No parameters. | |
| **IF** | Returns different values depending on whether a condition is TRUE or FALSE. | `IF(true, 'Hello!', 'Goodbye!')` | Condition, value if TRUE, value if FALSE. | Hello! |
| **IFS** | Evaluates multiple conditions and returns the result of the first TRUE condition. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Multiple pairs of condition and corresponding value. | Goodbye! |
| **NOT** | Reverses a logical value. TRUE becomes FALSE and vice versa. | `NOT(true)` | One logical value (Boolean). | |
| **OR** | Returns TRUE if any argument is TRUE, otherwise FALSE. | `OR(true, false, true)` | One or more logical values (Boolean); returns TRUE when any argument is TRUE. | |
| **SWITCH** | Returns the value that matches an expression; if none match, returns the default. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Expression, match value 1, result 1, …, [default]. | Seven |
| **TRUE** | Returns the logical value TRUE. | `TRUE()` | No parameters. | |
| **XOR** | Returns TRUE only when an odd number of arguments are TRUE, otherwise FALSE. | `XOR(true, false, true)` | One or more logical values (Boolean); returns TRUE when an odd count are TRUE. | |

### Math

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Returns the absolute value of a number. | `ABS(-4)` | Number. | 4 |
| **ACOS** | Returns the arccosine (in radians). | `ACOS(-0.5)` | Number between -1 and 1. | 2.0943951023931957 |
| **ACOSH** | Returns the inverse hyperbolic cosine. | `ACOSH(10)` | Number greater than or equal to 1. | 2.993222846126381 |
| **ACOT** | Returns the arccotangent (in radians). | `ACOT(2)` | Any number. | 0.46364760900080615 |
| **ACOTH** | Returns the inverse hyperbolic cotangent. | `ACOTH(6)` | Number whose absolute value is greater than 1. | 0.16823611831060645 |
| **AGGREGATE** | Performs an aggregate calculation while ignoring errors or hidden rows. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Function number, options, array1, …, arrayN. | 10,32 |
| **ARABIC** | Converts a Roman numeral to Arabic. | `ARABIC('MCMXII')` | Roman numeral string. | 1912 |
| **ASIN** | Returns the arcsine (in radians). | `ASIN(-0.5)` | Number between -1 and 1. | -0.5235987755982988 |
| **ASINH** | Returns the inverse hyperbolic sine. | `ASINH(-2.5)` | Any number. | -1.6472311463710965 |
| **ATAN** | Returns the arctangent (in radians). | `ATAN(1)` | Any number. | 0.7853981633974483 |
| **ATAN2** | Returns the arctangent (in radians) of a coordinate pair. | `ATAN2(-1, -1)` | y-coordinate, x-coordinate. | -2.356194490192345 |
| **ATANH** | Returns the inverse hyperbolic tangent. | `ATANH(-0.1)` | Number between -1 and 1. | -0.10033534773107562 |
| **BASE** | Converts a number to text in the specified base. | `BASE(15, 2, 10)` | Number, radix, [minimum length]. | 0000001111 |
| **CEILING** | Rounds a number up to the nearest multiple. | `CEILING(-5.5, 2, -1)` | Number, significance, [mode]. | -6 |
| **CEILINGMATH** | Rounds a number up, using the supplied multiple and direction. | `CEILINGMATH(-5.5, 2, -1)` | Number, [significance], [mode]. | -6 |
| **CEILINGPRECISE** | Rounds a number up to the nearest multiple, ignoring sign. | `CEILINGPRECISE(-4.1, -2)` | Number, [significance]. | -4 |
| **COMBIN** | Returns the number of combinations. | `COMBIN(8, 2)` | Total items, number chosen. | 28 |
| **COMBINA** | Returns the number of combinations with repetitions. | `COMBINA(4, 3)` | Total items, number chosen. | 20 |
| **COS** | Returns the cosine (in radians). | `COS(1)` | Angle in radians. | 0.5403023058681398 |
| **COSH** | Returns the hyperbolic cosine. | `COSH(1)` | Any number. | 1.5430806348152437 |
| **COT** | Returns the cotangent (in radians). | `COT(30)` | Angle in radians. | -0.15611995216165922 |
| **COTH** | Returns the hyperbolic cotangent. | `COTH(2)` | Any number. | 1.0373147207275482 |
| **CSC** | Returns the cosecant (in radians). | `CSC(15)` | Angle in radians. | 1.5377805615408537 |
| **CSCH** | Returns the hyperbolic cosecant. | `CSCH(1.5)` | Any number. | 0.46964244059522464 |
| **DECIMAL** | Converts a number in text form to decimal. | `DECIMAL('FF', 16)` | Text, base. | 255 |
| **ERF** | Returns the error function. | `ERF(1)` | Upper limit. | 0.8427007929497149 |
| **ERFC** | Returns the complementary error function. | `ERFC(1)` | Lower limit. | 0.1572992070502851 |
| **EVEN** | Rounds a number up to the nearest even integer. | `EVEN(-1)` | Number. | -2 |
| **EXP** | Returns e raised to a power. | `EXP(1)` | Exponent. | 2.718281828459045 |
| **FACT** | Returns the factorial. | `FACT(5)` | Non-negative integer. | 120 |
| **FACTDOUBLE** | Returns the double factorial. | `FACTDOUBLE(7)` | Non-negative integer. | 105 |
| **FLOOR** | Rounds a number down to the nearest multiple. | `FLOOR(-3.1)` | Number, significance. | -4 |
| **FLOORMATH** | Rounds a number down using the supplied multiple and direction. | `FLOORMATH(-4.1, -2, -1)` | Number, [significance], [mode]. | -4 |
| **FLOORPRECISE** | Rounds a number down to the nearest multiple, ignoring sign. | `FLOORPRECISE(-3.1, -2)` | Number, [significance]. | -4 |
| **GCD** | Returns the greatest common divisor. | `GCD(24, 36, 48)` | Two or more integers. | 12 |
| **INT** | Rounds a number down to the nearest integer. | `INT(-8.9)` | Number. | -9 |
| **ISEVEN** | Tests whether a number is even. | `ISEVEN(-2.5)` | Number. | |
| **ISOCEILING** | Rounds a number up to the nearest multiple following ISO rules. | `ISOCEILING(-4.1, -2)` | Number, [significance]. | -4 |
| **ISODD** | Tests whether a number is odd. | `ISODD(-2.5)` | Number. | |
| **LCM** | Returns the least common multiple. | `LCM(24, 36, 48)` | Two or more integers. | 144 |
| **LN** | Returns the natural logarithm. | `LN(86)` | Positive number. | 4.454347296253507 |
| **LOG** | Returns the logarithm in the specified base. | `LOG(8, 2)` | Number, base. | 3 |
| **LOG10** | Returns the base-10 logarithm. | `LOG10(100000)` | Positive number. | 5 |
| **MOD** | Returns the remainder of a division. | `MOD(3, -2)` | Dividend, divisor. | -1 |
| **MROUND** | Rounds a number to the nearest multiple. | `MROUND(-10, -3)` | Number, multiple. | -9 |
| **MULTINOMIAL** | Returns the multinomial coefficient. | `MULTINOMIAL(2, 3, 4)` | Two or more non-negative integers. | 1260 |
| **ODD** | Rounds a number up to the nearest odd integer. | `ODD(-1.5)` | Number. | -3 |
| **POWER** | Raises a number to a power. | `POWER(5, 2)` | Base, exponent. | 25 |
| **PRODUCT** | Returns the product of numbers. | `PRODUCT(5, 15, 30)` | One or more numbers. | 2250 |
| **QUOTIENT** | Returns the integer portion of a division. | `QUOTIENT(-10, 3)` | Dividend, divisor. | -3 |
| **RADIANS** | Converts degrees to radians. | `RADIANS(180)` | Degrees. | 3.141592653589793 |
| **RAND** | Returns a random real number between 0 and 1. | `RAND()` | No parameters. | [Random real number between 0 and 1] |
| **RANDBETWEEN** | Returns a random integer within a specified range. | `RANDBETWEEN(-1, 1)` | Bottom, top. | [Random integer between bottom and top] |
| **ROUND** | Rounds a number to the specified number of digits. | `ROUND(626.3, -3)` | Number, digits. | 1000 |
| **ROUNDDOWN** | Rounds a number down toward zero. | `ROUNDDOWN(-3.14159, 2)` | Number, digits. | -3.14 |
| **ROUNDUP** | Rounds a number up away from zero. | `ROUNDUP(-3.14159, 2)` | Number, digits. | -3.15 |
| **SEC** | Returns the secant (in radians). | `SEC(45)` | Angle in radians. | 1.9035944074044246 |
| **SECH** | Returns the hyperbolic secant. | `SECH(45)` | Any number. | 5.725037161098787e-20 |
| **SIGN** | Returns the sign of a number. | `SIGN(-0.00001)` | Number. | -1 |
| **SIN** | Returns the sine (in radians). | `SIN(1)` | Angle in radians. | 0.8414709848078965 |
| **SINH** | Returns the hyperbolic sine. | `SINH(1)` | Any number. | 1.1752011936438014 |
| **SQRT** | Returns the square root. | `SQRT(16)` | Non-negative number. | 4 |
| **SQRTPI** | Returns the square root of (number * π). | `SQRTPI(2)` | Non-negative number. | 2.5066282746310002 |
| **SUBTOTAL** | Returns a subtotal for a set of data, ignoring hidden rows. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Function number, array1, …, arrayN. | 10,32 |
| **SUM** | Returns the sum of numbers, ignoring text. | `SUM(-5, 15, 32, 'Hello World!')` | One or more numbers. | 42 |
| **SUMIF** | Sums values that meet a single condition. | `SUMIF([2,4,8,16], '>5')` | Range, criteria. | 24 |
| **SUMIFS** | Sums values that meet multiple conditions. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Sum range, criteria range 1, criteria 1, …, criteria range N, criteria N. | 12 |
| **SUMPRODUCT** | Returns the sum of products of array elements. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Two or more arrays. | 5 |
| **SUMSQ** | Returns the sum of squares. | `SUMSQ(3, 4)` | One or more numbers. | 25 |
| **SUMX2MY2** | Returns the sum of the difference of squares of corresponding array elements. | `SUMX2MY2([1,2], [3,4])` | Array1, array2. | -20 |
| **SUMX2PY2** | Returns the sum of the sum of squares of corresponding array elements. | `SUMX2PY2([1,2], [3,4])` | Array1, array2. | 30 |
| **SUMXMY2** | Returns the sum of squares of differences of corresponding array elements. | `SUMXMY2([1,2], [3,4])` | Array1, array2. | 8 |
| **TAN** | Returns the tangent (in radians). | `TAN(1)` | Angle in radians. | 1.5574077246549023 |
| **TANH** | Returns the hyperbolic tangent. | `TANH(-2)` | Any number. | -0.9640275800758168 |
| **TRUNC** | Truncates a number to an integer without rounding. | `TRUNC(-8.9)` | Number, [digits]. | -8 |

### Statistics

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Returns the average absolute deviation. | `AVEDEV([2,4], [8,16])` | Arrays of numbers representing data points. | 4.5 |
| **AVERAGE** | Returns the arithmetic mean. | `AVERAGE([2,4], [8,16])` | Arrays of numbers representing data points. | 7.5 |
| **AVERAGEA** | Returns the average of values, including text and logical values. | `AVERAGEA([2,4], [8,16])` | Arrays of numbers, text, or logical values; all non-empty values are included. | 7.5 |
| **AVERAGEIF** | Calculates the average based on a single condition. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | First parameter is the range to check, second is the condition, third optional range used for averaging. | 3.5 |
| **AVERAGEIFS** | Calculates the average based on multiple conditions. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | First parameter is the values to average, followed by pairs of criteria ranges and criteria expressions. | 6 |
| **BETADIST** | Returns the cumulative beta probability density. | `BETADIST(2, 8, 10, true, 1, 3)` | Value, alpha, beta, cumulative flag, A (optional), B (optional). | 0.6854705810117458 |
| **BETAINV** | Returns the inverse of the cumulative beta distribution. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Probability, alpha, beta, A (optional), B (optional). | 1.9999999999999998 |
| **BINOMDIST** | Returns the probability of a binomial distribution. | `BINOMDIST(6, 10, 0.5, false)` | Number of successes, trials, probability of success, cumulative flag. | 0.205078125 |
| **CORREL** | Returns the correlation coefficient between two datasets. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Two arrays of numbers. | 0.9970544855015815 |
| **COUNT** | Counts numeric cells. | `COUNT([1,2], [3,4])` | Arrays or ranges of numbers. | 4 |
| **COUNTA** | Counts non-empty cells. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Arrays or ranges of any type. | 4 |
| **COUNTBLANK** | Counts blank cells. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Arrays or ranges of any type. | 2 |
| **COUNTIF** | Counts cells matching a condition. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Range of numbers or text, and the condition. | 3 |
| **COUNTIFS** | Counts cells matching multiple conditions. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Pairs of criteria ranges and criteria expressions. | 2 |
| **COVARIANCEP** | Returns the population covariance. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Two arrays of numbers. | 5.2 |
| **COVARIANCES** | Returns the sample covariance. | `COVARIANCES([2,4,8], [5,11,12])` | Two arrays of numbers. | 9.666666666666668 |
| **DEVSQ** | Returns the sum of squares of deviations. | `DEVSQ([2,4,8,16])` | Array of numbers representing data points. | 115 |
| **EXPONDIST** | Returns the exponential distribution. | `EXPONDIST(0.2, 10, true)` | Value, lambda, cumulative flag. | 0.8646647167633873 |
| **FDIST** | Returns the F probability distribution. | `FDIST(15.2069, 6, 4, false)` | Value, degrees of freedom 1, degrees of freedom 2, cumulative flag. | 0.0012237917087831735 |
| **FINV** | Returns the inverse of the F distribution. | `FINV(0.01, 6, 4)` | Probability, degrees of freedom 1, degrees of freedom 2. | 0.10930991412457851 |
| **FISHER** | Returns the Fisher transformation. | `FISHER(0.75)` | Number representing a correlation coefficient. | 0.9729550745276566 |
| **FISHERINV** | Returns the inverse Fisher transformation. | `FISHERINV(0.9729550745276566)` | Number representing a Fisher transform result. | 0.75 |
| **FORECAST** | Predicts a y-value for a given x using known x and y values. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | New x value, array of known y values, array of known x values. | 10.607253086419755 |
| **FREQUENCY** | Returns a frequency distribution. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Data array, bins array. | 1,2,4,2 |
| **GAMMA** | Returns the gamma function. | `GAMMA(2.5)` | Positive number. | 1.3293403919101043 |
| **GAMMALN** | Returns the natural logarithm of the gamma function. | `GAMMALN(10)` | Positive number. | 12.801827480081961 |
| **GAUSS** | Returns the probability based on the standard normal distribution. | `GAUSS(2)` | Number representing a z-score. | 0.4772498680518208 |
| **GEOMEAN** | Returns the geometric mean. | `GEOMEAN([2,4], [8,16])` | Arrays of numbers. | 5.656854249492381 |
| **GROWTH** | Predicts exponential growth values based on known data. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Array of known y values, array of known x values, new x values. | 32.00000000000003 |
| **HARMEAN** | Returns the harmonic mean. | `HARMEAN([2,4], [8,16])` | Arrays of numbers. | 4.266666666666667 |
| **HYPGEOMDIST** | Returns the hypergeometric distribution. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Sample successes, sample size, population successes, population size, cumulative flag. | 0.3632610939112487 |
| **INTERCEPT** | Returns the intercept of a linear regression line. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Array of known y values, array of known x values. | 0.04838709677419217 |
| **KURT** | Returns kurtosis. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Array of numbers. | -0.15179963720841627 |
| **LARGE** | Returns the k-th largest value. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Array of numbers, k. | 5 |
| **LINEST** | Performs linear regression analysis. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Array of known y values, array of known x values, return additional stats, return more stats. | 2,1 |
| **LOGNORMDIST** | Returns the lognormal distribution. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Value, mean, standard deviation, cumulative flag. | 0.0390835557068005 |
| **LOGNORMINV** | Returns the inverse of the lognormal distribution. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Probability, mean, standard deviation, cumulative flag. | 4.000000000000001 |
| **MAX** | Returns the maximum value. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Arrays of numbers. | 0.8 |
| **MAXA** | Returns the maximum value including text and logical values. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Arrays of numbers, text, or logical values. | 1 |
| **MEDIAN** | Returns the median. | `MEDIAN([1,2,3], [4,5,6])` | Arrays of numbers. | 3.5 |
| **MIN** | Returns the minimum value. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Arrays of numbers. | 0.1 |
| **MINA** | Returns the minimum value including text and logical values. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Arrays of numbers, text, or logical values. | 0 |
| **MODEMULT** | Returns an array of the most frequently occurring values. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Array of numbers. | 2,3 |
| **MODESNGL** | Returns the most frequently occurring single value. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Array of numbers. | 2 |
| **NORMDIST** | Returns the normal distribution. | `NORMDIST(42, 40, 1.5, true)` | Value, mean, standard deviation, cumulative flag. | 0.9087887802741321 |
| **NORMINV** | Returns the inverse of the normal distribution. | `NORMINV(0.9087887802741321, 40, 1.5)` | Probability, mean, standard deviation. | 42 |
| **NORMSDIST** | Returns the standard normal distribution. | `NORMSDIST(1, true)` | Number representing a z-score. | 0.8413447460685429 |
| **NORMSINV** | Returns the inverse of the standard normal distribution. | `NORMSINV(0.8413447460685429)` | Probability. | 1.0000000000000002 |
| **PEARSON** | Returns the Pearson product-moment correlation coefficient. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Two arrays of numbers. | 0.6993786061802354 |
| **PERCENTILEEXC** | Returns the k-th percentile, exclusive. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Array of numbers, k. | 1.5 |
| **PERCENTILEINC** | Returns the k-th percentile, inclusive. | `PERCENTILEINC([1,2,3,4], 0.3)` | Array of numbers, k. | 1.9 |
| **PERCENTRANKEXC** | Returns the rank of a value in a data set as a percentage (exclusive). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Array of numbers, x value, significance (optional). | 0.4 |
| **PERCENTRANKINC** | Returns the rank of a value in a data set as a percentage (inclusive). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Array of numbers, x value, significance (optional). | 0.33 |
| **PERMUT** | Returns the number of permutations. | `PERMUT(100, 3)` | Total number n, number chosen k. | 970200 |
| **PERMUTATIONA** | Returns the number of permutations with repetitions. | `PERMUTATIONA(4, 3)` | Total number n, number chosen k. | 64 |
| **PHI** | Returns the density function of the standard normal distribution. | `PHI(0.75)` | Number representing a z-score. | 0.30113743215480443 |
| **POISSONDIST** | Returns the Poisson distribution. | `POISSONDIST(2, 5, true)` | Number of events, mean, cumulative flag. | 0.12465201948308113 |
| **PROB** | Returns the sum of probabilities. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Array of values, array of probabilities, lower limit, upper limit. | 0.4 |
| **QUARTILEEXC** | Returns the quartile of the data set, exclusive. | `QUARTILEEXC([1,2,3,4], 1)` | Array of numbers, quart. | 1.25 |
| **QUARTILEINC** | Returns the quartile of the data set, inclusive. | `QUARTILEINC([1,2,3,4], 1)` | Array of numbers, quart. | 1.75 |
| **RANKAVG** | Returns the average rank. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Number, array of numbers, order (ascending/descending). | 4.5 |
| **RANKEQ** | Returns the rank of a number. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Number, array of numbers, order (ascending/descending). | 4 |
| **RSQ** | Returns the coefficient of determination. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Two arrays of numbers. | 0.4891304347826088 |
| **SKEW** | Returns skewness. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Array of numbers. | 0.3595430714067974 |
| **SKEWP** | Returns population skewness. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Array of numbers. | 0.303193339354144 |
| **SLOPE** | Returns the slope of the linear regression line. | `SLOPE([1,9,5,7], [0,4,2,3])` | Array of known y values, array of known x values. | 2 |
| **SMALL** | Returns the k-th smallest value. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Array of numbers, k. | 3 |
| **STANDARDIZE** | Returns a normalized value as a z-score. | `STANDARDIZE(42, 40, 1.5)` | Value, mean, standard deviation. | 1.3333333333333333 |
| **STDEVA** | Returns the standard deviation, including text and logical values. | `STDEVA([2,4], [8,16], [true, false])` | Arrays of numbers, text, or logical values. | 6.013872850889572 |
| **STDEVP** | Returns the population standard deviation. | `STDEVP([2,4], [8,16], [true, false])` | Arrays of numbers. | 5.361902647381804 |
| **STDEVPA** | Returns the population standard deviation, including text and logical values. | `STDEVPA([2,4], [8,16], [true, false])` | Arrays of numbers, text, or logical values. | 5.489889697333535 |
| **STDEVS** | Returns the sample standard deviation. | `VARS([2,4], [8,16], [true, false])` | Arrays of numbers. | 6.191391873668904 |
| **STEYX** | Returns the standard error of the predicted y-value. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Array of known y values, array of known x values. | 3.305718950210041 |
| **TINV** | Returns the inverse of the t-distribution. | `TINV(0.9946953263673741, 1)` | Probability, degrees of freedom. | 59.99999999996535 |
| **TRIMMEAN** | Returns the mean of the interior portion of a data set. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Array of numbers, trim proportion. | 3.7777777777777777 |
| **VARA** | Returns the variance including text and logical values. | `VARA([2,4], [8,16], [true, false])` | Arrays of numbers, text, or logical values. | 36.16666666666667 |
| **VARP** | Returns the population variance. | `VARP([2,4], [8,16], [true, false])` | Arrays of numbers. | 28.75 |
| **VARPA** | Returns the population variance including text and logical values. | `VARPA([2,4], [8,16], [true, false])` | Arrays of numbers, text, or logical values. | 30.13888888888889 |
| **VARS** | Returns the sample variance. | `VARS([2,4], [8,16], [true, false])` | Arrays of numbers. | 38.333333333333336 |
| **WEIBULLDIST** | Returns the Weibull distribution. | `WEIBULLDIST(105, 20, 100, true)` | Value, alpha, beta, cumulative flag. | 0.9295813900692769 |
| **ZTEST** | Returns the one-tailed probability of a z-test. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Array of numbers, hypothesized mean. | 0.09057419685136381 |

### Text

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Converts a number code to the corresponding character. | `CHAR(65)` | Number representing the character code. | A |
| **CLEAN** | Removes all non-printing characters from text. | `CLEAN('Monthly report')` | Text string to clean. | Monthly report |
| **CODE** | Returns the numeric code of the first character in a text string. | `CODE('A')` | Text string containing a single character. | 65 |
| **CONCATENATE** | Joins multiple text strings into one string. | `CONCATENATE('Andreas', ' ', 'Hauser')` | One or more text strings to join. | Andreas Hauser |
| **EXACT** | Checks whether two strings are exactly the same, case-sensitive. | `EXACT('Word', 'word')` | Two text strings to compare. | |
| **FIND** | Finds the position of a substring starting from a given position. | `FIND('M', 'Miriam McGovern', 3)` | Text to find, source text, optional start position. | 8 |
| **LEFT** | Returns a specified number of characters from the left side of a string. | `LEFT('Sale Price', 4)` | Text string and number of characters. | Sale |
| **LEN** | Returns the number of characters in a text string. | `LEN('Phoenix, AZ')` | Text string to count. | 11 |
| **LOWER** | Converts all characters to lowercase. | `LOWER('E. E. Cummings')` | Text string to convert. | e. e. cummings |
| **MID** | Returns a specified number of characters from the middle of a string. | `MID('Fluid Flow', 7, 20)` | Text string, start position, number of characters. | Flow |
| **NUMBERVALUE** | Converts text to a number using specified separators. | `NUMBERVALUE('2.500,27', ',', '.')` | Text string, decimal separator, group separator. | 2500.27 |
| **PROPER** | Capitalizes the first letter of each word. | `PROPER('this is a TITLE')` | Text string to format. | This Is A Title |
| **REPLACE** | Replaces part of a text string with new text. | `REPLACE('abcdefghijk', 6, 5, '*')` | Original text, start position, number of characters, new text. | abcde*k |
| **REPT** | Repeats text a specified number of times. | `REPT('*-', 3)` | Text string and repeat count. | *-*-*- |
| **RIGHT** | Returns a specified number of characters from the right side of a string. | `RIGHT('Sale Price', 5)` | Text string and number of characters. | Price |
| **ROMAN** | Converts an Arabic numeral to Roman numerals. | `ROMAN(499)` | Arabic number to convert. | CDXCIX |
| **SEARCH** | Finds the position of a substring, case-insensitive. | `SEARCH('margin', 'Profit Margin')` | Text to find, source text. | 8 |
| **SUBSTITUTE** | Replaces a specific instance of old text with new text. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Original text, old text, new text, optional instance number. | Quarter 1, 2012 |
| **T** | Returns the text if the value is text; otherwise returns an empty string. | `T('Rainfall')` | Argument can be any type of data. | Rainfall |
| **TRIM** | Removes spaces from text except for single spaces between words. | `TRIM(' First Quarter Earnings ')` | Text string to trim. | First Quarter Earnings |
| **TEXTJOIN** | Joins multiple text items into one string using a delimiter. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Delimiter, ignore-empty flag, text items to join. | The sun will come up tomorrow. |
| **UNICHAR** | Returns the character for a given Unicode number. | `UNICHAR(66)` | Unicode code point. | B |
| **UNICODE** | Returns the Unicode number of the first character of text. | `UNICODE('B')` | Text string containing a single character. | 66 |
| **UPPER** | Converts all characters to uppercase. | `UPPER('total')` | Text string to convert. | TOTAL |
