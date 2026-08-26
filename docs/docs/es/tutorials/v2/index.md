# Tutorial introductorio de NocoBase 2.0

Este tutorial le guiará desde cero para construir un **sistema HelpDesk de tickets de TI minimalista** con NocoBase 2.0. Todo el sistema necesita solo **2 tablas de datos**, sin escribir una sola línea de código, e incluye envío de tickets, gestión de categorías, seguimiento de cambios, control de permisos y un dashboard de datos.

## Posicionamiento del tutorial

- **Público objetivo**: personal de negocio, personal técnico o cualquier persona interesada en NocoBase (se recomienda tener cierta base en informática)
- **Proyecto de ejemplo**: sistema HelpDesk de tickets de TI minimalista, solo 2 tablas
- **Tiempo estimado**: 2-3 horas (personal no técnico), 1-1,5 horas (personal técnico)
- **Requisitos previos**: entorno Docker o [Demo en línea](https://demo-cn.nocobase.com/new) (válido 24 horas, sin instalación)
- **Versión**: NocoBase 2.0

## Lo que aprenderá

A través de la práctica con 7 capítulos, dominará los conceptos centrales y el flujo de construcción de NocoBase:

| # | Capítulo | Puntos clave |
|---|----------|--------------|
| 1 | [Conociendo NocoBase — listo en 5 minutos](./01-getting-started) | Instalación con Docker, modo de configuración vs modo de uso |
| 2 | [Modelado de datos — el esqueleto del sistema de tickets](./02-data-modeling) | Collection/Field, relaciones |
| 3 | [Construcción de páginas — hacer visibles los datos](./03-building-pages) | Block, bloque de tabla, filtrado y ordenación |
| 4 | [Formularios y detalles — permitir capturar datos](./04-forms-and-details) | Bloque de formulario, reglas de campo, historial de registros |
| 5 | [Usuarios y permisos — quién ve qué](./05-roles-and-permissions) | Roles, permisos de menú, permisos de datos |
| 6 | [Workflow — que el sistema funcione solo](./06-workflows) | Notificación automática, disparadores por cambio de estado |
| 7 | [Dashboard — visión global de un vistazo](./07-dashboard) | Gráficos circulares, de líneas y de barras; bloque Markdown |

## Vista previa del modelo de datos

Este tutorial gira en torno a un modelo de datos minimalista — solo **2 tablas**, suficientes para cubrir las funcionalidades clave: modelado de datos, construcción de páginas, diseño de formularios, control de permisos, workflow y dashboard.

| Tabla de datos | Campos principales |
|----------------|--------------------|
| Tickets (tickets) | Título, descripción, estado, prioridad |
| Categorías de tickets (categories) | Nombre de la categoría, color |

## Preguntas frecuentes

### ¿Para qué escenarios es adecuado NocoBase?

Es adecuado para herramientas internas de empresas, sistemas de gestión de datos, flujos de aprobación, CRM, ERP y otros escenarios que requieren personalización flexible, con soporte para despliegue privado.

### ¿Qué conocimientos previos se necesitan para completar este tutorial?

No se requiere programación, pero se recomienda tener cierta base en informática. El tutorial explica progresivamente conceptos como tablas de datos, campos y relaciones; tener experiencia con bases de datos o Excel facilita el aprendizaje.

### ¿Se puede ampliar el sistema del tutorial?

Sí. Este tutorial solo usa 2 tablas, pero NocoBase admite relaciones complejas entre múltiples tablas, integración con API externas, plugins personalizados y mucho más.

### ¿Qué entorno de despliegue se necesita?

Se recomienda Docker (Docker Desktop o servidor Linux), con un mínimo de 2 núcleos y 4 GB de RAM. También admite ejecución desde código fuente con Git. Si solo desea aprender o probar, puede solicitar el [Demo en línea](https://demo-cn.nocobase.com/new) directamente, sin instalación, válido 24 horas.

### ¿Qué limitaciones tiene la versión gratuita?

Las funciones centrales son completamente gratuitas y de código abierto. La versión comercial proporciona plugins avanzados adicionales y soporte técnico; consulte los detalles en [precios de la versión comercial](https://www.nocobase.com/cn/commercial).

## Stack tecnológico relacionado

NocoBase 2.0 está construido sobre las siguientes tecnologías:

- **Framework frontend**: React + [Ant Design](https://ant.design/) 5.0
- **Backend**: Node.js + Koa
- **Base de datos**: PostgreSQL (también admite [MySQL](/get-started/installation/docker) y MariaDB)
- **Despliegue**: [Docker](/get-started/installation/docker), Kubernetes

## Plataformas similares de referencia

Si está evaluando plataformas no-code/low-code, aquí tiene algunas referencias comparativas:

| Plataforma | Características | Diferencias con NocoBase |
|------------|-----------------|--------------------------|
| [Appsmith](https://www.appsmith.com/) | No-code de código abierto, fuerte personalización del frontend | NocoBase se centra más en el modelo de datos |
| [Retool](https://retool.com/) | Plataforma de herramientas internas | NocoBase es totalmente de código abierto, sin restricciones de uso |
| [Airtable](https://airtable.com/) | Base de datos colaborativa en línea | NocoBase admite despliegue privado, con datos bajo su control |
| [Budibase](https://budibase.com/) | Low-code de código abierto, autohospedaje | NocoBase tiene arquitectura basada en plugins, más extensible |

## Documentación relacionada

### Guía de inicio
- [Cómo funciona NocoBase](/get-started/how-nocobase-works) — Introducción a los conceptos clave
- [Inicio rápido](/get-started/quickstart) — Instalación y configuración inicial
- [Requisitos del sistema](/get-started/system-requirements) — Requisitos del entorno

### Más tutoriales
- [Tutorial de NocoBase 1.x](/tutorials/v1/index.md) — Tutorial avanzado con un sistema de gestión de tareas como ejemplo

### Soluciones de referencia
- [Solución de sistema de tickets](/solution/ticket-system/index.md) — Solución inteligente de gestión de tickets impulsada por IA
- [Solución de CRM](/solution/crm/index.md) — Base para la gestión de relaciones con clientes
- [Empleados de IA](/ai-employees/quick-start) — Integre capacidades de IA en su sistema

¿Listo? Empecemos con el [Capítulo 1: Conociendo NocoBase](./01-getting-started).
