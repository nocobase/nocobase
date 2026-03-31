### Text Formatting

This section provides various formatters for text data. The following subsections introduce each formatter's syntax, examples, and results.

#### 1. :lowerCase

##### Syntax Explanation
Converts all letters to lower case.

##### Example
```
'My Car':lowerCase()   // Outputs "my car"
'my car':lowerCase()   // Outputs "my car"
null:lowerCase()       // Outputs null
1203:lowerCase()       // Outputs 1203
```

##### Result
Each example outputs as indicated in the comments.


#### 2. :upperCase

##### Syntax Explanation
Converts all letters to upper case.

##### Example
```
'My Car':upperCase()   // Outputs "MY CAR"
'my car':upperCase()   // Outputs "MY CAR"
null:upperCase()       // Outputs null
1203:upperCase()       // Outputs 1203
```

##### Result
Each example outputs as indicated in the comments.


#### 3. :ucFirst

##### Syntax Explanation
Capitalizes only the first letter of the string while leaving the rest unchanged.

##### Example
```
'My Car':ucFirst()     // Outputs "My Car"
'my car':ucFirst()     // Outputs "My car"
null:ucFirst()         // Outputs null
undefined:ucFirst()    // Outputs undefined
1203:ucFirst()         // Outputs 1203
```

##### Result
The output is as described in the comments.


#### 4. :ucWords

##### Syntax Explanation
Capitalizes the first letter of each word in the string.

##### Example
```
'my car':ucWords()     // Outputs "My Car"
'My cAR':ucWords()     // Outputs "My CAR"
null:ucWords()         // Outputs null
undefined:ucWords()    // Outputs undefined
1203:ucWords()         // Outputs 1203
```

##### Result
The output is as shown in the examples.


#### 5. :print(message)

##### Syntax Explanation
Always returns the specified message regardless of the original data, making it useful as a fallback formatter.  
Parameter:
- **message:** The text to print.

##### Example
```
'My Car':print('hello!')   // Outputs "hello!"
'my car':print('hello!')   // Outputs "hello!"
null:print('hello!')       // Outputs "hello!"
1203:print('hello!')       // Outputs "hello!"
```

##### Result
Returns the specified string "hello!" in all cases.


#### 6. :printJSON

##### Syntax Explanation
Converts an object or array into a JSON-formatted string.

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
The output is the JSON-formatted string of the given data.


#### 7. :unaccent

##### Syntax Explanation
Removes diacritical marks from text, converting it to an unaccented format.

##### Example
```
'crÃ¨me brulÃ©e':unaccent()   // Outputs "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Outputs "CREME BRULEE"
'Ãªtre':unaccent()           // Outputs "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Outputs "euieea"
```

##### Result
All examples output the text with accents removed.


#### 8. :convCRLF

##### Syntax Explanation
Converts carriage return and newline characters (`\r\n` or `\n`) into document-specific line break tags. This is useful for formats such as DOCX, PPTX, ODT, ODP, and ODS.  
**Note:** When using `:html` before `:convCRLF`, `\r\n` is converted to a `<br>` tag.

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
The output shows the line break markers appropriate for the target document format.


#### 9. :substr(begin, end, wordMode)

##### Syntax Explanation
Performs substring operations on a string, starting at index `begin` (0-based) and ending just before index `end`.  
An optional parameter `wordMode` (boolean or `last`) controls whether to avoid breaking a word in the middle.

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
The output is the substring extracted according to the parameters.


#### 10. :split(delimiter)

##### Syntax Explanation
Splits a string into an array using the specified delimiter.  
Parameter:
- **delimiter:** The delimiter string.

##### Example
```
'abcdefc12':split('c')    // Outputs ["ab", "def", "12"]
1222.1:split('.')         // Outputs ["1222", "1"]
'ab/cd/ef':split('/')      // Outputs ["ab", "cd", "ef"]
```

##### Result
The example results in an array split by the given delimiter.


