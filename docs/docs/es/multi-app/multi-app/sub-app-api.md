---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Llamar APIs de subaplicaciones'
description: 'Cómo llamar APIs de subaplicaciones en multiaplicación: acceder a través de la aplicación de entrada y especificar la subaplicación destino con prefijo de ruta, cabecera o parámetro de consulta.'
keywords: 'multiaplicación,API de subaplicación,AppSupervisor,aplicación de entrada,llamada API,NocoBase'
---

# Llamar APIs de subaplicaciones

En un escenario multiaplicación, cada subaplicación tiene sus propias APIs independientes. Al llamar una API de una subaplicación, la aplicación de entrada necesita saber a qué subaplicación debe enrutar la solicitud.

Por ejemplo, una API de la aplicación principal suele ser:

```bash
GET /api/users:list
```

`/api` es el prefijo de API predeterminado y puede personalizarse mediante la variable de entorno `API_BASE_PATH`.

Para llamar la misma API en una subaplicación, especifique el nombre de la subaplicación en la solicitud.

## Usar prefijo de ruta

Use el prefijo `/api/__app/<appName>/` para llamar APIs de subaplicaciones:

```bash
GET /api/__app/a_xxx/users:list
```

Donde:

- `a_xxx` es el nombre de la subaplicación
- `users:list` es el recurso y la acción que se llaman
- `/api` es la ruta base de API del sistema actual

Los parámetros de consulta se pueden añadir normalmente:

```bash
GET /api/__app/a_xxx/users:list?page=1&pageSize=20
```

Este método es claro y adecuado para acceder a APIs de subaplicaciones de forma unificada desde la aplicación de entrada en despliegues multi-entorno.

## Especificar la subaplicación con una cabecera

Si el llamador ya utiliza una dirección fija `/api/...`, puede especificar la subaplicación con la cabecera `X-App`:

```bash
curl \
  -H "X-App: a_xxx" \
  http://localhost:13003/api/users:list
```

Esto es adecuado para llamadas desde servicios backend o cuando una utilidad frontend ya centraliza las URLs de API y solo necesita añadir una cabecera.

## Especificar la subaplicación con un parámetro de consulta

También puede especificar la subaplicación con el parámetro de consulta `__appName`:

```bash
GET /api/users:list?__appName=a_xxx
```

Si hay otros parámetros de consulta, se pueden pasar juntos:

```bash
GET /api/users:list?__appName=a_xxx&page=1&pageSize=20
```

En general, el prefijo de ruta o la cabecera son más claros porque la subaplicación destino queda más explícita.

## Dirección API en despliegues multi-entorno

En despliegues multi-entorno, normalmente hay una aplicación de entrada y varios entornos de ejecución.

Por ejemplo:

- Dirección de la aplicación de entrada: `http://localhost:13003`
- Dirección de un entorno de ejecución: `http://localhost:14000`

Al llamar APIs de subaplicaciones, se recomienda acceder a través de la aplicación de entrada:

```bash
GET http://localhost:13003/api/__app/a_xxx/users:list
```

La aplicación de entrada enruta la solicitud a la subaplicación correspondiente según la configuración. Si sabe claramente qué entorno de ejecución desea visitar, también puede usar su dirección.

```bash
GET http://localhost:14000/api/__app/a_xxx/users:list
```

## Dominios propios de subaplicaciones

Si una subaplicación tiene su propio dominio de acceso, también puede llamar directamente sus APIs desde ese dominio:

```bash
GET https://app-example.example.com/api/users:list
```

Si desea pasar de forma unificada por la aplicación de entrada, siga usando la dirección `/api/__app/<appName>/...` de la aplicación de entrada.

## Autenticación

Al llamar APIs de subaplicaciones, la verificación de permisos sigue basándose en la subaplicación destino.

Esto significa:

- Se requiere un estado de sesión o token de acceso válido para la subaplicación
- El estado de inicio de sesión de la aplicación principal no equivale automáticamente a permisos de API en la subaplicación

Si la solicitud no contiene información de autenticación válida, la subaplicación devolverá un error de no autenticado o sin permisos según su propia configuración de autenticación.
