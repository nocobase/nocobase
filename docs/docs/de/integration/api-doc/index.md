---
pkg: "@nocobase/plugin-api-doc"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



pkg: "@nocobase/plugin-api-doc"
---

# API-Dokumentation



## Einführung

Das Plugin generiert die NocoBase HTTP API-Dokumentation basierend auf Swagger.

## Installation

Dies ist ein integriertes Plugin, das keine Installation erfordert. Aktivieren Sie es einfach, um es zu nutzen.

## Nutzungshinweise

### Auf die API-Dokumentationsseite zugreifen

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Dokumentationsübersicht

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Gesamte API-Dokumentation: `/api/swagger:get`
- API-Dokumentation des Kerns: `/api/swagger:get?ns=core`
- API-Dokumentation aller Plugins: `/api/swagger:get?ns=plugins`
- Dokumentation jedes Plugins: `/api/swagger:get?ns=plugins/{name}`
- API-Dokumentation für benutzerdefinierte Sammlungen: `/api/swagger:get?ns=collections`
- Spezifizierte `${collection}` und zugehörige `${collection}.${association}` Ressourcen: `/api/swagger:get?ns=collections/{name}`

## Entwicklerhandbuch

### So schreiben Sie Swagger-Dokumentation für Plugins

Fügen Sie im `src`-Ordner des Plugins eine Datei namens `swagger/index.ts` mit folgendem Inhalt hinzu:

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

Detaillierte Schreibregeln finden Sie in der [offiziellen Swagger-Dokumentation](https://swagger.io/docs/specification/about/).