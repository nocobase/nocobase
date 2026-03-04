:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/system-management/localization/index).
:::

# Gestione della localizzazione

## Introduzione

Il plugin per la gestione della localizzazione viene utilizzato per gestire e implementare le risorse di localizzazione di NocoBase. È possibile tradurre i menu di sistema, le collezioni, i campi e tutti i plugin per adattarli alla lingua e alla cultura di regioni specifiche.

## Installazione

Questo plugin è integrato e non richiede un'installazione aggiuntiva.

## Istruzioni per l'uso

### Attivazione del plugin

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Accesso alla pagina di gestione della localizzazione

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Sincronizzazione delle voci di traduzione

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Attualmente è supportata la sincronizzazione dei seguenti contenuti:

- Pacchetti linguistici locali del sistema e dei plugin
- Titoli delle collezioni, titoli dei campi ed etichette delle opzioni dei campi
- Titoli dei menu

Al termine della sincronizzazione, il sistema elencherà tutte le voci traducibili per la lingua corrente.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Suggerimento}
Moduli diversi possono presentare le stesse voci di testo originali, che devono essere tradotte separatamente.
:::

### Creazione automatica delle voci

Durante l'editing della pagina, i testi personalizzati in ogni blocco creeranno automaticamente le voci corrispondenti e genereranno simultaneamente il contenuto della traduzione per la lingua corrente.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Suggerimento}
Quando si definisce un testo nel codice, è necessario specificare manualmente il ns (namespace), ad esempio: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Modifica del contenuto della traduzione

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Pubblicazione della traduzione

Al termine della traduzione, è necessario fare clic sul pulsante "Pubblica" affinché le modifiche diventino effettive.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Traduzione in altre lingue

Abiliti altre lingue nelle "Impostazioni di sistema", ad esempio il cinese semplificato.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Passi all'ambiente di tale lingua.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Sincronizzi le voci.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Traduca e pubblichi.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>