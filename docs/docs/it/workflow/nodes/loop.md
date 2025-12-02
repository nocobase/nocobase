---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Ciclo

## Introduzione

Un ciclo è equivalente a strutture sintattiche come `for`/`while`/`forEach` nei linguaggi di programmazione. Quando è necessario ripetere alcune operazioni un certo numero di volte o per una `collezione` di dati (array), è possibile utilizzare un nodo Ciclo.

## Installazione

Questo è un `plugin` integrato e non richiede installazione.

## Creazione di un nodo

Nell'interfaccia di configurazione del `flusso di lavoro`, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Ciclo":

![Creazione di un nodo Ciclo](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Dopo aver creato un nodo Ciclo, verrà generato un ramo interno al ciclo. Può aggiungere un numero qualsiasi di nodi all'interno di questo ramo. Questi nodi possono utilizzare non solo le variabili dal contesto del `flusso di lavoro`, ma anche le variabili locali dal contesto del ciclo, come l'`oggetto dati` che viene iterato nella `collezione` del ciclo, o l'`indice` del conteggio del ciclo (l'`indice` parte da `0`). Lo `scope` delle variabili locali è limitato all'interno del ciclo. Se ci sono cicli annidati, può utilizzare le variabili locali del ciclo specifico a ogni livello.

## Configurazione del nodo

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Oggetto del ciclo

Il ciclo gestisce i diversi `tipi di dati` dell'`oggetto del ciclo` in modo differente:

1.  **Array**: Questo è il caso più comune. Di solito può selezionare una variabile dal contesto del `flusso di lavoro`, come i risultati di più dati da un nodo di query, o dati di relazione uno-a-molti precaricati. Se viene selezionato un array, il nodo Ciclo itererà su ogni elemento dell'array, assegnando l'elemento corrente a una variabile locale nel contesto del ciclo per ogni iterazione.

2.  **Numero**: Quando la variabile selezionata è un numero, verrà utilizzata come `numero di iterazioni`. Il valore deve essere un numero intero positivo; i numeri negativi non entreranno nel ciclo e la parte decimale di un numero verrà ignorata. L'`indice` del conteggio del ciclo nella variabile locale è anche il valore dell'`oggetto del ciclo`. Questo valore parte da **0**. Ad esempio, se il numero dell'`oggetto del ciclo` è 5, l'oggetto e l'`indice` in ogni ciclo saranno: 0, 1, 2, 3, 4.

3.  **Stringa**: Quando la variabile selezionata è una stringa, la sua lunghezza verrà utilizzata come `numero di iterazioni`, elaborando ogni `carattere` della stringa per `indice`.

4.  **Altro**: Altri `tipi di valori` (inclusi i `tipi di oggetto`) sono trattati come un `oggetto del ciclo` a singolo elemento e verranno eseguiti solo una volta. Questa situazione di solito non richiede un ciclo.

Oltre a selezionare una variabile, può anche inserire direttamente `costanti` per i `tipi di numero` e `stringa`. Ad esempio, inserendo `5` (tipo numero) il nodo Ciclo itererà 5 volte. Inserendo `abc` (tipo stringa) il nodo Ciclo itererà 3 volte, elaborando rispettivamente i `caratteri` `a`, `b` e `c`. Nello strumento di selezione delle variabili, scelga il `tipo` desiderato per la `costante`.

### Condizione del ciclo

A partire dalla versione `v1.4.0-beta`, sono state aggiunte opzioni relative alle `condizioni del ciclo`. Può abilitare le `condizioni del ciclo` nella configurazione del nodo.

**Condizione**

Simile alla configurazione della `condizione` in un nodo Condizione, può combinare le configurazioni e utilizzare variabili dal ciclo corrente, come l'`oggetto del ciclo`, l'`indice del ciclo`, ecc.

**Tempistica del controllo**

Simile alle strutture `while` e `do/while` nei linguaggi di programmazione, può scegliere di valutare la `condizione` configurata prima dell'inizio di ogni ciclo o dopo la fine di ogni ciclo. La valutazione della post-condizione consente agli altri nodi all'interno del corpo del ciclo di essere eseguiti per un giro prima che la `condizione` venga controllata.

