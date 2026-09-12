---
title: "nb proxy nginx"
description: "Referencia del grupo de comandos nb proxy nginx: gestionar el driver del proveedor Nginx, la generación de configuración y el control de runtime."
keywords: "nb proxy nginx,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx

`nb proxy nginx` es el punto de entrada del grupo de comandos para el proveedor Nginx.

Si ya usas Nginx para gestionar sitios, certificados, caché o control de acceso, este suele ser el lugar adecuado para empezar. Este grupo se encarga de dos cosas:

- elegir cómo se ejecuta Nginx, es decir, como `local` o `docker`
- generar, iniciar, recargar e inspeccionar el punto de entrada de Nginx para los env gestionados por la CLI

## Uso

```bash
nb proxy nginx <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | Cambiar el driver de Nginx |
| [`nb proxy nginx current`](./current.md) | Mostrar el driver actual |
| [`nb proxy nginx generate`](./generate.md) | Generar o actualizar la configuración de Nginx para un env |
| [`nb proxy nginx start`](./start.md) | Iniciar el proxy de Nginx |
| [`nb proxy nginx restart`](./restart.md) | Reiniciar el proxy de Nginx |
| [`nb proxy nginx reload`](./reload.md) | Recargar la configuración de Nginx |
| [`nb proxy nginx stop`](./stop.md) | Detener el proxy de Nginx |
| [`nb proxy nginx status`](./status.md) | Mostrar el estado de runtime de Nginx |
| [`nb proxy nginx info`](./info.md) | Mostrar el driver, las rutas de configuración y la información de runtime |

## Notas

- El driver actual se guarda en `proxy.nginx-driver`
- El driver predeterminado es `local`
- El driver local usa el ejecutable indicado por `bin.nginx`, cuyo valor predeterminado es `nginx`
- El driver Docker usa `nginx:latest`
- El nombre predeterminado del contenedor Docker es `<docker.container-prefix>-nginx-proxy`
- El driver Docker monta `NB_CLI_ROOT` del host dentro del contenedor en `/apps`

## Flujo típico

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app1.example.com
nb proxy nginx start
nb proxy nginx status
nb proxy nginx info
```

## Comandos relacionados

- [`nb proxy`](../index.md)
- [`nb proxy caddy`](../caddy/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
