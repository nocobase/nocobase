:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica sulle collezioni

NocoBase offre un DSL (Domain-Specific Language) unico per descrivere la struttura dei dati, chiamato **collezione**. Questo DSL unifica le strutture dati provenienti da diverse fonti, fornendo una base affidabile per la gestione, l'analisi e l'applicazione dei dati.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Per utilizzare comodamente vari modelli di dati, NocoBase supporta la creazione di diversi tipi di **collezioni**:

- [Collezione generale](/data-sources/data-source-main/general-collection): Include campi di sistema comuni predefiniti;
- [Collezione con ereditarietà](/data-sources/data-source-main/inheritance-collection): Permette di creare una collezione padre e derivarne una collezione figlia. La collezione figlia eredita la struttura della collezione padre e può definire le proprie colonne.
- [Collezione ad albero](/data-sources/collection-tree): Una collezione con struttura ad albero, che attualmente supporta solo il design a lista di adiacenza;
- [Collezione calendario](/data-sources/calendar/calendar-collection): Utilizzata per creare collezioni di eventi legate al calendario;
- [Collezione file](/data-sources/file-manager/file-collection): Utilizzata per la gestione dell'archiviazione dei file;
- : Utilizzata per scenari di espressioni dinamiche nei **flussi di lavoro**;
- [Collezione SQL](/data-sources/collection-sql): Non è una vera e propria collezione di database, ma presenta rapidamente le query SQL in modo strutturato;
- [Collezione vista](/data-sources/collection-view): Si connette a viste di database esistenti;
- [Collezione esterna](/data-sources/collection-fdw): Permette al sistema di database di accedere e interrogare direttamente i dati in **fonti dati** esterne, basata sulla tecnologia FDW.