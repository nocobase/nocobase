:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Valore predefinito

## Introduzione

Un valore predefinito è il valore iniziale di un campo quando si crea un nuovo record. È possibile impostare un valore predefinito per un campo quando lo si configura in una collezione, oppure specificarlo per un campo in un blocco del modulo di aggiunta. Può essere impostato come costante o come variabile.

## Dove impostare i valori predefiniti

### Campi della collezione

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Campi in un modulo di aggiunta

La maggior parte dei campi in un modulo di aggiunta supporta l'impostazione di un valore predefinito.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Aggiunta in un sotto-modulo

I sotto-dati aggiunti tramite un campo di sotto-modulo, sia in un modulo di aggiunta che di modifica, avranno un valore predefinito.

Aggiungi nuovo in un sotto-modulo
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Quando si modificano dati esistenti, un campo vuoto non verrà popolato con il valore predefinito. Solo i dati appena aggiunti verranno riempiti con il valore predefinito.

### Valori predefiniti per i campi di relazione

Solo le relazioni di tipo **Molti-a-Uno** e **Molti-a-Molti** hanno valori predefiniti quando si utilizzano componenti selettori (Select, RecordPicker).

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Variabili del valore predefinito

### Quali variabili sono disponibili

- Utente corrente;
- Record corrente; questo si applica solo ai record esistenti;
- Modulo corrente, idealmente elenca solo i campi nel modulo;
- Oggetto corrente, un concetto all'interno dei sotto-moduli (l'oggetto dati per ogni riga nel sotto-modulo);
- Parametri URL
  Per maggiori informazioni sulle variabili, consultare [Variabili](/interface-builder/variables)

### Variabili del valore predefinito del campo

Divise in due categorie: campi non di relazione e campi di relazione.

#### Variabili del valore predefinito per i campi di relazione

- L'oggetto variabile deve essere un record della collezione;
- Deve essere una collezione nella catena di ereditarietà, che può essere la collezione corrente o una collezione padre/figlio;
- La variabile "Record selezionati dalla tabella" è disponibile solo per i campi di relazione "Molti-a-Molti" e "Uno-a-Molti/Molti-a-Uno";
- **Per scenari multi-livello, è necessario appiattire ed eliminare i duplicati**

```typescript
// Record selezionati dalla tabella:
[{id:1},{id:2},{id:3},{id:4}]

// Record selezionati dalla tabella/uno-a-uno:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Appiattisci ed elimina duplicati
[{id: 2}, {id: 3}]

// Record selezionati dalla tabella/uno-a-molti:
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Appiattisci
[{id:1},{id:2},{id:3},{id:4}]
```

#### Variabili del valore predefinito per i campi non di relazione

- I tipi devono essere coerenti o compatibili, ad esempio, le stringhe sono compatibili con i numeri e con tutti gli oggetti che forniscono un metodo toString;
- Il campo JSON è speciale e può memorizzare qualsiasi tipo di dato;

### Livello del campo (Campi opzionali)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Variabili del valore predefinito per i campi non di relazione
  - Quando si selezionano campi multi-livello, è limitato alle relazioni uno-a-uno e non supporta le relazioni uno-a-molti;
  - Il campo JSON è speciale e può essere illimitato;

- Variabili del valore predefinito per i campi di relazione
  - hasOne, supporta solo relazioni uno-a-uno;
  - hasMany, sono supportate sia le relazioni uno-a-uno (conversione interna) che uno-a-molti;
  - belongsToMany, sono supportate sia le relazioni uno-a-uno (conversione interna) che uno-a-molti;
  - belongsTo, generalmente per relazioni uno-a-uno, ma quando la relazione padre è hasMany, supporta anche relazioni uno-a-molti (poiché hasMany/belongsTo è essenzialmente una relazione molti-a-molti);

## Casi speciali

### La relazione "Molti-a-Molti" è equivalente a una combinazione "Uno-a-Molti/Molti-a-Uno"

Modello

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Perché le relazioni Uno-a-Uno e Uno-a-Molti non hanno valori predefiniti?

Ad esempio, in una relazione A.B, se b1 è associato ad a1, non può essere associato ad a2. Se b1 si associa ad a2, la sua associazione con a1 verrà rimossa. In questo caso, i dati non sono condivisi, mentre il valore predefinito è un meccanismo di condivisione (tutti possono essere associati). Pertanto, le relazioni Uno-a-Uno e Uno-a-Molti non possono avere valori predefiniti.

### Perché i sotto-moduli o le sotto-tabelle Molti-a-Uno e Molti-a-Molti non possono avere valori predefiniti?

Questo perché l'obiettivo dei sotto-moduli e delle sotto-tabelle è modificare direttamente i dati di relazione (inclusa l'aggiunta e la rimozione), mentre il valore predefinito di relazione è un meccanismo condiviso in cui tutti possono essere associati, ma i dati di relazione non possono essere modificati. Pertanto, in questo scenario non è opportuno fornire valori predefiniti.

Inoltre, i sotto-moduli o le sotto-tabelle hanno sotto-campi, e non sarebbe chiaro se il valore predefinito per un sotto-modulo o una sotto-tabella sia un valore predefinito di riga o di colonna.

Considerando tutti i fattori, è più appropriato che i sotto-moduli o le sotto-tabelle non possano avere valori predefiniti impostati direttamente, indipendentemente dal tipo di relazione.