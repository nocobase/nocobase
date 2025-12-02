:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

## Formattatori

I formattatori vengono utilizzati per convertire i dati grezzi in testo di facile lettura. Si applicano ai dati utilizzando i due punti (`:`) e possono essere concatenati, in modo che l'output di ciascun formattatore diventi l'input per il successivo. Alcuni formattatori supportano parametri costanti o parametri dinamici.


### Panoramica

#### 1. Spiegazione della Sintassi
La forma base per richiamare un formattatore è la seguente:
```
{d.proprietà:formattatore1:formattatore2(...)}
```  
Ad esempio, nel caso di conversione della stringa `"JOHN"` in `"John"`, si utilizza prima il formattatore `lowerCase` per convertire tutte le lettere in minuscolo, e poi `ucFirst` per mettere in maiuscolo la prima lettera.

#### 2. Esempio
Dati:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Template:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Risultato
Dopo il rendering, l'output è:
```
My name is John. I was born on January 31, 2000.
```


### Parametri Costanti

#### 1. Spiegazione della Sintassi
Molti formattatori supportano uno o più parametri costanti, che sono separati da virgole e racchiusi tra parentesi per modificare l'output. Ad esempio, `:prepend(myPrefix)` aggiungerà "myPrefix" davanti al testo.  
**Nota:** Se il parametro contiene virgole o spazi, deve essere racchiuso tra virgolette singole, ad esempio: `prepend('my prefix')`.

#### 2. Esempio
Esempio di template (per i dettagli, consulti l'utilizzo specifico del formattatore).

#### 3. Risultato
L'output avrà il prefisso specificato aggiunto davanti al testo.


### Parametri Dinamici

#### 1. Spiegazione della Sintassi
I formattatori supportano anche parametri dinamici. Questi parametri iniziano con un punto (`.`) e non sono racchiusi tra virgolette.  
Ci sono due metodi per specificare i parametri dinamici:
- **Percorso JSON Assoluto:** Inizia con `d.` o `c.` (riferendosi ai dati radice o ai dati supplementari).
- **Percorso JSON Relativo:** Inizia con un singolo punto (`.`), indicando che la proprietà viene cercata dall'oggetto padre corrente.

Ad esempio:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Può anche essere scritto come percorso relativo:
```
{d.subObject.qtyB:add(.qtyC)}
```
Se ha bisogno di accedere a dati da un livello superiore (padre o superiore), può utilizzare più punti:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Esempio
Dati:
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
Utilizzo nel Template:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Risultato: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Risultato: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Risultato: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Risultato: 6 (3 + 3)
```

#### 3. Risultato
Gli esempi producono rispettivamente 8, 8, 28 e 6.

> **Nota:** L'utilizzo di iteratori personalizzati o filtri di array come parametri dinamici non è consentito, ad esempio:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```