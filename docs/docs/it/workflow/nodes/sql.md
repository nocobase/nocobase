---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Operazione SQL

## Introduzione

In alcuni scenari particolari, i semplici nodi di operazione sulla collezione menzionati in precedenza potrebbero non essere sufficienti per gestire operazioni complesse. In questi casi, può utilizzare direttamente il nodo SQL per far eseguire al database istruzioni SQL complesse per la manipolazione dei dati.

La differenza rispetto alla connessione diretta al database per operazioni SQL al di fuori dell'applicazione è che, all'interno di un flusso di lavoro, Lei può utilizzare le variabili del contesto del processo come parametri nelle istruzioni SQL.

## Installazione

È un plugin integrato, non richiede installazione.

## Creazione del Nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso di lavoro per aggiungere un nodo "Operazione SQL":

![Aggiungi Operazione SQL](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Configurazione del Nodo

![Nodo SQL_Configurazione del Nodo](https://static-docs.nocobase.com/20240904002334.png)

### Fonte Dati

Selezioni la fonte dati su cui eseguire l'SQL.

La fonte dati deve essere di tipo database, come la fonte dati principale, PostgreSQL o altre fonti dati compatibili con Sequelize.

### Contenuto SQL

Modifichi l'istruzione SQL. Attualmente, è supportata una sola istruzione SQL.

Inserisca le variabili necessarie utilizzando il pulsante delle variabili nell'angolo in alto a destra dell'editor. Prima dell'esecuzione, queste variabili verranno sostituite con i loro valori corrispondenti tramite sostituzione di testo. Il testo risultante verrà quindi utilizzato come istruzione SQL finale e inviato al database per la query.

## Risultato dell'Esecuzione del Nodo

A partire dalla versione `v1.3.15-beta`, il risultato dell'esecuzione di un nodo SQL è un array composto da dati puri. Prima di questa versione, era la struttura di ritorno nativa di Sequelize che conteneva i metadati della query (veda: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Ad esempio, la seguente query:

```sql
select count(id) from posts;
```

Risultato prima di `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Risultato dopo `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Domande Frequenti

### Come utilizzare il risultato di un nodo SQL?

Se viene utilizzata un'istruzione `SELECT`, il risultato della query verrà salvato nel nodo in formato JSON di Sequelize. Può essere analizzato e utilizzato con il plugin [JSON-query](./json-query.md).

### L'operazione SQL attiva gli eventi della collezione?

**No**. L'operazione SQL invia direttamente l'istruzione SQL al database per l'elaborazione. Le operazioni `CREATE` / `UPDATE` / `DELETE` correlate avvengono nel database, mentre gli eventi della collezione si verificano a livello di applicazione Node.js (gestiti dall'ORM), quindi gli eventi della collezione non verranno attivati.