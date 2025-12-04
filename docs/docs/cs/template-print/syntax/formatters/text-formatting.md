:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


### Formátování textu

Tato sekce představuje různé formátovače pro textová data. Následující podsekce postupně popisují syntaxi, příklady a výsledky jednotlivých formátovačů.

#### 1. :lowerCase

##### Vysvětlení syntaxe
Převede všechna písmena na malá.

##### Příklad
```
'My Car':lowerCase()   // Výstup "my car"
'my car':lowerCase()   // Výstup "my car"
null:lowerCase()       // Výstup null
1203:lowerCase()       // Výstup 1203
```

##### Výsledek
Výstup každého příkladu je uveden v komentářích.


#### 2. :upperCase

##### Vysvětlení syntaxe
Převede všechna písmena na velká.

##### Příklad
```
'My Car':upperCase()   // Výstup "MY CAR"
'my car':upperCase()   // Výstup "MY CAR"
null:upperCase()       // Výstup null
1203:upperCase()       // Výstup 1203
```

##### Výsledek
Výstup každého příkladu je uveden v komentářích.


#### 3. :ucFirst

##### Vysvětlení syntaxe
Změní na velké pouze první písmeno řetězce, zbytek zůstane nezměněn.

##### Příklad
```
'My Car':ucFirst()     // Výstup "My Car"
'my car':ucFirst()     // Výstup "My car"
null:ucFirst()         // Výstup null
undefined:ucFirst()    // Výstup undefined
1203:ucFirst()         // Výstup 1203
```

##### Výsledek
Výstup je popsán v komentářích.


#### 4. :ucWords

##### Vysvětlení syntaxe
Změní na velké první písmeno každého slova v řetězci.

##### Příklad
```
'my car':ucWords()     // Výstup "My Car"
'My cAR':ucWords()     // Výstup "My CAR"
null:ucWords()         // Výstup null
undefined:ucWords()    // Výstup undefined
1203:ucWords()         // Výstup 1203
```

##### Výsledek
Výstup je zobrazen v příkladech.


#### 5. :print(message)

##### Vysvětlení syntaxe
Vždy vrátí zadanou zprávu bez ohledu na původní data, což je užitečné jako záložní formátovač.  
Parametr:
- **message:** Text k vytištění.

##### Příklad
```
'My Car':print('hello!')   // Výstup "hello!"
'my car':print('hello!')   // Výstup "hello!"
null:print('hello!')       // Výstup "hello!"
1203:print('hello!')       // Výstup "hello!"
```

##### Výsledek
Ve všech případech vrátí zadaný řetězec "hello!".


#### 6. :printJSON

##### Vysvětlení syntaxe
Převede objekt nebo pole na řetězec ve formátu JSON.

##### Příklad
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Výstup "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Výstup ""my car""
```

##### Výsledek
Výstupem je řetězec ve formátu JSON z daných dat.


#### 7. :unaccent

##### Vysvětlení syntaxe
Odstraní z textu diakritická znaménka a převede jej do neakcentovaného formátu.

##### Příklad
```
'crÃ¨me brulÃ©e':unaccent()   // Výstup "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Výstup "CREME BRULEE"
'Ãªtre':unaccent()           // Výstup "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Výstup "euieea"
```

##### Výsledek
Všechny příklady vypisují text bez diakritiky.


#### 8. :convCRLF

##### Vysvětlení syntaxe
Převede znaky pro návrat vozíku a nový řádek (`\r\n` nebo `\n`) na značky zalomení řádku specifické pro dokument. To je užitečné pro formáty jako DOCX, PPTX, ODT, ODP a ODS.  
**Poznámka:** Při použití `:html` před formátovačem `:convCRLF` se `\r\n` převede na značku `<br>`.

##### Příklad
```
// Pro formát ODT:
'my blue 
 car':convCRLF()    // Výstup "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Výstup "my blue <text:line-break/> car"

// Pro formát DOCX:
'my blue 
 car':convCRLF()    // Výstup "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Výstup "my blue </w:t><w:br/><w:t> car"
