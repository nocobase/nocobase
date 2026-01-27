---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Molti-a-Molti (Array)

## Introduzione

Questa funzionalità Le permette di utilizzare campi array in una `collezione` di dati per memorizzare più chiavi uniche dalla tabella di destinazione, creando così una relazione molti-a-molti tra le due tabelle. Ad esempio, consideriamo le entità Articoli e Tag. Un articolo può essere collegato a più tag, con la tabella degli articoli che memorizza gli ID dei record corrispondenti dalla tabella dei tag in un campo array.

:::warning{title=Attenzione}

- Quando possibile, Le consigliamo di utilizzare una `collezione` di giunzione per stabilire una relazione [molti-a-molti](../data-modeling/collection-fields/associations/m2m/index.md) standard, invece di affidarsi a questo metodo.
- Attualmente, solo PostgreSQL supporta il filtraggio dei dati della `collezione` di origine utilizzando i campi della tabella di destinazione per le relazioni molti-a-molti stabilite con campi array. Ad esempio, nello scenario sopra, può filtrare gli articoli in base ad altri campi nella tabella dei tag, come il titolo.
  :::

### Configurazione del campo

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Descrizione dei parametri

### Collezione di origine

La `collezione` di origine, ovvero la `collezione` in cui risiede il campo corrente.

### Collezione di destinazione

La `collezione` di destinazione con cui viene stabilita la relazione.

### Chiave esterna

Il campo array nella `collezione` di origine che memorizza la `Target key` dalla tabella di destinazione.

Le relazioni corrispondenti per i tipi di campo array sono le seguenti:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Chiave di destinazione

Il campo nella `collezione` di destinazione che corrisponde ai valori memorizzati nel campo array della tabella di origine. Questo campo deve essere unico.