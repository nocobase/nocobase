:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/blocks/block-settings/drag-sort).
:::

# Ordinamento tramite trascinamento

## Introduzione

L'ordinamento tramite trascinamento (drag-and-drop) si basa su un campo di ordinamento per riordinare manualmente i record all'interno di un blocco.


:::info{title=Suggerimento}
* Quando lo stesso campo di ordinamento viene utilizzato per l'ordinamento tramite trascinamento in più blocchi, ciò potrebbe compromettere l'ordine esistente.
* Quando si utilizza l'ordinamento tramite trascinamento in una tabella, il campo di ordinamento non può avere regole di raggruppamento configurate.
* Le tabelle ad albero supportano solo l'ordinamento dei nodi all'interno dello stesso livello.

:::


## Configurazione del trascinamento

Aggiunga un campo di tipo "Ordinamento". I campi di ordinamento non vengono più generati automaticamente durante la creazione di una collezione; devono essere creati manualmente.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Quando si abilita l'ordinamento tramite trascinamento per una tabella, è necessario selezionare un campo di ordinamento.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Ordinamento tramite trascinamento per le righe della tabella


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Spiegazione delle regole di ordinamento

Supponiamo che l'ordine attuale sia:

```
[1,2,3,4,5,6,7,8,9]
```

Quando un elemento (ad esempio il 5) viene spostato in avanti nella posizione del 3, cambieranno solo i valori di ordinamento di 3, 4 e 5: il 5 prende la posizione del 3, mentre il 3 e il 4 si spostano indietro di una posizione ciascuno.

```
[1,2,5,3,4,6,7,8,9]
```

Se successivamente si sposta il 6 all'indietro nella posizione dell'8, il 6 prenderà la posizione dell'8, mentre il 7 e l'8 si sposteranno in avanti di una posizione ciascuno.

```
[1,2,5,3,4,7,8,6,9]
```