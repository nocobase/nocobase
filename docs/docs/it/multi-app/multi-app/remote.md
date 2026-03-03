---
pkg: '@nocobase/plugin-app-supervisor'
---

# Modalità multi-ambiente

## Introduzione

Quando shared-memory non è sufficiente in termini di isolamento e stabilità, usa il modello ibrido multi-ambiente.

## Deployment

- **Supervisor**: gestione centralizzata
- **Worker**: esecuzione reale delle app
- **Redis**: cache configurazione e canale comandi

La creazione automatica degli ambienti non è ancora disponibile.

### Variabili Supervisor

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Variabili Worker

```bash
APP_MODE=worker
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=local
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
ENVIRONMENT_NAME=
ENVIRONMENT_URL=
ENVIRONMENT_PROXY_URL=
```

### Esempio Docker Compose

```yaml
services:
  redis:
    image: redis/redis-stack-server:latest
  supervisor:
    image: nocobase/nocobase:alpha
    environment:
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
```

## Uso

Per le operazioni base vedi [modalità memoria condivisa](./local.md).

- Lista ambienti in **Environment**
- Selezione ambiente in creazione app
- Avvio in coda per evitare race condition
- Accesso proxy via `/apps/:appName/admin`

![](https://static-docs.nocobase.com/202512291830371.png)
![](https://static-docs.nocobase.com/202512291835086.png)
![](https://static-docs.nocobase.com/202512291842216.png)
![](https://static-docs.nocobase.com/202512291841727.png)
![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
