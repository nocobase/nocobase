---
title: "La aplicación se inicia automáticamente"
description: "Utilice el inicio automático de la aplicación nb para configurar una entrada de inicio automático de la aplicación unificada para el entorno NocoBase alojado en CLI."
keywords: "NocoBase, inicio automático de aplicaciones, inicio automático de aplicaciones nb, systemd, Docker, PM2"
---


# La aplicación se inicia automáticamente

En NocoBase CLI, `nb app autostart` se usa para administrar "qué envs pueden iniciarse automáticamente" y "cómo activar estos envs de manera uniforme después de que se inicia el sistema".

Si va a ejecutar oficialmente una aplicación alojada en CLI en el servidor, este suele ser el paso predeterminado en un entorno de producción.

## ¿Por qué todavía se necesita `nb app autostart`?

Este problema es muy común.

Cuando muchas personas vean esto por primera vez, pensarán que dado que la capa inferior ya tiene Docker, PM2 o ​​el sistema en sí ya tiene `systemd`, ¿por qué necesitamos otra capa de `nb app autostart`?

La razón es que estas capas en realidad no resuelven el mismo problema:

- Capacidades como Docker, PM2 y Supervisor resuelven el problema de "cómo se ejecutan normalmente las aplicaciones y cómo gestionar los procesos de las aplicaciones".
- Capacidades como `systemd`, `launchd` y scripts de inicio del host resuelven el problema de "¿qué comando ejecutar cuando se inicia el sistema?"
- `nb app autostart` resuelve el problema de "en el nivel CLI de NocoBase, cómo administrar de manera uniforme qué envs pueden iniciarse automáticamente y cómo activarlos después de que se inicia el sistema".

En otras palabras, CLI no elimina la necesidad de Docker, PM2 o ​​Supervisor. En cambio, adapta diferentes métodos de gestión de procesos de manera unificada y luego los converge en un conjunto estable de portales de gestión de inicio automático para reducir las enfermedades mentales del usuario.

Cuando el sistema inicia esta capa, continúa entregándose a `systemd`, `launchd` o al script de inicio del host. Son los encargados de ejecutar cuando arranca la máquina:

```bash
nb app autostart run
```

Este comando abrirá todas las aplicaciones que tengan habilitado el inicio automático.

Sin esta capa, una vez que el método de operación subyacente es diferente, debe recordar los respectivos procesos de configuración y recuperación de inicio automático de Docker, PM2 u otros métodos. Después de agregar `nb app autostart`, solo necesita continuar recordando el mismo conjunto de hábitos de uso de NocoBase CLI.

Si primero desea ver por qué este diseño se divide de esta manera, continúe leyendo [nb intención de diseño de la aplicación] (../cli-design/nb-app-design-intent.md#Why is-nb-app-autostart todavía es necesario).

## ¿Cuáles son las responsabilidades de este grupo de comandos?

Los más utilizados son estos:

- `nb app autostart enable`
- `nb app autostart disable`
- `nb app autostart list`
- `nb app autostart run`

Si sólo nos fijamos en los dos niveles de responsabilidades más comunes, podemos entenderlo así:

- `enable` / `disable` son responsables de gestionar si un determinado entorno permite el inicio automático
- `run` es responsable de activar todos los entornos que tengan habilitado el inicio automático durante la fase de inicio del sistema.

Primero habilite el indicador de inicio automático para el entorno actual:

```bash
nb app autostart enable
```

Si desea operar en algo que no sea el entorno actual, puede especificarlo explícitamente:

```bash
nb app autostart enable --env app1 --yes
```

Después de habilitarlo, puede verificar qué envs se han marcado como de inicio automático:

```bash
nb app autostart list
```

Después de que se inicie el sistema, debe ejecutar el siguiente comando para abrir todos los entornos que tienen el inicio automático habilitado:

```bash
nb app autostart run
```

Si desea ver el resultado de inicio subyacente al solucionar problemas, puede agregar:

```bash
nb app autostart run --verbose
```

Si ya no desea que se inicie un env con el sistema, también puede cancelar esta marca:

```bash
nb app autostart disable --env app1 --yes
```

## ¿Cuál es su relación con Docker, PM2 y systemd?

Aquí hay un límite que puede confundirse fácilmente.

`nb app` Esta capa resuelve el problema de "cómo se ejecuta la aplicación". La capa inferior puede adaptarse a diferentes métodos de ejecución, como Docker y PM2, y puede seguir ampliándose en el futuro.

`nb app autostart` Esta capa resuelve el problema de "cómo abrir el entorno que permite el inicio automático después de iniciar la máquina". Es más como proporcionar un punto de entrada estable para el mecanismo de inicio del host, en lugar de reemplazar una herramienta de gestión de procesos específica.

en otras palabras:

- Capacidades como Docker, PM2 y Supervisor están más cerca de cómo se ejecutan las aplicaciones.
- `systemd`, `launchd`, script de inicio del host, más cerca de la capa de inicio del sistema

Es por eso que, en un entorno formal, generalmente necesita conectar `nb app autostart run` al proceso de inicio de su propio sistema, como `systemd`, `launchd`, scripts de inicio de la plataforma de contenedores u otros mecanismos de inicio automático del host que ya esté utilizando.

## Ámbito de aplicación

`nb app autostart` solo se aplica a entornos con un tiempo de ejecución administrado por CLI, es decir:

- `local`
- `docker`

Si este entorno es solo una conexión API remota o no es una aplicación que se ejecuta bajo administración CLI en la máquina actual, entonces este conjunto de comandos no es adecuado para el inicio automático.

##Práctica predeterminada

En la mayoría de los escenarios, la siguiente secuencia es suficiente:

1. Primero confirme que la aplicación se puede iniciar normalmente en la máquina actual.
2. Ejecute `nb app autostart enable --env <name> --yes`
3. Conecte `nb app autostart run` al sistema para iniciar el proceso.
4. Reinicie la máquina o ejecute manualmente `run` para verificar si se recupera normalmente.

Si aún necesita configurar la capa de entrada de producción a continuación, continúe mirando [proxy inverso] (./reverse-proxy/index.md).

## Comandos relacionados

```bash
nb app autostart enable --env app1 --yes
nb app autostart disable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Enlaces relacionados

- [Descripción general de la implementación del entorno de producción] (./index.md)
- [Proxy inverso](./reverse-proxy/index.md)
- [nb intención de diseño de la aplicación] (../cli-design/nb-app-design-intent.md)
- [Administrar aplicación] (../operaciones/manage-app.md)
