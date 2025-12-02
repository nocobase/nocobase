---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Sincronizzazione Dati Utente

## Introduzione

Questa funzionalità Le permette di registrare e gestire le fonti di sincronizzazione dei dati utente. Per impostazione predefinita, viene fornita un'API HTTP, ma è possibile supportare fonti dati aggiuntive tramite i plugin. Supporta la sincronizzazione dei dati nelle collezioni **Utenti** e **Dipartimenti** per impostazione predefinita, con la possibilità di estendere la sincronizzazione ad altre risorse di destinazione utilizzando i plugin.

## Gestione e Sincronizzazione delle Fonti Dati

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Se non sono installati plugin che forniscono fonti di sincronizzazione dati utente, è possibile sincronizzare i dati utente tramite l'API HTTP. Fare riferimento a [Fonte Dati - API HTTP](./sources/api.md).
:::

## Aggiungere una Fonte Dati

Dopo aver installato un plugin che fornisce una fonte di sincronizzazione dati utente, può aggiungere la fonte dati corrispondente. Solo le fonti dati abilitate mostreranno i pulsanti "Sincronizza" e "Attività".

> Esempio: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Sincronizzare i Dati

Clicchi sul pulsante **Sincronizza** per avviare la sincronizzazione dei dati.

![](https://static-docs.nocobase.com/202412041055022.png)

Clicchi sul pulsante **Attività** per visualizzare lo stato della sincronizzazione. Dopo una sincronizzazione riuscita, potrà visualizzare i dati negli elenchi **Utenti** e **Dipartimenti**.

![](https://static-docs.nocobase.com/202412041202337.png)

Per le attività di sincronizzazione fallite, può cliccare su **Riprova**.

![](https://static-docs.nocobase.com/202412041058337.png)

In caso di errori di sincronizzazione, può risolvere il problema consultando i log di sistema. Inoltre, i record di sincronizzazione originali sono salvati nella directory `user-data-sync` all'interno della cartella dei log dell'applicazione.

![](https://static-docs.nocobase.com/202412041205655.png)