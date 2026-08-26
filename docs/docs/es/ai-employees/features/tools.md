---
pkg: '@nocobase/plugin-ai'
title: 'Uso de Tools por los AI Employees'
description: 'Las herramientas (Tools) definen las capacidades del AI Employee: General tools, Employee-specific tools, Custom tools, y la configuración de permisos Ask/Allow.'
keywords: 'herramientas de AI Employee,Tools,Ask,Allow,permisos de habilidades,NocoBase'
---

# Uso de Tools

Las herramientas (Tools) definen "lo que el AI Employee puede hacer".

## Estructura de las Tools

La página de Tools se divide en tres categorías:

1. `General tools`: compartidas por todos los AI Employees y, por lo general, de solo lectura.
2. `Employee-specific tools`: exclusivas del AI Employee actual.
3. `Custom tools`: herramientas personalizadas activadas por el disparador "AI employee event" del workflow; se pueden añadir, eliminar y configurar permisos por defecto.

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## Permisos de las Tools

Los permisos de las Tools se unifican como:

- `Ask`: pide confirmación antes de invocar la herramienta.
- `Allow`: permite la invocación directa.

Recomendación: utilice `Ask` por defecto para las herramientas que modifiquen datos.

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## Descripción de las Tools

### Tools generales

| Nombre de la Tool       | Descripción de la funcionalidad                                                |
| ----------------------- | ------------------------------------------------------------------------------ |
| Form filler             | Rellena los datos en el formulario indicado                                    |
| Chart generator         | Genera la configuración JSON de gráficos ECharts                               |
| Load specific SKILLS    | Carga las Skills y las Tools que dichas Skills requieren                       |
| Suggestions             | Ofrece sugerencias para los siguientes pasos a partir del contenido y contexto de la conversación actual |

### Tools exclusivas

| Nombre de la Tool             | Descripción de la funcionalidad                                          | AI Employee asociado |
| ----------------------------- | ------------------------------------------------------------------------ | -------------------- |
| AI employee task dispatching  | Tool de despacho de trabajo que asigna tareas según el tipo de tarea y las capacidades del AI Employee | Atlas                |
| List AI employees             | Lista todos los AI Employees disponibles                                 | Atlas                |
| Get AI employee               | Obtiene la información detallada del AI Employee indicado, incluidas Skills y Tools | Atlas                |

### Tools personalizadas

Cree un workflow con el tipo de disparador `AI employee event` en el módulo de workflows.

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

En `Custom tools`, haga clic en `Add tool` para añadir el workflow como herramienta utilizable y configure los permisos según el riesgo del negocio.

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
