---
pkg: "@nocobase/plugin-multi-space"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



pkg: "@nocobase/plugin-multi-space"
---

# Multi-spazio



## Introduzione

Il **plugin Multi-spazio** consente di creare più spazi dati indipendenti all'interno di una singola istanza dell'applicazione, tramite isolamento logico.

#### Casi d'uso
- **Negozi o fabbriche multiple**: I processi aziendali e le configurazioni di sistema sono altamente coerenti (ad esempio, gestione unificata dell'inventario, pianificazione della produzione, strategie di vendita e modelli di report), ma è necessario garantire che i dati di ciascuna unità aziendale non interferiscano tra loro.
- **Gestione di più organizzazioni o filiali**: Diverse organizzazioni o filiali di un gruppo aziendale condividono la stessa piattaforma, ma ogni marchio ha dati indipendenti per clienti, prodotti e ordini.


## Installazione

Nel gestore dei **plugin**, trovi il **plugin Multi-spazio** e lo abiliti.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)


## Manuale Utente

### Gestione Multi-spazio

Dopo aver abilitato il **plugin**, vada alla pagina delle impostazioni **"Utenti e Permessi"** e passi al pannello **Spazi** per gestire gli spazi.

> Inizialmente, è presente uno **Spazio non assegnato** integrato, utilizzato principalmente per visualizzare i dati meno recenti non associati ad alcuno spazio.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Creare uno Spazio

Clicchi sul pulsante "Aggiungi spazio" per creare un nuovo spazio:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Assegnare Utenti

Dopo aver selezionato uno spazio creato, può impostare gli utenti appartenenti a quello spazio sulla destra:

> **Suggerimento:** Dopo aver assegnato gli utenti a uno spazio, è necessario **aggiornare manualmente la pagina** affinché l'elenco di selezione dello spazio nell'angolo in alto a destra si aggiorni e mostri lo spazio più recente.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)


### Cambiare e Visualizzare Multi-spazio

Nell'angolo in alto a destra, può cambiare lo spazio corrente.
Quando clicca sull'**icona a forma di occhio** sulla destra (nello stato evidenziato), può visualizzare contemporaneamente i dati di più spazi.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gestione Dati Multi-spazio

Dopo aver abilitato il **plugin**, il sistema aggiungerà automaticamente un **campo Spazio** quando crea una **collezione**.
**Solo le collezioni che contengono questo campo saranno incluse nella logica di gestione dello spazio.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Per le **collezioni** esistenti, può aggiungere manualmente un campo Spazio per abilitare la gestione dello spazio:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Logica Predefinita

Nelle **collezioni** che contengono il campo Spazio, il sistema applicherà automaticamente la seguente logica:

1. Quando crea dati, questi vengono automaticamente associati allo spazio attualmente selezionato;
2. Quando filtra i dati, questi vengono automaticamente limitati ai dati dello spazio attualmente selezionato.


### Classificazione dei Dati Meno Recenti nel Multi-spazio

Per i dati esistenti prima dell'abilitazione del **plugin Multi-spazio**, può classificarli negli spazi seguendo questi passaggi:

#### 1. Aggiungere il campo Spazio

Aggiunga manualmente il campo Spazio alla **collezione** meno recente:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Assegnare gli utenti allo Spazio non assegnato

Associ gli utenti che gestiscono i dati meno recenti a tutti gli spazi, includendo lo **Spazio non assegnato**, per visualizzare i dati che non sono ancora stati assegnati a uno spazio:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Passare alla visualizzazione di tutti i dati dello spazio

In alto, selezioni la visualizzazione dei dati da tutti gli spazi:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configurare una pagina per l'assegnazione dei dati meno recenti

Crei una nuova pagina per l'assegnazione dei dati meno recenti. Visualizzi il "campo Spazio" nella **pagina elenco** e nella **pagina di modifica** per regolare manualmente l'assegnazione dello spazio.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Renda il campo Spazio modificabile

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Assegnare manualmente i dati agli spazi

Tramite la pagina creata sopra, modifichi manualmente i dati per assegnare gradualmente lo spazio corretto ai dati meno recenti (può anche configurare l'editing in blocco autonomamente).