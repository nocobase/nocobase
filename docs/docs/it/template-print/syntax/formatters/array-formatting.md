:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

### Formattazione degli Array

#### 1. :arrayJoin(separator, index, count)

##### Spiegazione della Sintassi
Unisce un array di stringhe o numeri in un'unica stringa.  
Parametri:
- **separator:** Il delimitatore (il valore predefinito è una virgola `,`).
- **index:** Opzionale; l'indice iniziale da cui iniziare l'unione.
- **count:** Opzionale; il numero di elementi da unire a partire da `index` (può essere un numero negativo per contare dalla fine).

##### Esempio
```
['homer','bart','lisa']:arrayJoin()              // Outputs "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Outputs "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Outputs "homerbartlisa"
[10,50]:arrayJoin()                               // Outputs "10, 50"
[]:arrayJoin()                                    // Outputs ""
null:arrayJoin()                                  // Outputs null
{}:arrayJoin()                                    // Outputs {}
20:arrayJoin()                                    // Outputs 20
undefined:arrayJoin()                             // Outputs undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Outputs "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Outputs "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Outputs "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Outputs "homerbart"
```

##### Risultato
L'output è una stringa creata unendo gli elementi dell'array in base ai parametri specificati.


#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Spiegazione della Sintassi
Trasforma un array di oggetti in una stringa. Non elabora oggetti o array annidati.  
Parametri:
- **objSeparator:** Il separatore tra gli oggetti (il valore predefinito è `, `).
- **attSeparator:** Il separatore tra gli attributi degli oggetti (il valore predefinito è `:`).
- **attributes:** Opzionale; un elenco di attributi degli oggetti da visualizzare.

##### Esempio
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Outputs "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Outputs "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Outputs "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Outputs "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Outputs "2:homer"

['homer','bart','lisa']:arrayMap()    // Outputs "homer, bart, lisa"
[10,50]:arrayMap()                    // Outputs "10, 50"
[]:arrayMap()                         // Outputs ""
null:arrayMap()                       // Outputs null
{}:arrayMap()                         // Outputs {}
20:arrayMap()                         // Outputs 20
undefined:arrayMap()                  // Outputs undefined
```

##### Risultato
L'output è una stringa generata mappando e unendo gli elementi dell'array, ignorando il contenuto degli oggetti annidati.


#### 3. :count(start)

##### Spiegazione della Sintassi
Conta il numero di riga in un array e visualizza il numero di riga corrente.  
Ad esempio:
```
{d[i].id:count()}
```  
Indipendentemente dal valore di `id`, visualizza il conteggio della riga corrente.  
A partire dalla v4.0.0, questo formattatore è stato sostituito internamente da `:cumCount`.

Parametro:
- **start:** Opzionale; il valore iniziale per il conteggio.

##### Esempio e Risultato
In fase di utilizzo, l'output visualizzerà il numero di riga in base alla sequenza degli elementi dell'array.