```

##### Výsledek
Výstup zobrazuje značky zalomení řádku odpovídající cílovému formátu dokumentu.


#### 9. :substr(begin, end, wordMode)

##### Vysvětlení syntaxe
Provádí operace podřetězce na řetězci, začíná na indexu `begin` (založeno na 0) a končí těsně před indexem `end`.  
Volitelný parametr `wordMode` (logická hodnota nebo `last`) řídí, zda se má zabránit rozdělení slova uprostřed.

##### Příklad
```
'foobar':substr(0, 3)            // Výstup "foo"
'foobar':substr(1)               // Výstup "oobar"
'foobar':substr(-2)              // Výstup "ar"
'foobar':substr(2, -1)           // Výstup "oba"
'abcd efg hijklm':substr(0, 11, true)  // Výstup "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Výstup "abcd efg "
```

##### Výsledek
Výstupem je podřetězec extrahovaný podle parametrů.


#### 10. :split(delimiter)

##### Vysvětlení syntaxe
Rozdělí řetězec na pole pomocí zadaného oddělovače `delimiter`.  
Parametr:
- **delimiter:** Řetězec oddělovače.

##### Příklad
```
'abcdefc12':split('c')    // Výstup ["ab", "def", "12"]
1222.1:split('.')         // Výstup ["1222", "1"]
'ab/cd/ef':split('/')      // Výstup ["ab", "cd", "ef"]
```

##### Výsledek
Výsledkem příkladu je pole rozdělené daným oddělovačem.


#### 11. :padl(targetLength, padString)

##### Vysvětlení syntaxe
Vyplní levou stranu řetězce zadaným znakem, dokud konečná délka řetězce nedosáhne `targetLength`.  
Pokud je cílová délka menší než původní délka řetězce, vrátí se původní řetězec.  
Parametry:
- **targetLength:** Požadovaná celková délka.
- **padString:** Řetězec použitý pro vyplnění (výchozí je mezera).

##### Příklad
```
'abc':padl(10)              // Výstup "       abc"
'abc':padl(10, 'foo')       // Výstup "foofoofabc"
'abc':padl(6, '123465')     // Výstup "123abc"
'abc':padl(8, '0')          // Výstup "00000abc"
'abc':padl(1)               // Výstup "abc"
```

##### Výsledek
Každý příklad vypisuje řetězec vyplněný zleva.


#### 12. :padr(targetLength, padString)

##### Vysvětlení syntaxe
Vyplní pravou stranu řetězce zadaným znakem, dokud konečná délka řetězce nedosáhne `targetLength`.  
Parametry jsou stejné jako pro `:padl`.

##### Příklad
```
'abc':padr(10)              // Výstup "abc       "
'abc':padr(10, 'foo')       // Výstup "abcfoofoof"
'abc':padr(6, '123465')     // Výstup "abc123"
'abc':padr(8, '0')          // Výstup "abc00000"
'abc':padr(1)               // Výstup "abc"
```

##### Výsledek
Výstup zobrazuje řetězec vyplněný zprava.


#### 13. :ellipsis(maximum)

##### Vysvětlení syntaxe
Pokud text přesáhne zadaný počet znaků, připojí se na konec tři tečky ("...").  
Parametr:
- **maximum:** Maximální povolený počet znaků.

##### Příklad
```
'abcdef':ellipsis(3)      // Výstup "abc..."
'abcdef':ellipsis(6)      // Výstup "abcdef"
'abcdef':ellipsis(10)     // Výstup "abcdef"
```

##### Výsledek
Příklady ukazují text zkrácený a doplněný třemi tečkami, pokud je to nutné.


#### 14. :prepend(textToPrepend)

##### Vysvětlení syntaxe
Přidá zadaný text na začátek řetězce.  
Parametr:
- **textToPrepend:** Text předpony.

##### Příklad
```
'abcdef':prepend('123')     // Výstup "123abcdef"
```

##### Výsledek
Výstup zobrazuje text s přidanou zadanou předponou.


#### 15. :append(textToAppend)

##### Vysvětlení syntaxe
Přidá zadaný text na konec řetězce.  
Parametr:
- **textToAppend:** Text přípony.

##### Příklad
```
'abcdef':append('123')      // Výstup "abcdef123"
```

##### Výsledek
Výstup zobrazuje text s přidanou zadanou příponou.


#### 16. :replace(oldText, newText)

##### Vysvětlení syntaxe
Nahradí všechny výskyty `oldText` v textu za `newText`.  
Parametry:
- **oldText:** Text, který má být nahrazen.
- **newText:** Nový text, kterým se má nahradit.  
  **Poznámka:** Pokud je `newText` null, znamená to, že odpovídající text by měl být odstraněn.

##### Příklad
```
'abcdef abcde':replace('cd', 'OK')    // Výstup "abOKef abOKe"
'abcdef abcde':replace('cd')          // Výstup "abef abe"
'abcdef abcde':replace('cd', null)      // Výstup "abef abe"
'abcdef abcde':replace('cd', 1000)      // Výstup "ab1000ef ab1000e"
```

##### Výsledek
Výstupem je text po nahrazení zadaných segmentů.


#### 17. :len

##### Vysvětlení syntaxe
Vrátí délku řetězce nebo pole.

##### Příklad
```
'Hello World':len()     // Výstup 11
'':len()                // Výstup 0
[1,2,3,4,5]:len()       // Výstup 5
[1,'Hello']:len()       // Výstup 2
```

##### Výsledek
Vypíše odpovídající délku jako číslo.


#### 18. :t

##### Vysvětlení syntaxe
Přeloží text pomocí překladového slovníku.  
Příklady a výsledky závisí na aktuální konfiguraci překladového slovníku.


#### 19. :preserveCharRef

##### Vysvětlení syntaxe
Ve výchozím nastavení jsou z XML odstraněny některé neplatné znaky (například `&`, `>`, `<`, atd.). Tento formátovač zachovává reference znaků (například `&#xa7;` zůstává nezměněn) a je vhodný pro specifické scénáře generování XML.  
Příklady a výsledky závisí na konkrétním scénáři použití.