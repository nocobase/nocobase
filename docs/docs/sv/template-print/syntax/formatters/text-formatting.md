:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

### Textformatering

Här beskriver vi de olika formaterare som finns för textdata. I de följande underavsnitten går vi igenom varje formaterares syntax, exempel och förväntade resultat.

#### 1. :lowerCase

##### Syntaxbeskrivning
Konverterar alla bokstäver till gemener (små bokstäver).

##### Exempel
```
'My Car':lowerCase()   // Ger "my car"
'my car':lowerCase()   // Ger "my car"
null:lowerCase()       // Ger null
1203:lowerCase()       // Ger 1203
```

##### Resultat
Resultatet för varje exempel visas i kommentarerna.


#### 2. :upperCase

##### Syntaxbeskrivning
Konverterar alla bokstäver till versaler (stora bokstäver).

##### Exempel
```
'My Car':upperCase()   // Ger "MY CAR"
'my car':upperCase()   // Ger "MY CAR"
null:upperCase()       // Ger null
1203:upperCase()       // Ger 1203
```

##### Resultat
Resultatet för varje exempel visas i kommentarerna.


#### 3. :ucFirst

##### Syntaxbeskrivning
Gör endast den första bokstaven i strängen till en versal, resten förblir oförändrad.

##### Exempel
```
'My Car':ucFirst()     // Ger "My Car"
'my car':ucFirst()     // Ger "My car"
null:ucFirst()         // Ger null
undefined:ucFirst()    // Ger undefined
1203:ucFirst()         // Ger 1203
```

##### Resultat
Resultatet beskrivs i kommentarerna.


#### 4. :ucWords

##### Syntaxbeskrivning
Gör den första bokstaven i varje ord i strängen till en versal.

##### Exempel
```
'my car':ucWords()     // Ger "My Car"
'My cAR':ucWords()     // Ger "My CAR"
null:ucWords()         // Ger null
undefined:ucWords()    // Ger undefined
1203:ucWords()         // Ger 1203
```

##### Resultat
Resultatet visas i exemplen.


#### 5. :print(message)

##### Syntaxbeskrivning
Returnerar alltid det angivna meddelandet, oavsett ursprungsdata. Detta gör den användbar som en "fallback"-formaterare.  
Parameter:
- **message:** Texten som ska skrivas ut.

##### Exempel
```
'My Car':print('hello!')   // Ger "hello!"
'my car':print('hello!')   // Ger "hello!"
null:print('hello!')       // Ger "hello!"
1203:print('hello!')       // Ger "hello!"
```

##### Resultat
Returnerar den angivna strängen "hello!" i samtliga fall.


#### 6. :printJSON

##### Syntaxbeskrivning
Konverterar ett objekt eller en array till en JSON-formaterad sträng.

##### Exempel
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Ger "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Ger ""my car""
```

##### Resultat
Resultatet är den JSON-formaterade strängen av den angivna datan.


#### 7. :unaccent

##### Syntaxbeskrivning
Tar bort diakritiska tecken (accenttecken) från text, vilket konverterar den till ett oaccentuerat format.

##### Exempel
```
'crÃ¨me brulÃ©e':unaccent()   // Ger "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Ger "CREME BRULEE"
'Ãªtre':unaccent()           // Ger "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Ger "euieea"
```

##### Resultat
Alla exempel visar texten med borttagna accenttecken.


#### 8. :convCRLF

##### Syntaxbeskrivning
Konverterar radmatnings- och nyradstecken (`\r\n` eller `\n`) till dokumentspecifika radbrytningstaggar. Detta är användbart för format som DOCX, PPTX, ODT, ODP och ODS.  
**Obs!** När du använder `:html` före formateraren `:convCRLF` konverteras `\r\n` till en `<br>`-tagg.

##### Exempel
```
// För ODT-format:
'my blue 
 car':convCRLF()    // Ger "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Ger "my blue <text:line-break/> car"

// För DOCX-format:
'my blue 
 car':convCRLF()    // Ger "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Ger "my blue </w:t><w:br/><w:t> car"
