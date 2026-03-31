---
pkg: '@nocobase/plugin-api-keys'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Claves API

## Introducción

## Instrucciones de Uso

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Añadir Clave API

![](https://static-docs.nocobase.com/461872fc0ad9a96fa5b14e97fcba12.png)

**Notas**

- La clave API que usted añada se asignará al usuario actual y heredará su rol.
- Asegúrese de que la variable de entorno `APP_KEY` esté configurada y se mantenga confidencial. Si la `APP_KEY` cambia, todas las claves API que haya añadido dejarán de ser válidas.

### Cómo configurar APP_KEY

Para la versión de Docker, modifique el archivo `docker-compose.yml`.

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Si instaló NocoBase desde el código fuente o usando `create-nocobase-app`, puede modificar directamente la `APP_KEY` en el archivo `.env`.

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```