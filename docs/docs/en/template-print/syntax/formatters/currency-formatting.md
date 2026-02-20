### Currency Formatting

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Syntax Explanation
Formats a currency number and allows specifying the number of decimals or a particular output format.  
Parameters:
- **precisionOrFormat:** An optional parameter that can either be a number (specifying the number of decimals) or a format specifier:
  - An integer: changes the default decimal precision.
  - `'M'`: outputs only the main currency name.
  - `'L'`: outputs the number along with the currency symbol (default).
  - `'LL'`: outputs the number along with the main currency name.
- **targetCurrency:** Optional; the target currency code (in uppercase, e.g., USD, EUR) that overrides the global settings.

##### Example
```
'1000.456':formatC()      // Outputs "$2,000.91"
'1000.456':formatC('M')    // Outputs "dollars"
'1':formatC('M')           // Outputs "dollar"
'1000':formatC('L')        // Outputs "$2,000.00"
'1000':formatC('LL')       // Outputs "2,000.00 dollars"
```

##### Result
The output depends on the API options and exchange rate settings.


#### 2. :convCurr(target, source)

##### Syntax Explanation
Converts a number from one currency to another. The exchange rate can be passed via API options or set globally.  
If no parameters are specified, the conversion is automatically performed from `options.currencySource` to `options.currencyTarget`.  
Parameters:
- **target:** Optional; the target currency code (defaults to `options.currencyTarget`).
- **source:** Optional; the source currency code (defaults to `options.currencySource`).

##### Example
```
10:convCurr()              // Outputs 20
1000:convCurr()            // Outputs 2000
1000:convCurr('EUR')        // Outputs 1000
1000:convCurr('USD')        // Outputs 2000
1000:convCurr('USD', 'USD') // Outputs 1000
```

##### Result
The output is the converted currency value.