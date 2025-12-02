:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Distribuzione in Ambiente di Produzione

Quando si distribuisce NocoBase in un ambiente di produzione, l'installazione delle dipendenze può risultare complessa a causa delle diverse modalità di costruzione tra i vari sistemi e ambienti. Per un'esperienza funzionale completa, Le consigliamo di utilizzare **Docker** per la distribuzione. Se il Suo ambiente di sistema non consente l'uso di Docker, può anche optare per la distribuzione tramite **create-nocobase-app**.

:::warning

Non è consigliabile effettuare la distribuzione direttamente dal codice sorgente in un ambiente di produzione. Il codice sorgente presenta numerose dipendenze, ha dimensioni considerevoli e una compilazione completa richiede elevate risorse di CPU e memoria. Se dovesse essere indispensabile la distribuzione dal codice sorgente, Le suggeriamo di creare prima un'immagine Docker personalizzata e solo successivamente procedere con la distribuzione.

:::

## Processo di Distribuzione

Per la distribuzione in ambiente di produzione, può fare riferimento ai passaggi esistenti per l'installazione e l'aggiornamento.

### Nuova Installazione

- [Installazione Docker](../installation/docker.mdx)
- [Installazione create-nocobase-app](../installation/create-nocobase-app.mdx)

### Aggiornamento dell'Applicazione

- [Aggiornamento di un'installazione Docker](../installation/docker.mdx)
- [Aggiornamento di un'installazione create-nocobase-app](../installation/create-nocobase-app.mdx)

### Installazione e Aggiornamento di Plugin di Terze Parti

- [Installazione e Aggiornamento dei Plugin](../install-upgrade-plugins.mdx)

## Proxy per le Risorse Statiche

In un ambiente di produzione, Le consigliamo di gestire le risorse statiche tramite un server proxy, ad esempio:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Comandi Comuni per le Operazioni

A seconda del metodo di installazione, può utilizzare i seguenti comandi per gestire il processo NocoBase:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)