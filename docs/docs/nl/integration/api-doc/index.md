---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



pkg: "@nocobase/plugin-api-doc"
---
# API Documentatie

## Introductie

Deze plugin genereert NocoBase HTTP API-documentatie op basis van Swagger.

## Installatie

Dit is een ingebouwde plugin, u hoeft deze niet te installeren. Activeer de plugin om deze te gebruiken.

## Gebruiksaanwijzing

### De API-documentatiepagina openen

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a5a850a0fb664a0.png)

### Overzicht van de documentatie

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Totale API-documentatie: `/api/swagger:get`
- Core API-documentatie: `/api/swagger:get?ns=core`
- API-documentatie voor alle plugins: `/api/swagger:get?ns=plugins`
- Documentatie per plugin: `/api/swagger:get?ns=plugins/{name}`
- API-documentatie voor aangepaste collecties: `/api/swagger:get?ns=collections`
- Specifieke `${collection}` en gerelateerde `${collection}.${association}` resources: `/api/swagger:get?ns=collections/{name}`

## Ontwikkelaarsgids

### Swagger-documentatie schrijven voor plugins

Voeg in de `src`-map van de plugin een bestand `swagger/index.ts` toe met de volgende inhoud:

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

Voor gedetailleerde schrijfregels verwijzen wij u naar de [officiële Swagger-documentatie](https://swagger.io/docs/specification/about/).