---
pkg: "@nocobase/plugin-api-doc"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



pkg: "@nocobase/plugin-api-doc"
---

# Documentazione API



## Introduzione

Questo plugin genera la documentazione delle API HTTP di NocoBase basandosi su Swagger.

## Installazione

È un plugin integrato, non richiede installazione. Basta attivarlo per utilizzarlo.

## Istruzioni per l'Uso

### Accedere alla Pagina della Documentazione API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Panoramica della Documentazione

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Documentazione API Totale: `/api/swagger:get`
- Documentazione API del Core: `/api/swagger:get?ns=core`
- Documentazione API di Tutti i plugin: `/api/swagger:get?ns=plugins`
- Documentazione di Ogni plugin: `/api/swagger:get?ns=plugins/{name}`
- Documentazione API per le collezioni personalizzate: `/api/swagger:get?ns=collections`
- Risorse specificate per `${collection}` e relative a `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## Guida per Sviluppatori

### Come Scrivere la Documentazione Swagger per i Plugin

Aggiunga un file `swagger/index.ts` nella cartella `src` del plugin con il seguente contenuto:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

Per le regole di scrittura dettagliate, La preghiamo di fare riferimento alla [Documentazione Ufficiale di Swagger](https://swagger.io/docs/specification/about/).