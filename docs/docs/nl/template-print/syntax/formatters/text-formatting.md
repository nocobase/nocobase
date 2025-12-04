:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

### Tekstopmaak

Deze sectie beschrijft verschillende formatters voor tekstdata. Hieronder vindt u per formatter de syntaxis, voorbeelden en de verwachte resultaten.

#### 1. :lowerCase

##### Syntaxis
Converteert alle letters naar kleine letters.

##### Voorbeeld
```
'My Car':lowerCase()   // Uitvoer "my car"
'my car':lowerCase()   // Uitvoer "my car"
null:lowerCase()       // Uitvoer null
1203:lowerCase()       // Uitvoer 1203
```

##### Resultaat
De uitvoer van elk voorbeeld wordt weergegeven in de opmerkingen.


#### 2. :upperCase

##### Syntaxis
Converteert alle letters naar hoofdletters.

##### Voorbeeld
```
'My Car':upperCase()   // Uitvoer "MY CAR"
'my car':upperCase()   // Uitvoer "MY CAR"
null:upperCase()       // Uitvoer null
1203:upperCase()       // Uitvoer 1203
```

##### Resultaat
De uitvoer van elk voorbeeld wordt weergegeven in de opmerkingen.


#### 3. :ucFirst

##### Syntaxis
Zet alleen de eerste letter van de string om naar een hoofdletter; de rest blijft ongewijzigd.

##### Voorbeeld
```
'My Car':ucFirst()     // Uitvoer "My Car"
'my car':ucFirst()     // Uitvoer "My car"
null:ucFirst()         // Uitvoer null
undefined:ucFirst()    // Uitvoer undefined
1203:ucFirst()         // Uitvoer 1203
```

##### Resultaat
De uitvoer is zoals beschreven in de opmerkingen.


#### 4. :ucWords

##### Syntaxis
Zet de eerste letter van elk woord in de string om naar een hoofdletter.

##### Voorbeeld
```
'my car':ucWords()     // Uitvoer "My Car"
'My cAR':ucWords()     // Uitvoer "My CAR"
null:ucWords()         // Uitvoer null
undefined:ucWords()    // Uitvoer undefined
1203:ucWords()         // Uitvoer 1203
```

##### Resultaat
De uitvoer is zoals weergegeven in de voorbeelden.


#### 5. :print(message)

##### Syntaxis
Retourneert altijd het opgegeven bericht, ongeacht de oorspronkelijke data. Dit maakt het een handige fallback-formatter.
Parameter:
- **message:** De tekst die u wilt afdrukken.

##### Voorbeeld
```
'My Car':print('hello!')   // Uitvoer "hello!"
'my car':print('hello!')   // Uitvoer "hello!"
null:print('hello!')       // Uitvoer "hello!"
1203:print('hello!')       // Uitvoer "hello!"
```

##### Resultaat
Retourneert in alle gevallen de opgegeven string "hello!".


#### 6. :printJSON

##### Syntaxis
Converteert een object of array naar een JSON-geformatteerde string.

##### Voorbeeld
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Uitvoer "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Uitvoer ""my car""
```

##### Resultaat
De uitvoer is de JSON-geformatteerde string van de opgegeven data.


#### 7. :unaccent

##### Syntaxis
Verwijdert diakritische tekens (accenten) uit tekst, waardoor deze een ongeaccentueerde opmaak krijgt.

##### Voorbeeld
```
'crÃ¨me brulÃ©e':unaccent()   // Uitvoer "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Uitvoer "CREME BRULEE"
'Ãªtre':unaccent()           // Uitvoer "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Uitvoer "euieea"
```

##### Resultaat
Alle voorbeelden tonen de tekst zonder accenten.


#### 8. :convCRLF

##### Syntaxis
Converteert carriage return- en newline-tekens (`\r\n` of `\n`) naar document-specifieke regeleindetags. Dit is handig voor formaten zoals DOCX, PPTX, ODT, ODP en ODS.
**Let op:** Wanneer u `:html` gebruikt vóór `:convCRLF`, wordt `\r\n` omgezet naar een `<br>`-tag.

##### Voorbeeld
```
// Voor ODT-formaat:
'my blue 
 car':convCRLF()    // Uitvoer "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Uitvoer "my blue <text:line-break/> car"

// Voor DOCX-formaat:
'my blue 
 car':convCRLF()    // Uitvoer "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Uitvoer "my blue </w:t><w:br/><w:t> car"
