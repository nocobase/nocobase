:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

## Condizioni

Le condizioni le permettono di controllare dinamicamente la visualizzazione o l'occultamento dei contenuti nel documento in base ai valori dei dati. Sono disponibili tre tipi principali di sintassi per le condizioni:

- **Condizioni inline**: Permettono di visualizzare direttamente del testo (o di sostituirlo con altro testo).
- **Blocchi condizionali**: Servono a mostrare o nascondere una sezione del documento, adatti per più tag, paragrafi, tabelle, ecc.
- **Condizioni intelligenti**: Permettono di rimuovere o mantenere direttamente elementi specifici (come righe, paragrafi, immagini, ecc.) con un singolo tag, offrendo una sintassi più concisa.

Tutte le condizioni iniziano con un formattatore di valutazione logica (ad esempio, `ifEQ`, `ifGT`, ecc.), seguito da formattatori di azione (come `show`, `elseShow`, `drop`, `keep`, ecc.).

### Panoramica

Gli operatori logici e i formattatori di azione supportati nelle condizioni includono:

- **Operatori Logici**
  - **ifEQ(value)**: Verifica se il dato è uguale al valore specificato.
  - **ifNE(value)**: Verifica se il dato è diverso dal valore specificato.
  - **ifGT(value)**: Verifica se il dato è maggiore del valore specificato.
  - **ifGTE(value)**: Verifica se il dato è maggiore o uguale al valore specificato.
  - **ifLT(value)**: Verifica se il dato è minore del valore specificato.
  - **ifLTE(value)**: Verifica se il dato è minore o uguale al valore specificato.
  - **ifIN(value)**: Verifica se il dato è contenuto in un array o in una stringa.
  - **ifNIN(value)**: Verifica se il dato NON è contenuto in un array o in una stringa.
  - **ifEM()**: Verifica se il dato è vuoto (ad esempio, `null`, `undefined`, una stringa vuota, un array vuoto o un oggetto vuoto).
  - **ifNEM()**: Verifica se il dato NON è vuoto.
  - **ifTE(type)**: Verifica se il tipo di dato è uguale al tipo specificato (ad esempio, `"string"`, `"number"`, `"boolean"`, ecc.).
  - **and(value)**: Operatore logico "AND", usato per collegare più condizioni.
  - **or(value)**: Operatore logico "OR", usato per collegare più condizioni.

- **Formattatori di Azione**
  - **:show(text) / :elseShow(text)**: Usati nelle condizioni inline per visualizzare direttamente il testo specificato.
  - **:hideBegin / :hideEnd** e **:showBegin / :showEnd**: Usati nei blocchi condizionali per nascondere o mostrare sezioni del documento.
  - **:drop(element) / :keep(element)**: Usati nelle condizioni intelligenti per rimuovere o mantenere elementi specifici del documento.

Le sezioni seguenti presentano la sintassi dettagliata, gli esempi e i risultati per ciascun utilizzo.

### Condizioni Inline

#### 1. :show(text) / :elseShow(text)

##### Sintassi
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternative text)}
```

##### Esempio
Si assuma che i dati siano:
```json
{
  "val2": 2,
  "val5": 5
}
```
Il template è il seguente:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Risultato
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (Condizioni Multiple)

##### Sintassi
Utilizzi formattatori di condizione consecutivi per costruire una struttura simile a uno switch-case:
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(default result)}
```
Oppure ottenga lo stesso risultato con l'operatore `or`:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(default result)}
```

##### Esempio
Dati:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Template:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Risultato
```
val1 = A
val2 = B
val3 = C
```

#### 3. Condizioni Multivariabile

##### Sintassi
Utilizzi gli operatori logici `and`/`or` per testare più variabili:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
```

##### Esempio
Dati:
```json
{
  "val2": 2,
  "val5": 5
}
```
Template:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Risultato
```
and = KO
or = OK
```

### Operatori Logici e Formattatori

Nelle sezioni seguenti, i formattatori descritti utilizzano la sintassi delle condizioni inline con il seguente formato:
```
{data:formatter(parameter):show(text):elseShow(alternative text)}
```

#### 1. :and(value)

