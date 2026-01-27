:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

## Gestione dei Cicli

La gestione dei cicli Le permette di eseguire il rendering ripetuto dei dati da array o oggetti, definendo marcatori di inizio e fine per identificare il contenuto da ripetere. Di seguito presentiamo alcuni scenari comuni.

### Iterazione sugli Array

#### 1. Descrizione della Sintassi

- Utilizzi il tag `{d.array[i].proprietà}` per definire l'elemento corrente del ciclo e `{d.array[i+1].proprietà}` per specificare l'elemento successivo, delimitando così l'area del ciclo.
- Durante l'esecuzione del ciclo, la prima riga (la parte `[i]`) viene automaticamente utilizzata come modello per la ripetizione; Le basterà scrivere l'esempio del ciclo una sola volta nel modello.

Formato della sintassi di esempio:
```
{d.nomeArray[i].proprietà}
{d.nomeArray[i+1].proprietà}
```

#### 2. Esempio: Ciclo Semplice su Array

##### Dati
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### Modello
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Risultato
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. Esempio: Ciclo su Array Nidificati

È ideale per i casi in cui un array contiene altri array nidificati, con la possibilità di nidificazioni a livelli illimitati.

##### Dati
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### Modello
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Risultato
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. Esempio: Ciclo Bidirezionale (Funzionalità Avanzata, v4.8.0+)

I cicli bidirezionali Le permettono di iterare contemporaneamente su righe e colonne, rendendoli ideali per la generazione di tabelle comparative e altri layout complessi (nota: attualmente, alcuni formati sono supportati ufficialmente solo nei modelli DOCX, HTML e MD).

##### Dati
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### Modello
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Risultato
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. Esempio: Accesso ai Valori dell'Iteratore del Ciclo (v4.0.0+)

All'interno di un ciclo, può accedere direttamente al valore dell'indice dell'iterazione corrente, facilitando la realizzazione di requisiti di formattazione specifici.

##### Esempio di Modello
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Nota: Il numero di punti indica il livello dell'indice (ad esempio, `.i` rappresenta il livello corrente, mentre `..i` rappresenta il livello precedente). Attualmente esiste un problema di ordine inverso; La preghiamo di consultare la documentazione ufficiale per i dettagli.

### Iterazione sugli Oggetti

#### 1. Descrizione della Sintassi

- Per le proprietà all'interno di un oggetto, può utilizzare `.att` per ottenere il nome della proprietà e `.val` per ottenere il valore della proprietà.
- Durante l'iterazione, ogni proprietà viene elaborata singolarmente.

Formato della sintassi di esempio:
```
{d.nomeOggetto[i].att}  // nome della proprietà
{d.nomeOggetto[i].val}  // valore della proprietà
```

#### 2. Esempio: Iterazione sulle Proprietà dell'Oggetto

##### Dati
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Modello
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Risultato
```
People namePeople age
paul10
jack20
bob30
```

### Ordinamento

Utilizzando la funzionalità di ordinamento, Lei può ordinare direttamente i dati di un array all'interno del modello.

#### 1. Descrizione della Sintassi: Ordinamento Crescente

- Utilizzi un attributo come criterio di ordinamento nel tag del ciclo. Il formato della sintassi è:
  ```
  {d.array[attributoOrdinamento, i].proprietà}
  {d.array[attributoOrdinamento+1, i+1].proprietà}
  ```
- Se necessita di criteri di ordinamento multipli, può separare gli attributi con virgole all'interno delle parentesi quadre.

#### 2. Esempio: Ordinamento per Attributo Numerico

##### Dati
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### Modello
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Risultato
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Esempio: Ordinamento per Attributi Multipli

##### Dati
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### Modello
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Risultato
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### Filtraggio

Il filtraggio Le permette di escludere righe da un ciclo in base a condizioni specifiche.

#### 1. Descrizione della Sintassi: Filtraggio Numerico

- Aggiunga condizioni nel tag del ciclo (ad esempio, `age > 19`). Il formato della sintassi è:
  ```
  {d.array[i, condizione].proprietà}
  ```

#### 2. Esempio: Filtraggio Numerico

##### Dati
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Modello
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Risultato
```
People
John
Bob
```

#### 3. Descrizione della Sintassi: Filtraggio di Stringhe

- Specifichi le condizioni per le stringhe utilizzando virgolette singole. Ad esempio:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Esempio: Filtraggio di Stringhe

##### Dati
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Modello
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Risultato
```
People
Falcon 9
Falcon Heavy
```

#### 5. Descrizione della Sintassi: Filtraggio delle Prime N Voci

- Può utilizzare l'indice del ciclo `i` per filtrare i primi N elementi. Ad esempio:
  ```
  {d.array[i, i < N].proprietà}
  ```

#### 6. Esempio: Filtraggio delle Prime Due Voci

##### Dati
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Modello
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Risultato
```
People
Falcon 9
Model S
```

#### 7. Descrizione della Sintassi: Esclusione delle Ultime N Voci

- Utilizzi l'indicizzazione negativa `i` per rappresentare gli elementi dalla fine. Ad esempio:
  - `{d.array[i=-1].proprietà}` recupera l'ultima voce.
  - `{d.array[i, i!=-1].proprietà}` esclude l'ultima voce.

#### 8. Esempio: Esclusione dell'Ultima Voce e delle Ultime Due Voci

##### Dati
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Modello
```
Ultima voce: {d[i=-1].name}

Esclusione dell'ultima voce:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Esclusione delle ultime due voci:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Risultato
```
Ultima voce: Falcon Heavy

Esclusione dell'ultima voce:
Falcon 9
Model S
Model 3

Esclusione delle ultime due voci:
Falcon 9
Model S
```

#### 9. Descrizione della Sintassi: Filtraggio Intelligente

- Utilizzando blocchi di condizioni intelligenti, Lei può nascondere un'intera riga in base a condizioni complesse. Ad esempio:
  ```
  {d.array[i].proprietà:ifIN('parola chiave'):drop(row)}
  ```

#### 10. Esempio: Filtraggio Intelligente

##### Dati
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Modello
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Risultato
```
People
Model S
Model 3
```
(Nota: Le righe contenenti "Falcon" nel modello vengono rimosse dalla condizione di filtraggio intelligente.)

### Deduplicazione

#### 1. Descrizione della Sintassi

- Utilizzando un iteratore personalizzato, può ottenere voci uniche (non duplicate) basate sul valore di una proprietà. La sintassi è simile a un ciclo normale, ma ignora automaticamente le voci duplicate.

Formato di esempio:
```
{d.array[proprietà].proprietà}
{d.array[proprietà+1].proprietà}
```

#### 2. Esempio: Selezione di Dati Unici

##### Dati
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Modello
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Risultato
```
Vehicles
Hyundai
Airbus
```