```

##### Resultat
Resultatet visar radbrytningsmarkörer som är lämpliga för det specifika dokumentformatet.


#### 9. :substr(begin, end, wordMode)

##### Syntaxbeskrivning
Utför delsträngsoperationer på en sträng, med start vid index `begin` (0-baserat) och slut strax före index `end`.  
En valfri parameter `wordMode` (boolean eller `last`) styr om ord ska hållas intakta och inte brytas mitt i.

##### Exempel
```
'foobar':substr(0, 3)            // Ger "foo"
'foobar':substr(1)               // Ger "oobar"
'foobar':substr(-2)              // Ger "ar"
'foobar':substr(2, -1)           // Ger "oba"
'abcd efg hijklm':substr(0, 11, true)  // Ger "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Ger "abcd efg "
```

##### Resultat
Resultatet är den delsträng som extraheras enligt parametrarna.


#### 10. :split(delimiter)

##### Syntaxbeskrivning
Delar upp en sträng i en array med hjälp av den angivna avgränsaren `delimiter`.  
Parameter:
- **delimiter:** Avgränsningssträngen.

##### Exempel
```
'abcdefc12':split('c')    // Ger ["ab", "def", "12"]
1222.1:split('.')         // Ger ["1222", "1"]
'ab/cd/ef':split('/')      // Ger ["ab", "cd", "ef"]
```

##### Resultat
Exemplet resulterar i en array som delats upp med den angivna avgränsaren.


#### 11. :padl(targetLength, padString)

##### Syntaxbeskrivning
Fyller ut strängen från vänster med ett angivet tecken tills den slutliga strängen når `targetLength`.  
Om mållängden är kortare än den ursprungliga strängens längd, returneras den ursprungliga strängen.  
Parametrar:
- **targetLength:** Den önskade totala längden.
- **padString:** Strängen som används för utfyllnad (standard är ett mellanslag).

##### Exempel
```
'abc':padl(10)              // Ger "       abc"
'abc':padl(10, 'foo')       // Ger "foofoofabc"
'abc':padl(6, '123465')     // Ger "123abc"
'abc':padl(8, '0')          // Ger "00000abc"
'abc':padl(1)               // Ger "abc"
```

##### Resultat
Varje exempel visar strängen utfylld från vänster.


#### 12. :padr(targetLength, padString)

##### Syntaxbeskrivning
Fyller ut strängen från höger med ett angivet tecken tills den slutliga strängen når `targetLength`.  
Parametrarna är desamma som för `:padl`.

##### Exempel
```
'abc':padr(10)              // Ger "abc       "
'abc':padr(10, 'foo')       // Ger "abcfoofoof"
'abc':padr(6, '123465')     // Ger "abc123"
'abc':padr(8, '0')          // Ger "abc00000"
'abc':padr(1)               // Ger "abc"
```

##### Resultat
Resultatet visar strängen utfylld från höger.


#### 13. :ellipsis(maximum)

##### Syntaxbeskrivning
Om texten överskrider det angivna antalet tecken, läggs ett utelämningstecken ("...") till i slutet.  
Parameter:
- **maximum:** Det maximala tillåtna antalet tecken.

##### Exempel
```
'abcdef':ellipsis(3)      // Ger "abc..."
'abcdef':ellipsis(6)      // Ger "abcdef"
'abcdef':ellipsis(10)     // Ger "abcdef"
```

##### Resultat
Exemplen visar text som trunkerats och, vid behov, försetts med ett utelämningstecken.


#### 14. :prepend(textToPrepend)

##### Syntaxbeskrivning
Lägger till den angivna texten som ett prefix i början av strängen.  
Parameter:
- **textToPrepend:** Prefixtexten.

##### Exempel
```
'abcdef':prepend('123')     // Ger "123abcdef"
```

##### Resultat
Resultatet visar texten med det angivna prefixet tillagt.


#### 15. :append(textToAppend)

##### Syntaxbeskrivning
Lägger till den angivna texten som ett suffix i slutet av strängen.  
Parameter:
- **textToAppend:** Suffixtexten.

##### Exempel
```
'abcdef':append('123')      // Ger "abcdef123"
```

##### Resultat
Resultatet visar texten med det angivna suffixet tillagt.


#### 16. :replace(oldText, newText)

##### Syntaxbeskrivning
Ersätter alla förekomster av `oldText` i texten med `newText`.  
Parametrar:
- **oldText:** Den text som ska ersättas.
- **newText:** Den nya texten att ersätta med.  
  **Obs!** Om `newText` är `null` innebär det att den matchande texten ska tas bort.

##### Exempel
```
'abcdef abcde':replace('cd', 'OK')    // Ger "abOKef abOKe"
'abcdef abcde':replace('cd')          // Ger "abef abe"
'abcdef abcde':replace('cd', null)      // Ger "abef abe"
'abcdef abcde':replace('cd', 1000)      // Ger "ab1000ef ab1000e"
```

##### Resultat
Resultatet är texten efter att de angivna segmenten har ersatts.


#### 17. :len

##### Syntaxbeskrivning
Returnerar längden på en sträng eller en array.

##### Exempel
```
'Hello World':len()     // Ger 11
'':len()                // Ger 0
[1,2,3,4,5]:len()       // Ger 5
[1,'Hello']:len()       // Ger 2
```

##### Resultat
Resultatet är det motsvarande längdvärdet.


#### 18. :t

##### Syntaxbeskrivning
Översätter texten med hjälp av en översättningsordbok.  
Exempel och resultat beror på den faktiska konfigurationen av översättningsordboken.


#### 19. :preserveCharRef

##### Syntaxbeskrivning
Som standard tas vissa ogiltiga tecken från XML (som `&`, `>`, `<`, etc.) bort. Denna formaterare bevarar teckenreferenser (till exempel förblir `&#xa7;` oförändrad) och är lämplig för specifika scenarier vid XML-generering.  
Exempel och resultat beror på det specifika användningsfallet.