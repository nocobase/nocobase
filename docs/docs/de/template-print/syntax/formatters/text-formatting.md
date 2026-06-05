:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

### Textformatierung

Dieser Abschnitt stellt verschiedene Formatierer für Textdaten vor. In den folgenden Unterabschnitten werden Syntax, Beispiele und Ergebnisse der einzelnen Formatierer erläutert.

#### 1. :lowerCase

##### Syntax-Erklärung
Wandelt alle Buchstaben in Kleinbuchstaben um.

##### Beispiel
```
'My Car':lowerCase()   // Ergibt "my car"
'my car':lowerCase()   // Ergibt "my car"
null:lowerCase()       // Ergibt null
1203:lowerCase()       // Ergibt 1203
```

##### Ergebnis
Die Ausgabe jedes Beispiels ist in den Kommentaren angegeben.

#### 2. :upperCase

##### Syntax-Erklärung
Wandelt alle Buchstaben in Großbuchstaben um.

##### Beispiel
```
'My Car':upperCase()   // Ergibt "MY CAR"
'my car':upperCase()   // Ergibt "MY CAR"
null:upperCase()       // Ergibt null
1203:upperCase()       // Ergibt 1203
```

##### Ergebnis
Die Ausgabe jedes Beispiels ist in den Kommentaren angegeben.

#### 3. :ucFirst

##### Syntax-Erklärung
Wandelt nur den ersten Buchstaben des Strings in einen Großbuchstaben um, der Rest bleibt unverändert.

##### Beispiel
```
'My Car':ucFirst()     // Ergibt "My Car"
'my car':ucFirst()     // Ergibt "My car"
null:ucFirst()         // Ergibt null
undefined:ucFirst()    // Ergibt undefined
1203:ucFirst()         // Ergibt 1203
```

##### Ergebnis
Die Ausgabe ist in den Kommentaren beschrieben.

#### 4. :ucWords

##### Syntax-Erklärung
Wandelt den ersten Buchstaben jedes Wortes im String in einen Großbuchstaben um.

##### Beispiel
```
'my car':ucWords()     // Ergibt "My Car"
'My cAR':ucWords()     // Ergibt "My CAR"
null:ucWords()         // Ergibt null
undefined:ucWords()    // Ergibt undefined
1203:ucWords()         // Ergibt 1203
```

##### Ergebnis
Die Ausgabe entspricht den Beispielen.

#### 5. :print(message)

##### Syntax-Erklärung
Gibt immer die angegebene Nachricht zurück, unabhängig von den ursprünglichen Daten. Dies macht ihn zu einem nützlichen Fallback-Formatierer.  
Parameter:
- **message:** Der auszugebende Text.

##### Beispiel
```
'My Car':print('hello!')   // Ergibt "hello!"
'my car':print('hello!')   // Ergibt "hello!"
null:print('hello!')       // Ergibt "hello!"
1203:print('hello!')       // Ergibt "hello!"
```

##### Ergebnis
In allen Fällen wird der angegebene String "hello!" zurückgegeben.

#### 6. :printJSON

##### Syntax-Erklärung
Wandelt ein Objekt oder Array in einen JSON-formatierten String um.

##### Beispiel
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Ergibt "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Ergibt ""my car""
```

##### Ergebnis
Die Ausgabe ist der JSON-formatierte String der angegebenen Daten.

#### 7. :unaccent

##### Syntax-Erklärung
Entfernt diakritische Zeichen aus dem Text und wandelt ihn in ein akzentfreies Format um.

##### Beispiel
```
'crÃ¨me brulÃ©e':unaccent()   // Ergibt "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Ergibt "CREME BRULEE"
'Ãªtre':unaccent()           // Ergibt "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Ergibt "euieea"
```

##### Ergebnis
Alle Beispiele geben den Text ohne Akzente aus.

#### 8. :convCRLF

##### Syntax-Erklärung
Wandelt Wagenrücklauf- und Zeilenumbruchzeichen (`\r\n` oder `\n`) in dokumentspezifische Zeilenumbruch-Tags um. Dies ist nützlich für Formate wie DOCX, PPTX, ODT, ODP und ODS.  
**Hinweis:** Wenn Sie `:html` vor `:convCRLF` verwenden, wird `\r\n` in ein `<br>`-Tag umgewandelt.

##### Beispiel
```
// Für ODT-Format:
'my blue 
 car':convCRLF()    // Ergibt "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Ergibt "my blue <text:line-break/> car"

// Für DOCX-Format:
'my blue 
 car':convCRLF()    // Ergibt "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Ergibt "my blue </w:t><w:br/><w:t> car"
