---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Collezione Ereditata

## Introduzione

:::warning
Supportato solo quando il database principale è PostgreSQL.
:::

È possibile creare una collezione padre e derivare da essa collezioni figlie. La collezione figlia erediterà la struttura della collezione padre e potrà anche definire le proprie colonne. Questo modello di progettazione aiuta a organizzare e gestire dati con strutture simili ma con possibili differenze.

Ecco alcune caratteristiche comuni delle collezioni ereditate:

-   **Collezione Padre:** La collezione padre contiene colonne e dati comuni, definendo la struttura base dell'intera gerarchia di ereditarietà.
-   **Collezione Figlia:** La collezione figlia eredita la struttura della collezione padre, ma può anche definire le proprie colonne. Ciò consente a ogni collezione figlia di avere le proprietà comuni della collezione padre, pur contenendo attributi specifici della sottoclasse.
-   **Interrogazione (Query):** Durante l'interrogazione, è possibile scegliere di interrogare l'intera gerarchia di ereditarietà, solo la collezione padre o una specifica collezione figlia. Ciò permette di recuperare ed elaborare dati a diversi livelli, a seconda delle necessità.
-   **Relazione di Ereditarietà:** Viene stabilita una relazione di ereditarietà tra la collezione padre e la collezione figlia, il che significa che la struttura della collezione padre può essere utilizzata per definire attributi coerenti, consentendo al contempo alla collezione figlia di estendere o sovrascrivere tali attributi.

Questo modello di progettazione aiuta a ridurre la ridondanza dei dati, a semplificare il modello di database e a rendere i dati più facili da mantenere. Tuttavia, deve essere utilizzato con cautela, poiché le collezioni ereditate possono aumentare la complessità delle interrogazioni, specialmente quando si gestisce l'intera gerarchia di ereditarietà. I sistemi di database che supportano le collezioni ereditate di solito forniscono sintassi e strumenti specifici per gestire e interrogare queste strutture di collezione.

## Manuale Utente

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)