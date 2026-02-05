:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

### Formattazione del Testo

Questa sezione presenta diversi formattatori per i dati testuali. Nelle sottosezioni seguenti, esploreremo la sintassi, gli esempi e i risultati di ciascun formattatore.

#### 1. :lowerCase

##### Spiegazione della Sintassi
Converte tutte le lettere in minuscolo.

##### Esempio
```
'My Car':lowerCase()   // Outputs "my car"
'my car':lowerCase()   // Outputs "my car"
null:lowerCase()       // Outputs null
1203:lowerCase()       // Outputs 1203
```

##### Risultato
L'output di ciascun esempio è indicato nei commenti.


#### 2. :upperCase

##### Spiegazione della Sintassi
Converte tutte le lettere in maiuscolo.

##### Esempio
```
'My Car':upperCase()   // Outputs "MY CAR"
'my car':upperCase()   // Outputs "MY CAR"
null:upperCase()       // Outputs null
1203:upperCase()       // Outputs 1203
```

##### Risultato
L'output di ciascun esempio è indicato nei commenti.


#### 3. :ucFirst

##### Spiegazione della Sintassi
Converte in maiuscolo solo la prima lettera della stringa, lasciando il resto invariato.

##### Esempio
```
'My Car':ucFirst()     // Outputs "My Car"
'my car':ucFirst()     // Outputs "My car"
null:ucFirst()         // Outputs null
undefined:ucFirst()    // Outputs undefined
1203:ucFirst()         // Outputs 1203
```

##### Risultato
L'output è quello descritto nei commenti.


#### 4. :ucWords

##### Spiegazione della Sintassi
Converte in maiuscolo la prima lettera di ogni parola nella stringa.

##### Esempio
```
'my car':ucWords()     // Outputs "My Car"
'My cAR':ucWords()     // Outputs "My CAR"
null:ucWords()         // Outputs null
undefined:ucWords()    // Outputs undefined
1203:ucWords()         // Outputs 1203
```

##### Risultato
L'output è quello mostrato negli esempi.


#### 5. :print(message)

##### Spiegazione della Sintassi
Restituisce sempre il messaggio specificato, indipendentemente dai dati originali, rendendolo utile come formattatore di fallback.
Parametro:
- `message`: Il testo da stampare.

##### Esempio
```
'My Car':print('hello!')   // Outputs "hello!"
'my car':print('hello!')   // Outputs "hello!"
null:print('hello!')       // Outputs "hello!"
1203:print('hello!')       // Outputs "hello!"
```

##### Risultato
In tutti i casi, restituisce la stringa specificata "hello!".


#### 6. :printJSON

##### Spiegazione della Sintassi
Converte un oggetto o un array in una stringa in formato JSON.

