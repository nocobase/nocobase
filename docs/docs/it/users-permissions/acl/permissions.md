---
pkg: '@nocobase/plugin-acl'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Configurazione dei Permessi

## Impostazioni Generali dei Permessi

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Permessi di Configurazione

1.  **Consente la configurazione dell'interfaccia**: Questo permesso determina se un utente può configurare l'interfaccia. Una volta attivato, comparirà il pulsante di configurazione dell'interfaccia utente. Il ruolo "admin" ha questo permesso abilitato di default.
2.  **Consente di installare, attivare, disabilitare i plugin**: Questo permesso controlla se un utente può abilitare o disabilitare i `plugin`. Quando attivo, l'utente avrà accesso all'interfaccia del gestore `plugin`. Il ruolo "admin" ha questo permesso abilitato di default.
3.  **Consente di configurare i plugin**: Questo permesso permette all'utente di configurare i parametri dei `plugin` o di gestire i dati di backend dei `plugin`. Il ruolo "admin" ha questo permesso abilitato di default.
4.  **Consente di svuotare la cache, riavviare l'applicazione**: Questo permesso è legato alle attività di manutenzione del sistema, come lo svuotamento della cache e il riavvio dell'applicazione. Una volta attivato, i pulsanti delle operazioni correlate appariranno nel centro personale. Questo permesso è disabilitato di default.
5.  **Accesso predefinito ai nuovi elementi del menu**: I menu appena creati sono accessibili per impostazione predefinita, e questa impostazione è abilitata di default.

### Permessi di Azione Globali

I `permessi di azione globali` si applicano universalmente a tutte le `collezioni` e sono categorizzati per tipo di operazione. Questi permessi possono essere configurati in base all'ambito dei dati: tutti i dati o i dati propri dell'utente. Il primo consente operazioni sull'intera `collezione`, mentre il secondo limita le operazioni ai dati pertinenti all'utente.

## Permessi di Azione della Collezione

![](https://static-docs.nocobase.com/6a6e0281391cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

I `permessi di azione della collezione` consentono una regolazione più precisa dei `permessi di azione globali`, configurando l'accesso alle risorse all'interno di ogni `collezione`. Questi permessi sono divisi in due aspetti:

1.  **Permessi di azione**: Questi includono le azioni di aggiunta, visualizzazione, modifica, eliminazione, esportazione e importazione. I permessi sono impostati in base all'ambito dei dati:
    -   **Tutti i record**: Concede all'utente la possibilità di eseguire azioni su tutti i record all'interno della `collezione`.
    -   **I propri record**: Limita l'utente a eseguire azioni solo sui record che ha creato.

2.  **Permessi di campo**: I `permessi di campo` Le consentono di impostare permessi specifici per ogni campo durante diverse operazioni. Ad esempio, alcuni campi possono essere configurati per essere di sola visualizzazione, senza privilegi di modifica.

## Permessi di Accesso al Menu

I `permessi di accesso al menu` controllano l'accesso in base agli elementi del menu.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Permessi di Configurazione dei Plugin

I `permessi di configurazione dei plugin` controllano la capacità di configurare parametri specifici dei `plugin`. Quando abilitati, l'interfaccia di gestione `plugin` corrispondente appare nel centro di amministrazione.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)