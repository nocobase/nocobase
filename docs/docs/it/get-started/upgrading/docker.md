:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Aggiornamento di un'installazione Docker

:::warning Prima di aggiornare

- Si assicuri di eseguire prima il backup del database.

:::

## 1. Spostarsi nella directory del file `docker-compose.yml`

Ad esempio

```bash
# macOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Aggiornare il numero di versione dell'immagine

:::tip Informazioni sui numeri di versione

- Le versioni alias, come `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, di solito non richiedono modifiche.
- I numeri di versione numerici, come `1.7.14`, `1.7.14-full`, devono essere modificati con il numero di versione di destinazione.
- Sono supportati solo gli aggiornamenti; i downgrade NON sono supportati!!!
- Si consiglia di fissare una versione numerica specifica in un ambiente di produzione per evitare aggiornamenti automatici involontari. [Visualizza tutte le versioni](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Si consiglia di utilizzare l'immagine di Alibaba Cloud (rete più stabile in Cina)
    image: nocobase/nocobase:1.7.14-full
    # È anche possibile utilizzare una versione alias (potrebbe aggiornarsi automaticamente, usare con cautela in produzione)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (potrebbe essere lento/fallire)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Riavviare il container

```bash
# Scarica l'immagine più recente
docker compose pull app

# Ricrea il container
docker compose up -d app

# Controlla lo stato del processo dell'app
docker compose logs -f app
```

## 4. Aggiornamento dei plugin di terze parti

Fare riferimento a [Installare e aggiornare i plugin](../install-upgrade-plugins.mdx)

## 5. Istruzioni per il rollback

NocoBase non supporta i downgrade. Se ha bisogno di eseguire un rollback, ripristini il backup del database precedente all'aggiornamento e riporti la versione dell'immagine a quella originale.

## 6. Domande frequenti (FAQ)

**D: Scaricamento dell'immagine lento o fallito**

Utilizzi un acceleratore di mirror o l'immagine di Alibaba Cloud `nocobase/nocobase:<tag>`.

**D: La versione non è cambiata**

Si assicuri di aver modificato `image` con il nuovo numero di versione e di aver eseguito correttamente `docker compose pull app` e `up -d app`.

**D: Scaricamento o aggiornamento del plugin commerciale fallito**

Per i plugin commerciali, verifichi la chiave di licenza nel sistema e poi riavvii il container Docker. Per maggiori dettagli, consulti la [Guida all'attivazione della licenza commerciale NocoBase](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).