##### Esempio
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Outputs "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Outputs ""my car""
```

##### Risultato
L'output è la stringa in formato JSON dei dati forniti.


#### 7. :unaccent

##### Spiegazione della Sintassi
Rimuove i segni diacritici dal testo, convertendolo in un formato senza accenti.

##### Esempio
```
'crÃ¨me brulÃ©e':unaccent()   // Outputs "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Outputs "CREME BRULEE"
'Ãªtre':unaccent()           // Outputs "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Outputs "euieea"
```

##### Risultato
Tutti gli esempi restituiscono il testo senza accenti.


#### 8. :convCRLF

##### Spiegazione della Sintassi
Converte i caratteri di ritorno a capo e nuova riga (`\r\n` o `\n`) in tag di interruzione di riga specifici del documento. Questo è utile per formati come DOCX, PPTX, ODT, ODP e ODS.
**Nota:** Quando si utilizza `:html` prima del formattatore `:convCRLF`, `\r\n` viene convertito in un tag `<br>`.

##### Esempio
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

##### Risultato
L'output mostra i marcatori di interruzione di riga appropriati per il formato del documento di destinazione.


#### 9. :substr(begin, end, wordMode)

##### Spiegazione della Sintassi
Esegue operazioni di sottostringa su una stringa, partendo dall'indice `begin` (base 0) e terminando appena prima dell'indice `end`.
Un parametro opzionale `wordMode` (booleano o `last`) controlla se mantenere l'integrità delle parole, evitando di spezzarle a metà.

##### Esempio
```
'foobar':substr(0, 3)            // Outputs "foo"
'foobar':substr(1)               // Outputs "oobar"
'foobar':substr(-2)              // Outputs "ar"
'foobar':substr(2, -1)           // Outputs "oba"
'abcd efg hijklm':substr(0, 11, true)  // Outputs "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Outputs "abcd efg "
```

##### Risultato
L'output è la sottostringa estratta in base ai parametri.


#### 10. :split(delimiter)

##### Spiegazione della Sintassi
Divide una stringa in un array utilizzando il delimitatore specificato.
Parametro:
- `delimiter`: La stringa delimitatrice.

##### Esempio
```
'abcdefc12':split('c')    // Outputs ["ab", "def", "12"]
1222.1:split('.')         // Outputs ["1222", "1"]
'ab/cd/ef':split('/')      // Outputs ["ab", "cd", "ef"]
```

##### Risultato
L'esempio restituisce un array diviso dal delimitatore fornito.


#### 11. :padl(targetLength, padString)

##### Spiegazione della Sintassi
Riempie il lato sinistro di una stringa con un carattere specificato fino a quando la stringa finale raggiunge `targetLength`.
Se la lunghezza target è inferiore alla lunghezza della stringa originale, viene restituita la stringa originale.
Parametri:
- `targetLength`: La lunghezza totale desiderata.
- `padString`: La stringa utilizzata per il riempimento (il valore predefinito è uno spazio).

##### Esempio
```
'abc':padl(10)              // Outputs "       abc"
'abc':padl(10, 'foo')       // Outputs "foofoofabc"
'abc':padl(6, '123465')     // Outputs "123abc"
'abc':padl(8, '0')          // Outputs "00000abc"
'abc':padl(1)               // Outputs "abc"
```

##### Risultato
Ogni esempio restituisce la stringa riempita a sinistra di conseguenza.


#### 12. :padr(targetLength, padString)

##### Spiegazione della Sintassi
Riempie il lato destro di una stringa con un carattere specificato fino a quando la stringa finale raggiunge `targetLength`.
I parametri sono gli stessi di `:padl`.

##### Esempio
```
'abc':padr(10)              // Outputs "abc       "
'abc':padr(10, 'foo')       // Outputs "abcfoofoof"
'abc':padr(6, '123465')     // Outputs "abc123"
'abc':padr(8, '0')          // Outputs "abc00000"
'abc':padr(1)               // Outputs "abc"
```

##### Risultato
L'output mostra la stringa riempita a destra.


#### 13. :ellipsis(maximum)

##### Spiegazione della Sintassi
Se il testo supera il numero di caratteri specificato, aggiunge un'ellissi ("...") alla fine.
Parametro:
- `maximum`: Il numero massimo di caratteri consentito.

##### Esempio
```
'abcdef':ellipsis(3)      // Outputs "abc..."
'abcdef':ellipsis(6)      // Outputs "abcdef"
'abcdef':ellipsis(10)     // Outputs "abcdef"
```

##### Risultato
Gli esempi mostrano il testo troncato e, se necessario, con l'aggiunta di un'ellissi.


#### 14. :prepend(textToPrepend)

##### Spiegazione della Sintassi
Aggiunge il testo specificato all'inizio della stringa.
Parametro:
- `textToPrepend`: Il testo del prefisso.

##### Esempio
```
'abcdef':prepend('123')     // Outputs "123abcdef"
```

##### Risultato
L'output mostra il testo con il prefisso specificato aggiunto.


#### 15. :append(textToAppend)

##### Spiegazione della Sintassi
Aggiunge il testo specificato alla fine della stringa.
Parametro:
- `textToAppend`: Il testo del suffisso.

##### Esempio
```
'abcdef':append('123')      // Outputs "abcdef123"
```

##### Risultato
L'output mostra il testo con il suffisso specificato aggiunto.


#### 16. :replace(oldText, newText)

##### Spiegazione della Sintassi
Sostituisce tutte le occorrenze di `oldText` nel testo con `newText`.
Parametri:
- `oldText`: Il testo da sostituire.
- `newText`: Il nuovo testo con cui sostituire.
**Nota:** Se `newText` è `null`, indica che il testo corrispondente deve essere rimosso.

##### Esempio
```
'abcdef abcde':replace('cd', 'OK')    // Outputs "abOKef abOKe"
'abcdef abcde':replace('cd')          // Outputs "abef abe"
'abcdef abcde':replace('cd', null)      // Outputs "abef abe"
'abcdef abcde':replace('cd', 1000)      // Outputs "ab1000ef ab1000e"
```

##### Risultato
L'output è il testo dopo aver sostituito i segmenti specificati.


#### 17. :len

##### Spiegazione della Sintassi
Restituisce la lunghezza di una stringa o di un array.

##### Esempio
```
'Hello World':len()     // Outputs 11
'':len()                // Outputs 0
[1,2,3,4,5]:len()       // Outputs 5
[1,'Hello']:len()       // Outputs 2
```

##### Risultato
Restituisce la lunghezza corrispondente come numero.


#### 18. :t

##### Spiegazione della Sintassi
Traduce il testo utilizzando un dizionario di traduzione.
Gli esempi e i risultati dipendono dalla configurazione effettiva del dizionario di traduzione.


#### 19. :preserveCharRef

##### Spiegazione della Sintassi
Per impostazione predefinita, alcuni caratteri non validi in XML (come `&`, `>`, `<`, ecc.) vengono rimossi. Questo formattatore preserva i riferimenti ai caratteri (ad esempio, `&#xa7;` rimane invariato) ed è adatto per scenari specifici di generazione XML.
Gli esempi e i risultati dipendono dal caso d'uso specifico.