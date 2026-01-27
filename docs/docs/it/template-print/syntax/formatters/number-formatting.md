:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

### Formattazione Numerica

#### 1. :formatN(precision)

##### Spiegazione della Sintassi
Formatta un numero in base alle impostazioni di localizzazione.  
Parametro:
- precision: Il numero di cifre decimali.  
  Per i formati ODS/XLSX, il numero di decimali visualizzati è determinato dall'editor di testo; per gli altri formati, si utilizza questo parametro.

##### Esempio
```
// Esempio ambiente: opzioni API { "lang": "en-us" }
'10':formatN()         // Output "10.000"
'1000.456':formatN()   // Output "1,000.456"
```

##### Risultato
Il numero viene restituito secondo la precisione specificata e il formato di localizzazione.


#### 2. :round(precision)

##### Spiegazione della Sintassi
Arrotonda il numero al numero di cifre decimali specificato.

##### Esempio
```
10.05123:round(2)      // Output 10.05
1.05:round(1)          // Output 1.1
```

##### Risultato
Il risultato è il numero arrotondato alla precisione indicata.


#### 3. :add(value)

##### Spiegazione della Sintassi
Aggiunge il valore specificato al numero corrente.  
Parametro:
- value: Il numero da aggiungere.

##### Esempio
```
1000.4:add(2)         // Output 1002.4
'1000.4':add('2')      // Output 1002.4
```

##### Risultato
Il risultato è la somma del numero corrente e del valore specificato.


#### 4. :sub(value)

##### Spiegazione della Sintassi
Sottrae il valore specificato dal numero corrente.  
Parametro:
- value: Il numero da sottrarre.

##### Esempio
```
1000.4:sub(2)         // Output 998.4
'1000.4':sub('2')      // Output 998.4
```

##### Risultato
Il risultato è il numero corrente meno il valore specificato.


#### 5. :mul(value)

##### Spiegazione della Sintassi
Moltiplica il numero corrente per il valore specificato.  
Parametro:
- value: Il moltiplicatore.

##### Esempio
```
1000.4:mul(2)         // Output 2000.8
'1000.4':mul('2')      // Output 2000.8
```

##### Risultato
Il risultato è il prodotto del numero corrente e del valore specificato.


#### 6. :div(value)

##### Spiegazione della Sintassi
Divide il numero corrente per il valore specificato.  
Parametro:
- value: Il divisore.

##### Esempio
```
1000.4:div(2)         // Output 500.2
'1000.4':div('2')      // Output 500.2
```

##### Risultato
Il risultato è il quoziente della divisione.


#### 7. :mod(value)

##### Spiegazione della Sintassi
Calcola il modulo (resto) del numero corrente diviso per il valore specificato.  
Parametro:
- value: Il divisore del modulo.

##### Esempio
```
4:mod(2)              // Output 0
3:mod(2)              // Output 1
```

##### Risultato
Il risultato è il resto dell'operazione di modulo.


#### 8. :abs

##### Spiegazione della Sintassi
Restituisce il valore assoluto del numero.

##### Esempio
```
-10:abs()             // Output 10
-10.54:abs()          // Output 10.54
10.54:abs()           // Output 10.54
'-200':abs()          // Output 200
```

##### Risultato
Il risultato è il valore assoluto del numero di input.


#### 9. :ceil

##### Spiegazione della Sintassi
Arrotonda il numero per eccesso all'intero più piccolo maggiore o uguale al numero corrente.

##### Esempio
```
10.05123:ceil()       // Output 11
1.05:ceil()           // Output 2
-1.05:ceil()          // Output -1
```

##### Risultato
Il risultato è il numero arrotondato per eccesso all'intero più vicino.


#### 10. :floor

##### Spiegazione della Sintassi
Arrotonda il numero per difetto all'intero più grande minore o uguale al numero corrente.

##### Esempio
```
10.05123:floor()      // Output 10
1.05:floor()          // Output 1
-1.05:floor()         // Output -2
```

##### Risultato
Il risultato è il numero arrotondato per difetto all'intero più vicino.


#### 11. :int

##### Spiegazione della Sintassi
Converte il numero in un intero (sconsigliato).

##### Esempio e Risultato
Dipende dal caso di conversione specifico.


#### 12. :toEN

##### Spiegazione della Sintassi
Converte il numero nel formato inglese (utilizzando `.` come separatore decimale). Sconsigliato.

##### Esempio e Risultato
Dipende dal caso di conversione specifico.


#### 13. :toFixed

##### Spiegazione della Sintassi
Converte il numero in una stringa mantenendo solo il numero specificato di cifre decimali. Sconsigliato.

##### Esempio e Risultato
Dipende dal caso di conversione specifico.


#### 14. :toFR

##### Spiegazione della Sintassi
Converte il numero nel formato francese (utilizzando `,` come separatore decimale). Sconsigliato.

##### Esempio e Risultato
Dipende dal caso di conversione specifico.