```

##### Ergebnis
Die Ausgabe zeigt die für das Zieldokumentformat geeigneten Zeilenumbruch-Marker an.

#### 9. :substr(begin, end, wordMode)

##### Syntax-Erklärung
Führt Substring-Operationen auf einem String aus, beginnend bei Index `begin` (0-basiert) und endend kurz vor Index `end`.  
Ein optionaler Parameter `wordMode` (Boolescher Wert oder `last`) steuert, ob ein Wort nicht in der Mitte getrennt werden soll, um die Wortintegrität zu bewahren.

##### Beispiel
```
'foobar':substr(0, 3)            // Ergibt "foo"
'foobar':substr(1)               // Ergibt "oobar"
'foobar':substr(-2)              // Ergibt "ar"
'foobar':substr(2, -1)           // Ergibt "oba"
'abcd efg hijklm':substr(0, 11, true)  // Ergibt "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Ergibt "abcd efg "
```

##### Ergebnis
Die Ausgabe ist der gemäß den Parametern extrahierte Substring.

#### 10. :split(delimiter)

##### Syntax-Erklärung
Teilt einen String mithilfe des angegebenen Trennzeichens `delimiter` in ein Array auf.  
Parameter:
- **delimiter:** Der Trennstring.

##### Beispiel
```
'abcdefc12':split('c')    // Ergibt ["ab", "def", "12"]
1222.1:split('.')         // Ergibt ["1222", "1"]
'ab/cd/ef':split('/')      // Ergibt ["ab", "cd", "ef"]
```

##### Ergebnis
Das Beispiel ergibt ein Array, das durch das angegebene Trennzeichen geteilt wurde.

#### 11. :padl(targetLength, padString)

##### Syntax-Erklärung
Füllt die linke Seite eines Strings mit einem angegebenen Zeichen auf, bis der endgültige String die `targetLength` erreicht.  
Ist die Ziellänge kleiner als die ursprüngliche Stringlänge, wird der ursprüngliche String zurückgegeben.  
Parameter:
- **targetLength:** Die gewünschte Gesamtlänge.
- **padString:** Der String, der zum Auffüllen verwendet wird (Standard ist ein Leerzeichen).

##### Beispiel
```
'abc':padl(10)              // Ergibt "       abc"
'abc':padl(10, 'foo')       // Ergibt "foofoofabc"
'abc':padl(6, '123465')     // Ergibt "123abc"
'abc':padl(8, '0')          // Ergibt "00000abc"
'abc':padl(1)               // Ergibt "abc"
```

##### Ergebnis
Jedes Beispiel gibt den entsprechend links aufgefüllten String aus.

#### 12. :padr(targetLength, padString)

##### Syntax-Erklärung
Füllt die rechte Seite eines Strings mit einem angegebenen Zeichen auf, bis der endgültige String die `targetLength` erreicht.  
Die Parameter sind dieselben wie für `:padl`.

##### Beispiel
```
'abc':padr(10)              // Ergibt "abc       "
'abc':padr(10, 'foo')       // Ergibt "abcfoofoof"
'abc':padr(6, '123465')     // Ergibt "abc123"
'abc':padr(8, '0')          // Ergibt "abc00000"
'abc':padr(1)               // Ergibt "abc"
```

##### Ergebnis
Die Ausgabe zeigt den rechts aufgefüllten String.

#### 13. :ellipsis(maximum)

##### Syntax-Erklärung
Wenn der Text die angegebene Zeichenanzahl überschreitet, wird am Ende ein Auslassungszeichen ("...") angehängt.  
Parameter:
- **maximum:** Die maximal zulässige Zeichenanzahl.

##### Beispiel
```
'abcdef':ellipsis(3)      // Ergibt "abc..."
'abcdef':ellipsis(6)      // Ergibt "abcdef"
'abcdef':ellipsis(10)     // Ergibt "abcdef"
```

##### Ergebnis
Die Beispiele zeigen den bei Bedarf gekürzten und mit einem Auslassungszeichen versehenen Text.

#### 14. :prepend(textToPrepend)

##### Syntax-Erklärung
Fügt den angegebenen Text als Präfix an den Anfang des Strings an.  
Parameter:
- **textToPrepend:** Der Präfix-Text.

##### Beispiel
```
'abcdef':prepend('123')     // Ergibt "123abcdef"
```

##### Ergebnis
Die Ausgabe zeigt den Text mit dem hinzugefügten Präfix.

#### 15. :append(textToAppend)

##### Syntax-Erklärung
Fügt den angegebenen Text als Suffix an das Ende des Strings an.  
Parameter:
- **textToAppend:** Der Suffix-Text.

##### Beispiel
```
'abcdef':append('123')      // Ergibt "abcdef123"
```

##### Ergebnis
Die Ausgabe zeigt den Text mit dem hinzugefügten Suffix.

#### 16. :replace(oldText, newText)

##### Syntax-Erklärung
Ersetzt alle Vorkommen von `oldText` im Text durch `newText`.  
Parameter:
- **oldText:** Der zu ersetzende Text.
- **newText:** Der neue Text, der eingesetzt werden soll.  
  **Hinweis:** Wenn `newText` null ist, bedeutet dies, dass der übereinstimmende Text entfernt werden soll.

##### Beispiel
```
'abcdef abcde':replace('cd', 'OK')    // Ergibt "abOKef abOKe"
'abcdef abcde':replace('cd')          // Ergibt "abef abe"
'abcdef abcde':replace('cd', null)      // Ergibt "abef abe"
'abcdef abcde':replace('cd', 1000)      // Ergibt "ab1000ef ab1000e"
```

##### Ergebnis
Die Ausgabe ist der Text nach dem Ersetzen der angegebenen Segmente.

#### 17. :len

##### Syntax-Erklärung
Gibt die Länge eines Strings oder eines Arrays zurück.

##### Beispiel
```
'Hello World':len()     // Ergibt 11
'':len()                // Ergibt 0
[1,2,3,4,5]:len()       // Ergibt 5
[1,'Hello']:len()       // Ergibt 2
```

##### Ergebnis
Gibt die entsprechende Länge als Zahl aus.

#### 18. :t

##### Syntax-Erklärung
Übersetzt den Text mithilfe eines Übersetzungs-Wörterbuchs.  
Beispiele und Ergebnisse hängen von der tatsächlichen Konfiguration des Übersetzungs-Wörterbuchs ab.

#### 19. :preserveCharRef

##### Syntax-Erklärung
Standardmäßig werden bestimmte ungültige Zeichen aus XML (wie `&`, `>`, `<`, usw.) entfernt. Dieser Formatierer bewahrt Zeichenreferenzen (z. B. bleibt `&#xa7;` unverändert) und eignet sich für spezifische XML-Generierungsszenarien.  
Beispiele und Ergebnisse hängen vom jeweiligen Anwendungsfall ab.