```

##### Resultaat
De uitvoer toont de regeleindemarkeringen die geschikt zijn voor het doeldocumentformaat.


#### 9. :substr(begin, end, wordMode)

##### Syntaxis
Voert substring-bewerkingen uit op een string, beginnend bij index `begin` (0-gebaseerd) en eindigend vlak vóór index `end`.
Een optionele parameter `wordMode` (boolean of `last`) bepaalt of woorden intact moeten blijven en niet middenin mogen worden afgebroken.

##### Voorbeeld
```
'foobar':substr(0, 3)            // Uitvoer "foo"
'foobar':substr(1)               // Uitvoer "oobar"
'foobar':substr(-2)              // Uitvoer "ar"
'foobar':substr(2, -1)           // Uitvoer "oba"
'abcd efg hijklm':substr(0, 11, true)  // Uitvoer "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Uitvoer "abcd efg "
```

##### Resultaat
De uitvoer is de substring die is geëxtraheerd volgens de parameters.


#### 10. :split(delimiter)

##### Syntaxis
Splitst een string in een array met behulp van de opgegeven `delimiter`.
Parameter:
- **delimiter:** De string die als scheidingsteken dient.

##### Voorbeeld
```
'abcdefc12':split('c')    // Uitvoer ["ab", "def", "12"]
1222.1:split('.')         // Uitvoer ["1222", "1"]
'ab/cd/ef':split('/')      // Uitvoer ["ab", "cd", "ef"]
```

##### Resultaat
Het voorbeeld resulteert in een array die is gesplitst door de opgegeven delimiter.


#### 11. :padl(targetLength, padString)

##### Syntaxis
Vult de linkerkant van een string aan met een opgegeven teken totdat de uiteindelijke string de `targetLength` bereikt.
Als de doellengte kleiner is dan de oorspronkelijke stringlengte, wordt de oorspronkelijke string geretourneerd.
Parameters:
- **targetLength:** De gewenste totale lengte.
- **padString:** De string die wordt gebruikt voor opvulling (standaard is een spatie).

##### Voorbeeld
```
'abc':padl(10)              // Uitvoer "       abc"
'abc':padl(10, 'foo')       // Uitvoer "foofoofabc"
'abc':padl(6, '123465')     // Uitvoer "123abc"
'abc':padl(8, '0')          // Uitvoer "00000abc"
'abc':padl(1)               // Uitvoer "abc"
```

##### Resultaat
Elk voorbeeld toont de string die aan de linkerkant is aangevuld.


#### 12. :padr(targetLength, padString)

##### Syntaxis
Vult de rechterkant van een string aan met een opgegeven teken totdat de uiteindelijke string de `targetLength` bereikt.
De parameters zijn hetzelfde als voor `:padl`.

##### Voorbeeld
```
'abc':padr(10)              // Uitvoer "abc       "
'abc':padr(10, 'foo')       // Uitvoer "abcfoofoof"
'abc':padr(6, '123465')     // Uitvoer "abc123"
'abc':padr(8, '0')          // Uitvoer "abc00000"
'abc':padr(1)               // Uitvoer "abc"
```

##### Resultaat
De uitvoer toont de string die aan de rechterkant is aangevuld.


#### 13. :ellipsis(maximum)

##### Syntaxis
Als de tekst het opgegeven aantal tekens overschrijdt, wordt er een weglatingsteken ("...") aan het einde toegevoegd.
Parameter:
- **maximum:** Het maximaal toegestane aantal tekens.

##### Voorbeeld
```
'abcdef':ellipsis(3)      // Uitvoer "abc..."
'abcdef':ellipsis(6)      // Uitvoer "abcdef"
'abcdef':ellipsis(10)     // Uitvoer "abcdef"
```

##### Resultaat
De voorbeelden tonen tekst die is afgebroken en, indien nodig, is aangevuld met een weglatingsteken.


#### 14. :prepend(textToPrepend)

##### Syntaxis
Voegt de opgegeven tekst toe aan het begin van de string.
Parameter:
- **textToPrepend:** De tekst die als voorvoegsel dient.

##### Voorbeeld
```
'abcdef':prepend('123')     // Uitvoer "123abcdef"
```

##### Resultaat
De uitvoer toont de tekst met het opgegeven voorvoegsel.


#### 15. :append(textToAppend)

##### Syntaxis
Voegt de opgegeven tekst toe aan het einde van de string.
Parameter:
- **textToAppend:** De tekst die als achtervoegsel dient.

##### Voorbeeld
```
'abcdef':append('123')      // Uitvoer "abcdef123"
```

##### Resultaat
De uitvoer toont de tekst met het opgegeven achtervoegsel.


#### 16. :replace(oldText, newText)

##### Syntaxis
Vervangt alle voorkomens van `oldText` in de tekst door `newText`.
Parameters:
- **oldText:** De tekst die moet worden vervangen.
- **newText:** De nieuwe tekst waarmee u wilt vervangen.
**Let op:** Als `newText` `null` is, betekent dit dat de overeenkomende tekst moet worden verwijderd.

##### Voorbeeld
```
'abcdef abcde':replace('cd', 'OK')    // Uitvoer "abOKef abOKe"
'abcdef abcde':replace('cd')          // Uitvoer "abef abe"
'abcdef abcde':replace('cd', null)      // Uitvoer "abef abe"
'abcdef abcde':replace('cd', 1000)      // Uitvoer "ab1000ef ab1000e"
```

##### Resultaat
De uitvoer is de tekst na het vervangen van de opgegeven segmenten.


#### 17. :len

##### Syntaxis
Retourneert de lengte van een string of een array.

##### Voorbeeld
```
'Hello World':len()     // Uitvoer 11
'':len()                // Uitvoer 0
[1,2,3,4,5]:len()       // Uitvoer 5
[1,'Hello']:len()       // Uitvoer 2
```

##### Resultaat
Retourneert de corresponderende lengte als een getal.


#### 18. :t

##### Syntaxis
Vertaalt de tekst met behulp van een vertaalwoordenboek.
Voorbeelden en resultaten zijn afhankelijk van de configuratie van het daadwerkelijke vertaalwoordenboek.


#### 19. :preserveCharRef

##### Syntaxis
Standaard worden bepaalde ongeldige tekens uit XML (zoals `&`, `>`, `<`, enz.) verwijderd. Deze formatter behoudt karakterreferenties (bijvoorbeeld `&#xa7;` blijft ongewijzigd) en is geschikt voor specifieke XML-generatiescenario's.
Voorbeelden en resultaten zijn afhankelijk van het specifieke gebruiksscenario.