#### 11. :padl(targetLength, padString)

##### Syntax Explanation
Pads the left side of a string with a specified character until the final string reaches `targetLength`.  
If the target length is less than the original string length, the original string is returned.  
Parameters:
- **targetLength:** The desired total length.
- **padString:** The string used for padding (default is a space).

##### Example
```
'abc':padl(10)              // Outputs "       abc"
'abc':padl(10, 'foo')       // Outputs "foofoofabc"
'abc':padl(6, '123465')     // Outputs "123abc"
'abc':padl(8, '0')          // Outputs "00000abc"
'abc':padl(1)               // Outputs "abc"
```

##### Result
Each example outputs the string padded on the left accordingly.


#### 12. :padr(targetLength, padString)

##### Syntax Explanation
Pads the right side of a string with a specified character until the final string reaches `targetLength`.  
Parameters are the same as for `:padl`.

##### Example
```
'abc':padr(10)              // Outputs "abc       "
'abc':padr(10, 'foo')       // Outputs "abcfoofoof"
'abc':padr(6, '123465')     // Outputs "abc123"
'abc':padr(8, '0')          // Outputs "abc00000"
'abc':padr(1)               // Outputs "abc"
```

##### Result
The output shows the string padded on the right.


#### 13. :ellipsis(maximum)

##### Syntax Explanation
If the text exceeds the specified number of characters, appends an ellipsis ("...") at the end.  
Parameter:
- **maximum:** The maximum allowed number of characters.

##### Example
```
'abcdef':ellipsis(3)      // Outputs "abc..."
'abcdef':ellipsis(6)      // Outputs "abcdef"
'abcdef':ellipsis(10)     // Outputs "abcdef"
```

##### Result
The examples show text truncated and appended with an ellipsis if needed.


#### 14. :prepend(textToPrepend)

##### Syntax Explanation
Prepends the specified text to the beginning of the string.  
Parameter:
- **textToPrepend:** The prefix text.

##### Example
```
'abcdef':prepend('123')     // Outputs "123abcdef"
```

##### Result
The output shows the text with the specified prefix added.


#### 15. :append(textToAppend)

##### Syntax Explanation
Appends the specified text to the end of the string.  
Parameter:
- **textToAppend:** The suffix text.

##### Example
```
'abcdef':append('123')      // Outputs "abcdef123"
```

##### Result
The output shows the text with the specified suffix added.


#### 16. :replace(oldText, newText)

##### Syntax Explanation
Replaces all occurrences of `oldText` in the text with `newText`.  
Parameters:
- **oldText:** The text to be replaced.
- **newText:** The new text to replace with.  
  **Note:** If `newText` is null, it indicates that the matching text should be removed.

##### Example
```
'abcdef abcde':replace('cd', 'OK')    // Outputs "abOKef abOKe"
'abcdef abcde':replace('cd')          // Outputs "abef abe"
'abcdef abcde':replace('cd', null)      // Outputs "abef abe"
'abcdef abcde':replace('cd', 1000)      // Outputs "ab1000ef ab1000e"
```

##### Result
The output is the text after replacing the specified segments.


#### 17. :len

##### Syntax Explanation
Returns the length of a string or an array.

##### Example
```
'Hello World':len()     // Outputs 11
'':len()                // Outputs 0
[1,2,3,4,5]:len()       // Outputs 5
[1,'Hello']:len()       // Outputs 2
```

##### Result
Outputs the corresponding length as a number.


#### 18. :t

##### Syntax Explanation
Translates the text using a translation dictionary.  
Examples and results depend on the actual translation dictionary configuration.


#### 19. :preserveCharRef

##### Syntax Explanation
By default, certain illegal characters from XML (such as `&`, `>`, `<`, etc.) are removed. This formatter preserves character references (for example, `&#xa7;` remains unchanged) and is suitable for specific XML generation scenarios.  
Examples and results depend on the specific use case.