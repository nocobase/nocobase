:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Campi di relazione

In NocoBase, i campi di relazione non sono campi reali, ma vengono utilizzati per stabilire connessioni tra le collezioni. Questo concetto è equivalente alle relazioni nei database relazionali.

Nei database relazionali, i tipi di relazione più comuni includono i seguenti:

- [Uno a uno (One-to-one)](./o2o/index.md): Ogni entità in due collezioni corrisponde a una sola entità nell'altra collezione. Questo tipo di relazione viene solitamente utilizzato per archiviare diversi aspetti di un'entità in collezioni separate, al fine di ridurre la ridondanza e migliorare la coerenza dei dati.
- [Uno a molti (One-to-many)](./o2m/index.md): Ogni entità in una collezione può essere associata a più entità in un'altra collezione. Questo è uno dei tipi di relazione più comuni. Ad esempio, un autore può scrivere più articoli, ma ogni articolo può avere un solo autore.
- [Molti a uno (Many-to-one)](./m2o/index.md): Più entità in una collezione possono essere associate a una singola entità in un'altra collezione. Questo tipo di relazione è comune anche nella modellazione dei dati. Ad esempio, più studenti possono appartenere alla stessa classe.
- [Molti a molti (Many-to-many)](./m2m/index.md): Più entità in due collezioni possono essere associate tra loro. Questo tipo di relazione richiede tipicamente una collezione intermedia per registrare le associazioni tra le entità. Ad esempio, la relazione tra studenti e corsi: uno studente può iscriversi a più corsi e un corso può avere più studenti.

Questi tipi di relazioni svolgono un ruolo importante nella progettazione di database e nella modellazione dei dati, aiutando a descrivere relazioni e strutture di dati complesse del mondo reale.