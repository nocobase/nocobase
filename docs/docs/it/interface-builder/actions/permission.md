:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Permessi di Azione

## Introduzione

In NocoBase 2.0, i permessi di azione sono attualmente controllati principalmente dai permessi delle risorse delle **collezioni**:

- **Permessi delle risorse della collezione**: Servono a controllare in modo uniforme i permessi di azione di base (come Creazione, Visualizzazione, Modifica ed Eliminazione) che i diversi ruoli hanno su una **collezione**. Questo permesso si applica all'intera **collezione** all'interno della **fonte dati**, garantendo che i permessi di un ruolo per le azioni corrispondenti su quella **collezione** rimangano coerenti tra diverse pagine, popup e blocchi.
<!-- - **Permessi di Azione Indipendenti**: Utilizzati per un controllo granulare su quali azioni sono visibili a ruoli diversi, adatti per la gestione dei permessi per azioni specifiche come Attivare un flusso di lavoro, Richiesta Personalizzata, Link Esterno, ecc. Questo tipo di permesso è adatto per il controllo dei permessi a livello di azione, consentendo a ruoli diversi di eseguire azioni specifiche senza influenzare la configurazione dei permessi dell'intera collezione. -->

### Permessi delle risorse della collezione

Nel sistema di permessi di NocoBase, i permessi di azione sulle **collezioni** sono fondamentalmente suddivisi secondo le dimensioni CRUD, per garantire coerenza e standardizzazione nella gestione dei permessi. Ad esempio:

- **Permesso di Creazione (Create)**: Controlla tutte le azioni relative alla creazione per la **collezione**, incluse le azioni di aggiunta e duplicazione. Se un ruolo possiede il permesso di creazione per questa **collezione**, le sue azioni di aggiunta, duplicazione e altre azioni correlate alla creazione saranno visibili in tutte le pagine e nei popup.
- **Permesso di Eliminazione (Delete)**: Controlla l'azione di eliminazione per questa **collezione**. Il permesso rimane coerente, sia che si tratti di un'azione di eliminazione in blocco in un blocco tabella, sia di un'azione di eliminazione per un singolo record in un blocco dettagli.
- **Permesso di Modifica (Update)**: Controlla le azioni di tipo modifica per questa **collezione**, come le azioni di modifica e di aggiornamento dei record.
- **Permesso di Visualizzazione (View)**: Controlla la visibilità dei dati di questa **collezione**. I blocchi dati correlati (Tabella, Elenco, Dettagli, ecc.) sono visibili solo quando il ruolo ha il permesso di visualizzazione per questa **collezione**.

Questo metodo di gestione universale dei permessi è adatto per il controllo standardizzato dei permessi sui dati, garantendo che per la `stessa collezione`, la `stessa azione` abbia regole di permesso `coerenti` tra `diverse pagine, popup e blocchi`, fornendo uniformità e manutenibilità.

#### Permessi Globali

I permessi di azione globali si applicano a tutte le **collezioni** sotto la **fonte dati**, e sono classificati per tipo di risorsa come segue:

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Permessi di Azione Specifici per Collezione

I permessi di azione specifici per **collezione** hanno la precedenza sui permessi generali della **fonte dati**, affinando ulteriormente i permessi di azione e consentendo configurazioni personalizzate per l'accesso alle risorse di una **collezione** specifica. Questi permessi sono divisi in due aspetti:

1.  Permessi di azione: I permessi di azione includono le azioni di aggiunta, visualizzazione, modifica, eliminazione, esportazione e importazione. Questi permessi sono configurati in base alla dimensione dell'ambito dei dati:

    -   Tutti i dati: Consente agli utenti di eseguire azioni su tutti i record nella **collezione**.
    -   I propri dati: Limita gli utenti a eseguire azioni solo sui record di dati che hanno creato.

2.  Permessi sui campi: I permessi sui campi consentono di configurare i permessi per ogni campo in diverse azioni. Ad esempio, alcuni campi possono essere configurati per essere solo visualizzabili e non modificabili.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

<!-- ### Permessi di Azione Indipendenti

> **Nota**: Questa funzionalità è supportata **dalla versione v1.6.0-beta.13 in poi**

A differenza dei permessi di azione unificati, i permessi di azione indipendenti controllano solo l'azione stessa, consentendo alla stessa azione di avere diverse configurazioni di permesso in posizioni diverse.

Questo metodo di permesso è adatto per azioni personalizzate, ad esempio:

Le azioni di attivazione di un flusso di lavoro potrebbero dover richiamare flussi di lavoro diversi su pagine o blocchi diversi, richiedendo quindi un controllo dei permessi indipendente.
Le azioni personalizzate in posizioni diverse eseguono logiche di business specifiche e sono adatte per una gestione dei permessi separata.

Attualmente, i permessi indipendenti possono essere configurati per le seguenti azioni:

-   Popup (controlla la visibilità e i permessi di azione del popup)
-   Link (limita se un ruolo può accedere a link esterni o interni)
-   Attivare un flusso di lavoro (per richiamare flussi di lavoro diversi su pagine diverse)
-   Azioni nel pannello delle azioni (ad es. scansione codice, azione popup, attivazione flusso di lavoro, link esterno)
-   Richiesta personalizzata (invia una richiesta a una terza parte)

Attraverso la configurazione dei permessi di azione indipendenti, è possibile gestire i permessi di azione di ruoli diversi in modo più granulare, rendendo il controllo dei permessi più flessibile.

![20250306215749](https://static-docs.nocobase.com/20250306215749.png)

Se non viene impostato alcun ruolo, è visibile a tutti i ruoli per impostazione predefinita.

![20250306215854](https://static-docs.nocobase.com/20250306215854.png) -->

## Documentazione Correlata

[Configurare i Permessi]
<!-- (/users-and-permissions) -->