---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/multi-space/multi-space).
:::

# Multi-spazio

## Introduzione

Il plugin **Multi-spazio** consente di disporre di più spazi dati indipendenti all'interno di una singola istanza dell'applicazione attraverso l'isolamento logico.

#### Scenari applicativi
- **Più punti vendita o fabbriche**: i processi aziendali e le configurazioni di sistema sono altamente coerenti (ad esempio, gestione dell'inventario, pianificazione della produzione, strategie di vendita e modelli di reportistica unificati), ma è necessario garantire che i dati di ogni unità aziendale non interferiscano tra loro.
- **Gestione multi-organizzazione o filiali**: più organizzazioni o filiali di una holding condividono la stessa piattaforma, ma ogni marchio dispone di dati indipendenti relativi a clienti, prodotti e ordini.

## Installazione

Individui il plugin **Multi-spazio (Multi-Space)** nel Gestore plugin e lo abiliti.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Manuale d'uso

### Gestione multi-spazio

Dopo aver abilitato il plugin, acceda alla pagina delle impostazioni **「Utenti e permessi」** e passi al pannello **Spazi** per gestire gli spazi.

> Inizialmente esisterà uno **Spazio non assegnato (Unassigned Space)** predefinito, utilizzato principalmente per visualizzare i vecchi dati non ancora associati a uno spazio.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Creare uno spazio

Clicchi sul pulsante "Aggiungi spazio" per creare un nuovo spazio:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Assegnare utenti

Dopo aver selezionato lo spazio creato, è possibile impostare sul lato destro gli utenti appartenenti a tale spazio:

> **Suggerimento:** Dopo aver assegnato gli utenti a uno spazio, è necessario **aggiornare manualmente la pagina** affinché l'elenco di commutazione degli spazi nell'angolo in alto a destra si aggiorni e mostri gli spazi più recenti.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Commutazione e visualizzazione multi-spazio

Nell'angolo in alto a destra è possibile cambiare lo spazio corrente.  
Facendo clic sull'**icona dell'occhio** a destra (stato evidenziato), è possibile visualizzare contemporaneamente i dati di più spazi.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gestione dei dati multi-spazio

Una volta attivato il plugin, il sistema preimposterà automaticamente un **campo spazio** durante la creazione di una tabella dati (collezione).  
**Solo le tabelle che contengono questo campo saranno incluse nella logica di gestione dello spazio.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Per le tabelle dati esistenti, è possibile aggiungere manualmente il campo spazio per abilitare la gestione dello spazio:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Logica predefinita

Nelle tabelle dati che includono il campo spazio, il sistema applicherà automaticamente la seguente logica:

1. Durante la creazione dei dati, questi verranno associati automaticamente allo spazio attualmente selezionato;
2. Durante il filtraggio dei dati, la visualizzazione sarà limitata automaticamente ai dati dello spazio attualmente selezionato.

### Classificazione multi-spazio dei dati esistenti

Per i dati esistenti prima dell'abilitazione del plugin Multi-spazio, è possibile procedere alla classificazione degli spazi seguendo questi passaggi:

#### 1. Aggiungere il campo spazio

Aggiunga manualmente il campo spazio alla vecchia tabella:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Assegnare gli utenti allo spazio non assegnato

Associ gli utenti che gestiscono i vecchi dati a tutti gli spazi, includendo lo **Spazio non assegnato (Unassigned Space)** per poter visualizzare i dati che non appartengono ancora a nessuno spazio:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Passare alla visualizzazione dei dati di tutti gli spazi

Selezioni in alto l'opzione per visualizzare i dati di tutti gli spazi:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configurare la pagina di assegnazione dei dati esistenti

Crei una nuova pagina dedicata all'assegnazione dei vecchi dati, visualizzando il "campo spazio" sia nella **pagina elenco** che nella **pagina di modifica**, in modo da regolare manualmente l'appartenenza allo spazio.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Imposti il campo spazio come modificabile:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Assegnare manualmente lo spazio dati

Attraverso la pagina sopra menzionata, modifichi manualmente i dati per assegnare gradualmente lo spazio corretto ai vecchi dati (è anche possibile configurare autonomamente la modifica massiva).