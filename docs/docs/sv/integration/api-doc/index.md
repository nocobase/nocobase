---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# API-dokumentation

## Introduktion

Detta plugin genererar NocoBase HTTP API-dokumentation baserat på Swagger.

## Installation

Detta är ett inbyggt plugin, så ingen installation krävs. Aktivera det bara för att börja använda det.

## Användningsinstruktioner

### Åtkomst till API-dokumentationssidan

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Dokumentationsöversikt

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Total API-dokumentation: `/api/swagger:get`
- Kärn-API-dokumentation: `/api/swagger:get?ns=core`
- API-dokumentation för alla plugin: `/api/swagger:get?ns=plugins`
- Dokumentation för varje plugin: `/api/swagger:get?ns=plugins/{name}`
- API-dokumentation för anpassade samlingar: `/api/swagger:get?ns=collections`
- Specificerade `${collection}` och relaterade `${collection}.${association}` resurser: `/api/swagger:get?ns=collections/{name}`

## Utvecklarguide

### Hur man skriver Swagger-dokumentation för plugin

Lägg till en `swagger/index.ts`-fil i pluginets `src`-mapp med följande innehåll:

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

För detaljerade skrivregler, se [Swaggers officiella dokumentation](https://swagger.io/docs/specification/about/).