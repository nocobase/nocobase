---
pkg: "@nocobase/plugin-api-doc"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Documentación de la API

## Introducción

El plugin genera la documentación de la API HTTP de NocoBase basada en Swagger.

## Instalación

Este es un plugin integrado, por lo que no requiere instalación. Solo necesita activarlo para usarlo.

## Instrucciones de uso

### Acceder a la página de documentación de la API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Resumen de la documentación

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Documentación general de la API: `/api/swagger:get`
- Documentación de la API del núcleo: `/api/swagger:get?ns=core`
- Documentación de la API de todos los **plugins**: `/api/swagger:get?ns=plugins`
- Documentación de cada **plugin**: `/api/swagger:get?ns=plugins/{name}`
- Documentación de la API para **colecciones** personalizadas: `/api/swagger:get?ns=collections`
- Recursos específicos de `${collection}` y sus asociaciones `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## Guía para desarrolladores

### Cómo escribir documentación Swagger para plugins

Agregue un archivo `swagger/index.ts` en la carpeta `src` del plugin con el siguiente contenido:

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

Para conocer las reglas de escritura detalladas, consulte la [Documentación oficial de Swagger](https://swagger.io/docs/specification/about/).