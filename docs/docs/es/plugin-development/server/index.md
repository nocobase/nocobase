---
title: "Visión general del desarrollo del Server Plugin"
description: "Desarrollo del Server Plugin de NocoBase: clase Plugin, app, db, recursos, ACL, base de datos, Migration, middleware, eventos, línea de comandos."
keywords: "Server Plugin,clase Plugin,app,db,ACL,Migration,NocoBase"
---

:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Visión general

Los Server Plugins de NocoBase pueden hacer muchas cosas: definir tablas de datos, escribir interfaces personalizadas, gestionar permisos, escuchar eventos, registrar tareas programadas e incluso extender comandos de la CLI. Todas estas capacidades se organizan a través de una clase Plugin unificada.

| Quiero… | Dónde mirar |
| --- | --- |
| Conocer el ciclo de vida de la clase Plugin y los miembros de `app` | [Plugin](./plugin.md) |
| Hacer CRUD sobre la base de datos, gestionar transacciones | [Database](./database.md) |
| Definir o extender tablas de datos por código | [Collections](./collections.md) |
| Migración de datos al actualizar el plugin | [Migration](./migration.md) |
| Gestionar varias fuentes de datos | [DataSourceManager](./data-source-manager.md) |
| Registrar interfaces personalizadas y operaciones de recursos | [ResourceManager](./resource-manager.md) |
| Configurar permisos de las interfaces | [ACL](./acl.md) |
| Añadir interceptores de petición/respuesta o middleware | [Context](./context.md) y [Middleware](./middleware.md) |
| Escuchar eventos de la aplicación o de la base de datos | [Event](./event.md) |
| Mejorar el rendimiento mediante Cache | [Cache](./cache.md) |
| Registrar tareas programadas | [CronJobManager](./cron-job-manager.md) |
| Soporte multilingüe | [I18n](./i18n.md) |
| Salida de logs personalizados | [Logger](./logger.md) |
| Extender comandos de la CLI | [Command](./command.md) |
| Escribir casos de prueba | [Test](./test.md) |

## Enlaces relacionados

- [Plugin](./plugin.md) — ciclo de vida de la clase Plugin, métodos miembros y objeto `app`
- [Collections](./collections.md) — definir o extender la estructura de tablas de datos por código
- [Database](./database.md) — CRUD, Repository, transacciones y eventos de base de datos
- [ResourceManager](./resource-manager.md) — registrar interfaces personalizadas y operaciones de recursos
- [ACL](./acl.md) — permisos de roles, fragmentos de permisos y control de acceso
- [Visión general del desarrollo de plugins](../index.md) — introducción global al desarrollo de plugins
- [Escribir su primer plugin](../write-your-first-plugin.md) — crear un plugin completo desde cero