##### Sintassi
```
{data:ifEQ(value):and(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Esempio
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Risultato
Se `d.car` è uguale a `'delorean'` E `d.speed` è maggiore di 80, l'output sarà `TravelInTime`; altrimenti, l'output sarà `StayHere`.

#### 2. :or(value)

##### Sintassi
```
{data:ifEQ(value):or(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Esempio
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Risultato
Se `d.car` è uguale a `'delorean'` O `d.speed` è maggiore di 80, l'output sarà `TravelInTime`; altrimenti, l'output sarà `StayHere`.

#### 3. :ifEM()

##### Sintassi
```
{data:ifEM():show(text):elseShow(alternative text)}
```

##### Esempio
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Risultato
Per `null` o un array vuoto, l'output sarà `Result true`; altrimenti, sarà `Result false`.

#### 4. :ifNEM()

##### Sintassi
```
{data:ifNEM():show(text):elseShow(alternative text)}
```

##### Esempio
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Risultato
Per dati non vuoti (come il numero 0 o la stringa 'homer'), l'output sarà `Result true`; per dati vuoti, l'output sarà `Result false`.

#### 5. :ifEQ(value)

##### Sintassi
```
{data:ifEQ(value):show(text):elseShow(alternative text)}
```

##### Esempio
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Risultato
Se il dato è uguale al valore specificato, l'output sarà `Result true`; altrimenti, sarà `Result false`.

#### 6. :ifNE(value)

##### Sintassi
```
{data:ifNE(value):show(text):elseShow(alternative text)}
```

##### Esempio
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Risultato
Il primo esempio produce `Result false`, mentre il secondo produce `Result true`.

#### 7. :ifGT(value)

##### Sintassi
```
{data:ifGT(value):show(text):elseShow(alternative text)}
```

##### Esempio
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Risultato
Il primo esempio produce `Result true`, e il secondo produce `Result false`.

#### 8. :ifGTE(value)

##### Sintassi
```
{data:ifGTE(value):show(text):elseShow(alternative text)}
```

##### Esempio
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Risultato
Il primo esempio produce `Result true`, mentre il secondo produce `Result false`.

#### 9. :ifLT(value)

##### Sintassi
```
{data:ifLT(value):show(text):elseShow(alternative text)}
```

##### Esempio
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Risultato
Il primo esempio produce `Result true`, e il secondo produce `Result false`.

#### 10. :ifLTE(value)

##### Sintassi
```
{data:ifLTE(value):show(text):elseShow(alternative text)}
```

##### Esempio
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Risultato
Il primo esempio produce `Result true`, e il secondo produce `Result false`.

#### 11. :ifIN(value)

##### Sintassi
```
{data:ifIN(value):show(text):elseShow(alternative text)}
```

##### Esempio
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Risultato
Entrambi gli esempi producono `Result true` (poiché la stringa contiene 'is' e l'array contiene 2).

#### 12. :ifNIN(value)

##### Sintassi
```
{data:ifNIN(value):show(text):elseShow(alternative text)}
```

##### Esempio
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Risultato
Il primo esempio produce `Result false` (poiché la stringa contiene 'is'), e il secondo esempio produce `Result false` (poiché l'array contiene 2).

#### 13. :ifTE(type)

##### Sintassi
```
{data:ifTE('type'):show(text):elseShow(alternative text)}
```

##### Esempio
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Risultato
Il primo esempio produce `Result true` (dato che 'homer' è una stringa), e il secondo produce `Result true` (dato che 10.5 è un numero).

### Blocchi Condizionali

I blocchi condizionali vengono utilizzati per mostrare o nascondere una sezione del documento, tipicamente per racchiudere più tag o un intero blocco di testo.

#### 1. :showBegin / :showEnd

##### Sintassi
```
{data:ifEQ(condition):showBegin}
Contenuto del blocco documento
{data:showEnd}
```

##### Esempio
Dati:
```json
{
  "toBuy": true
}
```
Template:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Risultato
Quando la condizione è soddisfatta, il contenuto intermedio viene visualizzato:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Sintassi
```
{data:ifEQ(condition):hideBegin}
Contenuto del blocco documento
{data:hideEnd}
```

##### Esempio
Dati:
```json
{
  "toBuy": true
}
```
Template:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Risultato
Quando la condizione è soddisfatta, il contenuto intermedio viene nascosto, producendo:
```
Banana
Grapes
```