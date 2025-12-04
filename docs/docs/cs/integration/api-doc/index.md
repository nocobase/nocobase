---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Dokumentace API

## Úvod

Tento plugin generuje dokumentaci NocoBase HTTP API na základě Swaggeru.

## Instalace

Jedná se o vestavěný plugin, který nevyžaduje instalaci. Stačí jej aktivovat a můžete jej začít používat.

## Pokyny k použití

### Přístup ke stránce dokumentace API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Přehled dokumentace

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Celková dokumentace API: `/api/swagger:get`
- Dokumentace základního API (Core API): `/api/swagger:get?ns=core`
- Dokumentace API všech **pluginů**: `/api/swagger:get?ns=plugins`
- Dokumentace pro každý **plugin**: `/api/swagger:get?ns=plugins/{name}`
- Dokumentace API pro vlastní **kolekce**: `/api/swagger:get?ns=collections`
- Dokumentace pro konkrétní `${collection}` a související zdroje `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## Průvodce pro vývojáře

### Jak psát Swagger dokumentaci pro **pluginy**

Do složky `src` **pluginu** přidejte soubor `swagger/index.ts` s následujícím obsahem:

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

Podrobné pokyny k psaní naleznete v [oficiální dokumentaci Swaggeru](https://swagger.io/docs/specification/about/).