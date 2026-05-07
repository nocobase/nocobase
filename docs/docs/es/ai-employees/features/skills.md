---
pkg: '@nocobase/plugin-ai'
title: 'Uso de Skills por los AI Employees'
description: 'Las habilidades (Skills) son guías de conocimiento profesional para los AI Employees: General skills y Employee-specific skills.'
keywords: 'habilidades de AI Employee,Skills,NocoBase'
---

# Uso de Skills

Las habilidades (Skills) son guías de conocimiento profesional que se proporcionan a los AI Employees para orientarles en el uso de varias herramientas a la hora de afrontar tareas de áreas profesionales específicas.

Actualmente las Skills no admiten personalización; vienen predefinidas en el sistema.

## Estructura de las Skills

La página de Skills se divide en dos categorías:

1. `General skills`: compartidas por todos los AI Employees y, por lo general, de solo lectura.
2. `Employee-specific skills`: exclusivas del AI Employee actual.

![](https://static-docs.nocobase.com/202604230832639.png)

## Descripción de las Skills

### Skills generales

| Nombre de la Skill        | Descripción de la funcionalidad                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Data metadata             | Obtiene los modelos de datos del sistema, así como metadatos de tablas y campos, para ayudar al AI Employee a comprender el contexto del negocio. |
| Data query                | Consulta datos de las tablas, con soporte para filtros condicionales y consultas de agregación, para ayudar al AI Employee a obtener datos del negocio. |
| Business analysis report  | Genera informes de análisis a partir de los datos del negocio, con soporte para análisis multidimensional y visualizaciones, ayudando al AI Employee a obtener conclusiones de negocio. |
| Document search           | Busca y lee el contenido de documentos preconfigurados, ayudando al AI Employee a completar tareas basadas en documentación; actualmente se utiliza principalmente para escribir código JS. |

### Skills exclusivas

| Nombre de la Skill | Descripción de la funcionalidad                       | AI Employee asociado |
| ------------------ | ----------------------------------------------------- | -------------------- |
| Data modeling      | Skill de modelado de datos: comprende y construye modelos de datos del negocio | Orin                 |
| Frontend developer | Escribe y prueba código JS para bloques del frontend  | Nathan               |