**Quando la condizione non è soddisfatta**

Simile alle istruzioni `break` e `continue` nei linguaggi di programmazione, può scegliere di uscire dal ciclo o continuare all'iterazione successiva.

### Gestione degli errori nei nodi del ciclo

A partire dalla versione `v1.4.0-beta`, quando un nodo all'interno del ciclo non riesce a essere eseguito (a causa di `condizioni` non soddisfatte, errori, ecc.), può configurare il flusso successivo. Sono supportati tre metodi di gestione:

*   Uscire dal `flusso di lavoro` (come `throw` nella programmazione)
*   Uscire dal ciclo e continuare il `flusso di lavoro` (come `break` nella programmazione)
*   Continuare con l'`oggetto del ciclo` successivo (come `continue` nella programmazione)

L'impostazione predefinita è "Uscire dal `flusso di lavoro`", che può essere modificata secondo necessità.

## Esempio

Ad esempio, quando viene effettuato un ordine, è necessario controllare lo `stock` per ogni `prodotto` nell'ordine. Se lo `stock` è sufficiente, deduca lo `stock`; altrimenti, aggiorni il `prodotto` nel `dettaglio ordine` come non valido.

1.  Creare tre `collezioni`: `Prodotti` <-(1:m)-- `Dettagli Ordine` --(m:1)-> `Ordini`. Il `modello di dati` è il seguente:

    | Nome campo        | Tipo di campo               |
    | ----------------- | --------------------------- |
    | Dettagli Ordine   | Uno-a-Molti (Dettagli Ordine) |
    | Prezzo Totale Ordine | Numero                      |

    | Nome campo | Tipo di campo           |
    | ---------- | ----------------------- |
    | Prodotto   | Molti-a-Uno (Prodotto) |
    | Quantità   | Numero                  |

    | Nome campo   | Tipo di campo    |
    | ------------ | ---------------- |
    | Nome Prodotto | Testo su una riga |
    | Prezzo       | Numero           |
    | Stock        | Intero           |

2.  Creare un `flusso di lavoro`. Per il `trigger`, selezioni "Evento della `collezione`" e scelga la `collezione` "Ordini" per attivare "Dopo l'aggiunta di un record". Deve anche configurare il `precaricamento` dei dati di relazione della `collezione` "Dettagli Ordine" e della `collezione` `Prodotti` sotto i dettagli:

    ![Nodo Ciclo_Esempio_Configurazione del trigger](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Creare un nodo Ciclo e selezionare l'`oggetto del ciclo` come "Dati del `trigger` / Dettagli Ordine", il che significa che elaborerà ogni record nella `collezione` Dettagli Ordine:

    ![Nodo Ciclo_Esempio_Configurazione del nodo Ciclo](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  All'interno del nodo Ciclo, creare un nodo "Condizione" per verificare se lo `stock` del `prodotto` è sufficiente:

    ![Nodo Ciclo_Esempio_Configurazione del nodo Condizione](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Se è sufficiente, nel ramo "Sì", creare un "nodo Calcolo" e un "nodo Aggiorna record" per aggiornare il record del `prodotto` corrispondente con lo `stock` dedotto calcolato:

    ![Nodo Ciclo_Esempio_Configurazione del nodo Calcolo](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Nodo Ciclo_Esempio_Configurazione del nodo Aggiorna stock](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  Altrimenti, nel ramo "No", creare un "nodo Aggiorna record" per aggiornare lo `stato` del `dettaglio ordine` a "non valido":

    ![Nodo Ciclo_Esempio_Configurazione del nodo Aggiorna dettaglio ordine](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

La `struttura del flusso di lavoro` complessiva è la seguente:

![Nodo Ciclo_Esempio_Struttura del flusso di lavoro](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Dopo aver configurato e attivato questo `flusso di lavoro`, quando viene creato un nuovo ordine, verrà automaticamente controllato lo `stock` dei `prodotti` nei `dettagli ordine`. Se lo `stock` è sufficiente, verrà dedotto; altrimenti, il `prodotto` nel `dettaglio ordine` verrà aggiornato come non valido (in modo da poter calcolare un `totale ordine` valido).