---
pkg: '@nocobase/plugin-app-supervisor'
---

# Modalità memoria condivisa

## Introduzione

Usa questa modalità per separare i domini business a livello applicativo senza introdurre un'architettura operativa complessa.

## Guida rapida

### Variabili ambiente

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Creazione applicazione

In **System Settings**, apri **App supervisor** e clicca **Add**.

![](https://static-docs.nocobase.com/202512291056215.png)
![](https://static-docs.nocobase.com/202512291057696.png)

### Parametri principali

- **Application display name**
- **Application ID**
- **Start mode** (al primo accesso / con app principale)
- **Environments** (`local`)
- **Database** (nuovo DB, nuova connessione, nuovo schema)
- **Upgrade**
- **JWT Secret**
- **Custom domain**

### Operazioni

- **Start**
- **Visit**
- **Stop**
- **Delete**

Esempio URL:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

![](https://static-docs.nocobase.com/202512291121065.png)
![](https://static-docs.nocobase.com/202512291122113.png)
![](https://static-docs.nocobase.com/202512291122339.png)
![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin condivisi con app principale, configurazioni isolate
- DB indipendente per app
- Backup dell'app principale non include i dati delle altre app
- Le versioni seguono quella dell'app principale
- JWT separato = migliore isolamento sessione
