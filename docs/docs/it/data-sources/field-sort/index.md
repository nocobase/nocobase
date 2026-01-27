---
pkg: "@nocobase/plugin-field-sort"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Campo di ordinamento

## Introduzione

I campi di ordinamento vengono utilizzati per ordinare i record in una collezione, supportando l'ordinamento anche all'interno di gruppi.

:::warning
Poiché il campo di ordinamento fa parte della stessa collezione, un record non può essere assegnato a più gruppi quando si utilizza l'ordinamento per gruppo.
:::

## Installazione

È un plugin integrato, non richiede installazione separata.

## Manuale Utente

### Creare un campo di ordinamento

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Quando si creano campi di ordinamento, i valori di ordinamento vengono inizializzati:

- Se l'ordinamento per gruppo non è selezionato, l'inizializzazione si baserà sul campo della chiave primaria e sul campo della data di creazione.
- Se l'ordinamento per gruppo è selezionato, i dati verranno prima raggruppati e poi l'inizializzazione si baserà sul campo della chiave primaria e sul campo della data di creazione.

:::warning{title="Spiegazione della coerenza transazionale"}
- Quando si crea un campo, se l'inizializzazione del valore di ordinamento fallisce, il campo di ordinamento non verrà creato.
- All'interno di un certo intervallo, se un record si sposta dalla posizione A alla posizione B, i valori di ordinamento di tutti i record tra A e B cambieranno. Se una parte di questo aggiornamento fallisce, l'intera operazione di spostamento viene annullata e i valori di ordinamento dei record correlati non subiranno modifiche.
:::

#### Esempio 1: Creare il campo sort1

Il campo sort1 non è raggruppato.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

I campi di ordinamento di ciascun record verranno inizializzati in base al campo della chiave primaria e al campo della data di creazione.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Esempio 2: Creare un campo sort2 basato sul raggruppamento per ID Classe

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

A questo punto, tutti i record nella collezione verranno prima raggruppati (per ID Classe), e poi il campo di ordinamento (sort2) verrà inizializzato. I valori iniziali di ciascun record sono:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Ordinamento tramite trascinamento (Drag-and-Drop)

I campi di ordinamento sono utilizzati principalmente per l'ordinamento tramite trascinamento dei record in vari blocchi. I blocchi che attualmente supportano l'ordinamento tramite trascinamento includono tabelle e bacheche (board).

:::warning
- Quando lo stesso campo di ordinamento viene utilizzato per il trascinamento, l'uso su più blocchi potrebbe alterare l'ordine esistente.
- Il campo per l'ordinamento tramite trascinamento in tabella non può essere un campo di ordinamento con una regola di raggruppamento.
  - Eccezione: In un blocco tabella con relazione uno-a-molti, la chiave esterna può fungere da gruppo.
- Attualmente, solo il blocco bacheca (board) supporta l'ordinamento tramite trascinamento all'interno dei gruppi.
:::

#### Ordinamento tramite trascinamento delle righe della tabella

Blocco tabella

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Blocco tabella di relazione

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
In un blocco con relazione uno-a-molti:

- Se viene selezionato un campo di ordinamento non raggruppato, tutti i record potrebbero partecipare all'ordinamento.
- Se i record vengono prima raggruppati per chiave esterna e poi ordinati, la regola di ordinamento influenzerà solo i dati all'interno del gruppo corrente.

L'effetto finale è coerente, ma il numero di record che partecipano all'ordinamento è diverso. Per maggiori dettagli, consulti [Spiegazione delle regole di ordinamento](#spiegazione-delle-regole-di-ordinamento).
:::

#### Ordinamento tramite trascinamento delle schede della bacheca (board)

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Spiegazione delle regole di ordinamento

#### Spostamento tra elementi non raggruppati (o dello stesso gruppo)

Supponiamo di avere un set di dati:

```
[1,2,3,4,5,6,7,8,9]
```

Quando un elemento, ad esempio il 5, si sposta in avanti nella posizione del 3, solo le posizioni degli elementi 3, 4 e 5 cambiano. L'elemento 5 occupa la posizione del 3, e gli elementi 3 e 4 si spostano indietro di una posizione ciascuno.

```
[1,2,5,3,4,6,7,8,9]
```

Se poi spostiamo l'elemento 6 indietro nella posizione dell'8, l'elemento 6 occupa la posizione dell'8, e gli elementi 7 e 8 si spostano in avanti di una posizione ciascuno.

```
[1,2,5,3,4,7,8,6,9]
```

#### Spostamento di elementi tra gruppi diversi

Quando si ordina per gruppo, se un record viene spostato in un altro gruppo, anche la sua assegnazione al gruppo cambierà. Ad esempio:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Quando l'elemento 1 viene spostato dopo l'elemento 6 (il comportamento predefinito), anche il suo gruppo cambierà da A a B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Le modifiche all'ordinamento sono indipendenti dai dati visualizzati nell'interfaccia

Ad esempio, consideriamo un set di dati:

```
[1,2,3,4,5,6,7,8,9]
```

L'interfaccia mostra solo una vista filtrata:

```
[1,5,9]
```

Quando l'elemento 1 viene spostato nella posizione dell'elemento 9, anche le posizioni di tutti gli elementi intermedi (2, 3, 4, 5, 6, 7, 8) cambieranno, anche se non sono visibili.

```
[2,3,4,5,6,7,8,9,1]
```

L'interfaccia ora mostra il nuovo ordine basato sugli elementi filtrati:

```
[5,9,1]
```