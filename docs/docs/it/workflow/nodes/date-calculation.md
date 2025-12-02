---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Calcolo Data

## Introduzione

Il nodo Calcolo Data offre nove funzioni di calcolo, tra cui l'aggiunta o la sottrazione di un periodo di tempo, la formattazione di stringhe temporali e la conversione di unità di durata. Ogni funzione ha tipi specifici di valori di input e output e può anche ricevere i risultati di altri nodi come variabili di parametro. Utilizza una pipeline di calcolo per concatenare i risultati delle funzioni configurate, ottenendo infine un output desiderato.

## Creare un Nodo

Nell'interfaccia di configurazione del **flusso di lavoro**, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Calcolo Data":

![Nodo Calcolo Data_Creare Nodo](https://static-docs.nocobase.com/[图片].png)

## Configurazione del Nodo

![Nodo Calcolo Data_Configurazione Nodo](https://static-docs.nocobase.com/20240817184423.png)

### Valore di Input

Il valore di input può essere una variabile o una costante data. La variabile può essere il dato che ha attivato questo **flusso di lavoro** o il risultato di un nodo precedente nello stesso **flusso di lavoro**. Per la costante, può selezionare una data qualsiasi.

### Tipo di Valore di Input

Si riferisce al tipo del valore di input. Ci sono due possibili valori.

*   Tipo Data: Indica che il valore di input può essere convertito in un tipo data-ora, come un timestamp numerico o una stringa che rappresenta un orario.
*   Tipo Numerico: Poiché il tipo di valore di input influenza la selezione dei passaggi di calcolo temporale successivi, è necessario selezionare correttamente il tipo di valore di input.

### Passaggi di Calcolo

Ogni passaggio di calcolo è composto da una funzione di calcolo e dalla sua configurazione dei parametri. Adotta un design a pipeline, dove il risultato del calcolo della funzione precedente serve come valore di input per il calcolo della funzione successiva. In questo modo, è possibile completare una serie di calcoli e conversioni temporali.

Dopo ogni passaggio di calcolo, il tipo di output è fisso e influenzerà le funzioni disponibili per il passaggio di calcolo successivo. Il calcolo può continuare solo se i tipi corrispondono. Altrimenti, il risultato di un passaggio sarà l'output finale del nodo.

## Funzioni di Calcolo

### Aggiungere un periodo di tempo

-   Tipo di valore di input accettato: Data
-   Parametri
    -   La quantità da aggiungere, che può essere un numero o una variabile predefinita del nodo.
    -   Unità di tempo.
-   Tipo di valore di output: Data
-   Esempio: Se il valore di input è `2024-7-15 00:00:00`, la quantità è `1` e l'unità è "giorno", il risultato del calcolo sarà `2024-7-16 00:00:00`.

### Sottrarre un periodo di tempo

-   Tipo di valore di input accettato: Data
-   Parametri
    -   La quantità da sottrarre, che può essere un numero o una variabile predefinita del nodo.
    -   Unità di tempo.
-   Tipo di valore di output: Data
-   Esempio: Se il valore di input è `2024-7-15 00:00:00`, la quantità è `1` e l'unità è "giorno", il risultato del calcolo sarà `2024-7-14 00:00:00`.

### Calcolare la differenza con un altro orario

-   Tipo di valore di input accettato: Data
-   Parametri
    -   La data con cui calcolare la differenza, che può essere una costante data o una variabile dal contesto del **flusso di lavoro**.
    -   Unità di tempo.
    -   Se calcolare il valore assoluto.
    -   Operazione di arrotondamento: Le opzioni includono mantenere i decimali, arrotondare, arrotondare per eccesso e arrotondare per difetto.
-   Tipo di valore di output: Numerico
-   Esempio: Se il valore di input è `2024-7-15 00:00:00`, l'oggetto di confronto è `2024-7-16 06:00:00`, l'unità è "giorno", non si calcola il valore assoluto e si mantengono i decimali, il risultato del calcolo sarà `-1.25`.

:::info{title=Suggerimento}
Quando il valore assoluto e l'arrotondamento sono configurati contemporaneamente, viene prima calcolato il valore assoluto e poi applicato l'arrotondamento.
:::

### Ottenere il valore di un orario in un'unità specifica

-   Tipo di valore di input accettato: Data
-   Parametri
    -   Unità di tempo.
-   Tipo di valore di output: Numerico
-   Esempio: Se il valore di input è `2024-7-15 00:00:00` e l'unità è "giorno", il risultato del calcolo sarà `15`.

### Impostare la data all'inizio di un'unità specifica

-   Tipo di valore di input accettato: Data
-   Parametri
    -   Unità di tempo.
-   Tipo di valore di output: Data
-   Esempio: Se il valore di input è `2024-7-15 14:26:30` e l'unità è "giorno", il risultato del calcolo sarà `2024-7-15 00:00:00`.

### Impostare la data alla fine di un'unità specifica

-   Tipo di valore di input accettato: Data
-   Parametri
    -   Unità di tempo.
-   Tipo di valore di output: Data
-   Esempio: Se il valore di input è `2024-7-15 14:26:30` e l'unità è "giorno", il risultato del calcolo sarà `2024-7-15 23:59:59`.

### Verificare se è un anno bisestile

-   Tipo di valore di input accettato: Data
-   Parametri
    -   Nessun parametro
-   Tipo di valore di output: Booleano
-   Esempio: Se il valore di input è `2024-7-15 14:26:30`, il risultato del calcolo sarà `true`.

### Formattare come stringa

-   Tipo di valore di input accettato: Data
-   Parametri
    -   Formato, si riferisca a [Day.js: Format](https://day.js.org/docs/zh-CN/display/format)
-   Tipo di valore di output: Stringa
-   Esempio: Se il valore di input è `2024-7-15 14:26:30` e il formato è `the time is YYYY/MM/DD HH:mm:ss`, il risultato del calcolo sarà `the time is 2024/07/15 14:26:30`.

### Convertire unità

-   Tipo di valore di input accettato: Numerico
-   Parametri
    -   Unità di tempo prima della conversione.
    -   Unità di tempo dopo la conversione.
    -   Operazione di arrotondamento: Le opzioni includono mantenere i decimali, arrotondare, arrotondare per eccesso e arrotondare per difetto.
-   Tipo di valore di output: Numerico
-   Esempio: Se il valore di input è `2`, l'unità prima della conversione è "settimana", l'unità dopo la conversione è "giorno" e non si mantengono i decimali, il risultato del calcolo sarà `14`.

## Esempio

![Nodo Calcolo Data_Esempio](https://static-docs.nocobase.com/20240817184137.png)

Supponiamo ci sia un evento promozionale e desideriamo aggiungere un orario di fine promozione al campo di un prodotto al momento della sua creazione. Questo orario di fine è alle 23:59:59 dell'ultimo giorno della settimana successiva all'orario di creazione del prodotto. Possiamo quindi creare due funzioni temporali e farle eseguire in una pipeline:

-   Calcolare l'orario per la settimana successiva
-   Reimpostare il risultato alle 23:59:59 dell'ultimo giorno di quella settimana

In questo modo, otteniamo il valore temporale desiderato e lo passiamo al nodo successivo, ad esempio un nodo di modifica della **collezione**, per aggiungere l'orario di fine promozione alla **collezione**.