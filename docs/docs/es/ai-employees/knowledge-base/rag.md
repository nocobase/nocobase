---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Generación aumentada por recuperación (RAG)"
description: "Active RAG para los empleados de IA, configure Knowledge Base, Retrieval strategy, Top K y Score, y controle el acceso a las bases de conocimientos mediante los roles de usuario."
keywords: "RAG,generación aumentada por recuperación,recuperación de bases de conocimientos,Retrieval strategy,permisos de bases de conocimientos,Top K,NocoBase"
---

# Recuperación RAG

## Introducción

En NocoBase, **RAG (generación aumentada por recuperación)** permite que un empleado de IA recupere contenido relevante de las bases de conocimientos antes de responder una pregunta.

Las bases de conocimientos que el empleado de IA puede utilizar se determinan tanto por su configuración de `Knowledge Base` como por los permisos de las bases de conocimientos asociados a los roles del usuario actual. Solo se buscan las bases incluidas en ambos ámbitos.

## Configurar las bases de conocimientos de un empleado de IA

Vaya a la página de configuración `AI employees`, seleccione el empleado de IA para el que desea activar RAG y haga clic en `Edit`. En el panel de edición, abra la pestaña `Knowledge Base` y active `Enable`.

![](https://static-docs.nocobase.com/ai-employee-knowledge-base-settings-202608171620.png)

Las opciones disponibles son:

- `Knowledge Base` — Es opcional. Si se deja vacío, el empleado de IA buscará en todas las bases de conocimientos activadas a las que puedan acceder los roles del usuario actual. Si selecciona bases de conocimientos, solo buscará en las seleccionadas para las que el usuario tenga permiso
- `Retrieval strategy` — Controla cuándo se ejecuta la recuperación desde las bases de conocimientos:
  - `Retrieve on demand` — El empleado de IA recupera contenido únicamente cuando determina que la pregunta actual lo necesita. Los nuevos empleados de IA usan esta estrategia de forma predeterminada y es la opción recomendada en la mayoría de los casos
  - `Automatically retrieve for every question` — La recuperación se ejecuta antes de enviar cada pregunta del usuario al empleado de IA. Utilice esta opción cuando cada interacción dependa del contenido de las bases de conocimientos
- `Knowledge Base Prompt` — Define cómo se proporciona el contenido recuperado al empleado de IA. `{knowledgeBaseData}` es un marcador de posición fijo; no lo elimine ni lo modifique
- `Top K` — Es el número máximo de resultados que devuelve cada recuperación. El intervalo es de 1 a 100 y el valor predeterminado es 3
- `Score` — Es la puntuación mínima de similitud que debe alcanzar un resultado. El intervalo es de 0 a 1 y el valor predeterminado es 0,6. Un valor más alto devuelve contenido más relevante, aunque puede reducir el número de resultados

Haga clic en `Submit` para guardar la configuración.

## Configurar los permisos de las bases de conocimientos

Seleccionar bases de conocimientos para un empleado de IA no concede acceso a todos los usuarios. Vaya a `Users & Permissions / Roles & Permissions`, seleccione el rol asignado al usuario y abra `Permissions / Knowledge bases`.

Seleccione `Available` para cada base de conocimientos a la que el rol deba tener acceso. Para conceder automáticamente a este rol acceso a las bases de conocimientos que se creen más adelante, seleccione `New knowledge bases are allowed by default`.

![](https://static-docs.nocobase.com/knowledge-base-role-permissions-202608171620.png)

:::warning Nota

El ámbito de bases de conocimientos disponible para un empleado de IA es la intersección entre su configuración de `Knowledge Base` y los permisos de los roles del usuario actual. Las bases de conocimientos no autorizadas se excluyen automáticamente.

:::

## Cuando el usuario no tiene acceso a ninguna base de conocimientos

Si las bases de conocimientos están activadas para un empleado de IA, pero su ámbito configurado no coincide con los permisos de los roles del usuario actual, el empleado de IA responde primero con información que no depende de una base de conocimientos. Después añade un aviso destacado que indica que no se utilizó contenido de las bases de conocimientos porque el usuario no tiene acceso y recomienda contactar con un administrador.

![](https://static-docs.nocobase.com/ai-employee-no-knowledge-base-access-side-panel-202608171653.png)

Si el usuario puede acceder al menos a una base de conocimientos, pero la pregunta actual no devuelve contenido relevante, no se muestra el aviso de falta de permisos.

## Enlaces relacionados

- [Base de conocimientos](./knowledge-base/index.md) — Crear y mantener las bases de conocimientos utilizadas para la recuperación RAG
- [Roles y permisos](../../users-permissions/acl/permissions.md) — Configurar el acceso al sistema, los menús y los datos para cada rol
