---
title: "nb proxy caddy"
description: "Referencia del grupo de comandos nb proxy caddy: gestionar el driver del proveedor Caddy, la generación de configuración y el control de runtime."
keywords: "nb proxy caddy,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy

`nb proxy caddy` es el punto de entrada del grupo de comandos para el proveedor Caddy.

Si ya tienes un dominio, quieres poner HTTPS en marcha rápidamente y no quieres mantener demasiados detalles de TLS por tu cuenta, este suele ser el lugar adecuado para empezar. Este grupo se encarga de dos cosas:

- elegir cómo se ejecuta Caddy, es decir, como `local` o `docker`
- generar, iniciar, recargar e inspeccionar el punto de entrada de Caddy para los env gestionados por la CLI

## Uso

```bash
nb proxy caddy <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | Cambiar el driver de Caddy |
| [`nb proxy caddy current`](./current.md) | Mostrar el driver actual |
| [`nb proxy caddy generate`](./generate.md) | Generar o actualizar la configuración de Caddy para un env |
| [`nb proxy caddy start`](./start.md) | Iniciar el proxy de Caddy |
| [`nb proxy caddy restart`](./restart.md) | Reiniciar el proxy de Caddy |
| [`nb proxy caddy reload`](./reload.md) | Recargar la configuración de Caddy |
| [`nb proxy caddy stop`](./stop.md) | Detener el proxy de Caddy |
| [`nb proxy caddy status`](./status.md) | Mostrar el estado de runtime de Caddy |
| [`nb proxy caddy info`](./info.md) | Mostrar el driver, las rutas de configuración y la información de runtime |

## Notas

- El driver actual se guarda en `proxy.caddy-driver`
- El driver predeterminado es `local`
- El driver local usa el ejecutable indicado por `bin.caddy`, cuyo valor predeterminado es `caddy`
- El driver Docker usa `caddy:latest`
- El nombre predeterminado del contenedor Docker es `<docker.container-prefix>-caddy-proxy`
- El driver Docker monta `NB_CLI_ROOT` del host dentro del contenedor en `/apps`

## Flujo típico

```bash
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app1.example.com
nb proxy caddy start
nb proxy caddy status
nb proxy caddy info
```

## Comandos relacionados

- [`nb proxy`](../index.md)
- [`nb proxy nginx`](../nginx/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
